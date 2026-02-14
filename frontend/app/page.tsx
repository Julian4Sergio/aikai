"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import MarkdownContent from "./chat/MarkdownContent";
import { ChatError, ChatTurn, StreamDeltaPayload, StreamDonePayload } from "./chat/types";
import { useTypewriter } from "./chat/useTypewriter";
import { buildHistory, parseSseEvent, safeJsonParse } from "./chat/utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const USER_AVATAR_SRC = "/user-avatar.png";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorRequestId, setErrorRequestId] = useState("");

  const { streamingText, enqueue, finish, reset } = useTypewriter(15);

  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const userStoppedRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);

  const canSubmit = question.trim().length > 0 && !loading;
  const hasConversation =
    turns.length > 0 || !!pendingQuestion || !!streamingText || !!errorMessage;

  const scrollToLogBottom = (behavior: ScrollBehavior) => {
    const container = chatLogRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!hasConversation) {
      return;
    }
    scrollToLogBottom("auto");
  }, [hasConversation, turns.length, pendingQuestion, errorMessage]);

  useEffect(() => {
    if (!loading) {
      return;
    }
    if (scrollFrameRef.current !== null) {
      return;
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      scrollToLogBottom("auto");
    });
  }, [streamingText, loading]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  const appendTurn = (
    turnQuestion: string,
    answer: string,
    requestId: string,
    latencyMs: number | null,
  ) => {
    const finalAnswer = answer.trim();
    if (!finalAnswer) {
      return;
    }
    setTurns((prev) => [
      ...prev,
      {
        question: turnQuestion,
        answer: finalAnswer,
        requestId,
        latencyMs,
      },
    ]);
  };

  const resetToHome = () => {
    activeAbortControllerRef.current?.abort();
    activeAbortControllerRef.current = null;
    userStoppedRef.current = false;
    reset();
    setQuestion("");
    setPendingQuestion("");
    setTurns([]);
    setLoading(false);
    setErrorMessage("");
    setErrorRequestId("");
  };

  const stopGeneration = () => {
    if (!loading) {
      return;
    }
    userStoppedRef.current = true;
    activeAbortControllerRef.current?.abort();
  };

  const submitQuestion = async (event: FormEvent) => {
    event.preventDefault();
    const content = question.trim();
    if (!content || loading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setErrorRequestId("");
    setPendingQuestion(content);
    setQuestion("");
    reset();

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    userStoppedRef.current = false;
    const timer = window.setTimeout(() => controller.abort(), 60000);

    let finalRequestId = "";
    let finalLatencyMs: number | null = null;
    let accumulatedAnswer = "";
    let failed = false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: buildHistory(turns),
          tenant_id: "tenant_personal_default",
          edition: "personal",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json()) as ChatError;
        setErrorMessage(`${payload.error_code}: ${payload.error_message || "请求失败"}`);
        setErrorRequestId(payload.request_id || "");
        failed = true;
        return;
      }

      if (!response.body) {
        setErrorMessage("流式响应为空");
        failed = true;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEventBlock = (block: string) => {
        const parsed = parseSseEvent(block);
        if (!parsed) {
          return;
        }

        if (parsed.event === "delta") {
          const delta = safeJsonParse<StreamDeltaPayload>(parsed.data);
          if (!delta || typeof delta.content !== "string") {
            return;
          }
          accumulatedAnswer += delta.content;
          enqueue(delta.content);
          return;
        }

        if (parsed.event === "done") {
          const donePayload = safeJsonParse<StreamDonePayload>(parsed.data);
          if (!donePayload) {
            return;
          }
          finalRequestId = donePayload.request_id || "";
          finalLatencyMs = donePayload.latency_ms ?? null;
          return;
        }

        if (parsed.event === "error") {
          const errPayload = safeJsonParse<ChatError>(parsed.data);
          if (!errPayload) {
            return;
          }
          setErrorMessage(`${errPayload.error_code}: ${errPayload.error_message || "请求失败"}`);
          setErrorRequestId(errPayload.request_id || "");
          failed = true;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          handleEventBlock(block);
        }
      }

      if (buffer.trim()) {
        handleEventBlock(buffer.trim());
      }

      await finish();

      if (!failed) {
        appendTurn(content, accumulatedAnswer, finalRequestId, finalLatencyMs);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (userStoppedRef.current) {
          await finish();
          appendTurn(content, accumulatedAnswer, finalRequestId, finalLatencyMs);
          failed = false;
        } else {
          failed = true;
          setErrorMessage("请求超时，请稍后重试。");
        }
      } else {
        failed = true;
        setErrorMessage("无法连接后端服务，请确认 FastAPI 已启动。");
      }
    } finally {
      activeAbortControllerRef.current = null;
      userStoppedRef.current = false;
      window.clearTimeout(timer);
      setLoading(false);
      setPendingQuestion("");
      reset();
      if (failed && finalRequestId) {
        setErrorRequestId((prev) => prev || finalRequestId);
      }
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <Image src="/logo-v2.png" alt="" width={32} height={32} className="brand-logo" />
          </span>
          <span className="brand-text">aikai</span>
        </div>
        <button className="top-action" type="button" onClick={resetToHome}>
          + 新对话
        </button>
      </header>

      {!hasConversation && (
        <section className="home-state fade-in">
          <div className="avatar" aria-hidden="true">
            <Image src="/logo-v2.png" alt="" width={86} height={86} className="avatar-logo" />
          </div>
          <h1>今天想让我帮你做什么？</h1>
          <p>你可以提问、探索一个主题，或者让我帮你梳理思路。</p>

          <div className="prompt-cards">
            <button
              className="prompt-card"
              type="button"
              onClick={() => setQuestion("给我一些极简风格网站的创意方向。")}
            >
              <strong>头脑风暴</strong>
              <span>给我一些极简风格网站的创意方向。</span>
            </button>
            <button
              className="prompt-card"
              type="button"
              onClick={() => setQuestion("把这篇文章浓缩成三个重点。")}
            >
              <strong>内容总结</strong>
              <span>把这篇文章浓缩成三个重点。</span>
            </button>
          </div>
        </section>
      )}

      {hasConversation && (
        <section className="chat-state fade-in">
          <div className="chat-log" ref={chatLogRef}>
            {turns.map((item, index) => (
              <article className="chat-turn" key={`${item.requestId}-${index}`}>
                <div className="message-row message-row-user">
                  <div className="message-avatar message-avatar-user" aria-hidden="true">
                    <Image src={USER_AVATAR_SRC} alt="" width={34} height={34} className="user-avatar-img" />
                  </div>
                  <div className="question-bubble">{item.question}</div>
                </div>
                <div className="message-row message-row-assistant">
                  <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                    <Image src="/logo-v2.png" alt="" width={26} height={26} className="brand-logo" />
                  </div>
                  <div className="answer-block">
                    <MarkdownContent content={item.answer} />
                    <details className="meta-details">
                      <summary aria-label="查看请求信息" title="查看请求信息">
                        <span className="meta-icon" aria-hidden="true">
                          i
                        </span>
                      </summary>
                      <div className="ops-row">
                        请求ID: {item.requestId || "-"} | 延迟: {item.latencyMs ?? "-"} ms
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}

            {(loading || !!streamingText || !!pendingQuestion) && (
              <article className="chat-turn" key="live-turn">
                <div className="message-row message-row-user">
                  <div className="message-avatar message-avatar-user" aria-hidden="true">
                    <Image src={USER_AVATAR_SRC} alt="" width={34} height={34} className="user-avatar-img" />
                  </div>
                  <div className="question-bubble pending-question">{pendingQuestion}</div>
                </div>
                <div className="message-row message-row-assistant">
                  <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                    <Image src="/logo-v2.png" alt="" width={26} height={26} className="brand-logo" />
                  </div>
                  <div className="answer-block" aria-live="polite">
                    <MarkdownContent content={streamingText || "思考中..."} />
                  </div>
                </div>
              </article>
            )}

            {!!errorMessage && (
              <article className="message-row message-row-assistant">
                <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                  <Image src="/logo-v2.png" alt="" width={26} height={26} className="brand-logo" />
                </div>
                <div className="error-block">
                  <h3>请求失败</h3>
                  <p>{errorMessage}</p>
                  <p>请求ID: {errorRequestId || "-"}</p>
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      <form className="composer" onSubmit={submitQuestion}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={hasConversation ? "继续提问..." : "请输入问题..."}
        />
        <button
          className={`send-button ${loading ? "send-button-stop" : ""}`}
          type={loading ? "button" : "submit"}
          onClick={loading ? stopGeneration : undefined}
          disabled={!loading && !canSubmit}
          aria-label={loading ? "停止生成" : "发送"}
        >
          {loading ? (
            <svg className="send-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          ) : (
            <svg className="send-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M21.8 3.2a1 1 0 0 0-1.05-.22L3.25 9.55a1 1 0 0 0 .08 1.88l7.14 2.37 2.37 7.14a1 1 0 0 0 1.88.08l6.57-17.5a1 1 0 0 0-.22-1.05ZM12.1 18.2l-1.67-5.03a1 1 0 0 0-.63-.63L4.78 10.9l13.57-5.1L12.1 18.2Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </form>
    </main>
  );
}
