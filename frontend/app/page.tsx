"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import MarkdownContent from "./chat/MarkdownContent";
import { ChatError, ChatHistoryMessage, ChatTurn } from "./chat/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const LOGO_SRC = "/logo-without-text.png";
const USER_AVATAR_SRC = "/user-avatar.png";
const HISTORY_WINDOW_TURNS = 6;

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveRequestId, setLiveRequestId] = useState("");
  const [liveLatencyMs, setLiveLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorRequestId, setErrorRequestId] = useState("");

  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const stoppedByUserRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);

  const canSubmit = question.trim().length > 0 && !loading;
  const hasConversation =
    turns.length > 0 || !!pendingQuestion || !!liveAnswer || !!errorMessage;

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
  }, [loading]);

  useEffect(() => {
    if (!loading || !liveAnswer) {
      return;
    }
    scrollToLogBottom("auto");
  }, [loading, liveAnswer]);

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
    stoppedByUserRef.current = false;
    setQuestion("");
    setPendingQuestion("");
    setTurns([]);
    setLiveAnswer("");
    setLiveRequestId("");
    setLiveLatencyMs(null);
    setLoading(false);
    setErrorMessage("");
    setErrorRequestId("");
  };

  const stopGeneration = () => {
    if (!loading) {
      return;
    }
    stoppedByUserRef.current = true;
    activeAbortControllerRef.current?.abort();
  };

  const buildHistoryWindow = (): ChatHistoryMessage[] => {
    return turns
      .slice(-HISTORY_WINDOW_TURNS)
      .flatMap((turn) => [
        { role: "user" as const, content: turn.question },
        { role: "assistant" as const, content: turn.answer },
      ]);
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
    setLiveAnswer("");
    setLiveRequestId("");
    setLiveLatencyMs(null);

    const controller = new AbortController();
    stoppedByUserRef.current = false;
    activeAbortControllerRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 60000);
    const history = buildHistoryWindow();
    let streamedAnswer = "";
    let requestId = "";
    let latencyMs: number | null = null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          tenant_id: "tenant_personal_default",
          edition: "personal",
          history,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json()) as ChatError;
        setErrorMessage(`${payload.error_code}: ${payload.error_message || "请求失败"}`);
        setErrorRequestId(payload.request_id || "");
        return;
      }

      if (!response.body) {
        setErrorMessage("后端未返回流式响应体。");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const lines = frame.split("\n");
          let eventName = "";
          let dataRaw = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataRaw += line.slice(5).trim();
            }
          }

          if (!eventName || !dataRaw) {
            continue;
          }

          try {
            const payload = JSON.parse(dataRaw) as Record<string, unknown>;

            if (eventName === "delta") {
              const delta = typeof payload.delta === "string" ? payload.delta : "";
              if (delta) {
                streamedAnswer += delta;
                setLiveAnswer(streamedAnswer);
              }
              if (!requestId && typeof payload.request_id === "string") {
                requestId = payload.request_id;
                setLiveRequestId(requestId);
              }
              continue;
            }

            if (eventName === "done") {
              if (typeof payload.request_id === "string") {
                requestId = payload.request_id;
                setLiveRequestId(requestId);
              }
              if (typeof payload.latency_ms === "number") {
                latencyMs = payload.latency_ms;
                setLiveLatencyMs(latencyMs);
              }
              continue;
            }

            if (eventName === "error") {
              const code =
                typeof payload.error_code === "string" ? payload.error_code : "UNKNOWN_ERROR";
              const message =
                typeof payload.error_message === "string" ? payload.error_message : "请求失败";
              const rid = typeof payload.request_id === "string" ? payload.request_id : "";
              setErrorMessage(`${code}: ${message}`);
              setErrorRequestId(rid);
              return;
            }
          } catch {
            continue;
          }
        }
      }

      appendTurn(content, streamedAnswer, requestId, latencyMs);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (streamedAnswer.trim()) {
          appendTurn(content, streamedAnswer, requestId, latencyMs);
        }
        if (!stoppedByUserRef.current) {
          setErrorMessage("请求超时，请稍后重试。");
        }
      } else {
        setErrorMessage("无法连接后端服务，请确认 FastAPI 已启动。");
      }
    } finally {
      activeAbortControllerRef.current = null;
      stoppedByUserRef.current = false;
      window.clearTimeout(timer);
      setLoading(false);
      setPendingQuestion("");
      setLiveAnswer("");
      setLiveRequestId("");
      setLiveLatencyMs(null);
    }
  };

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-icon" aria-hidden="true">
              <Image src={LOGO_SRC} alt="" width={20} height={20} className="brand-logo" />
            </span>
            <span>aikai</span>
          </div>
          <button className="sidebar-new-button" type="button" onClick={resetToHome}>
            <span aria-hidden="true">+</span>
            <span>新对话</span>
          </button>
        </div>

        <div className="sidebar-history">
          <p className="sidebar-section-title">历史记录</p>
          <button className="sidebar-item sidebar-item-active" type="button">
            当前对话
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-row" type="button">
            <span className="sidebar-footer-icon" aria-hidden="true">
              ◐
            </span>
            <span>外观</span>
          </button>
          <div className="sidebar-footer-row">
            <span className="sidebar-avatar-placeholder" aria-hidden="true">
              U
            </span>
            <span>访客用户</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <div className="workspace-inner">
          <div className="chat-log" ref={chatLogRef}>
            {!hasConversation && (
              <article className="message-row message-row-assistant fade-in">
                <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                  <Image src={LOGO_SRC} alt="" width={26} height={26} className="brand-logo" />
                </div>
                <div className="assistant-intro">你好，我是 aikai。今天想让我帮你做什么？</div>
              </article>
            )}

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
                    <Image src={LOGO_SRC} alt="" width={26} height={26} className="brand-logo" />
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

            {(loading || !!pendingQuestion) && (
              <article className="chat-turn" key="live-turn">
                <div className="message-row message-row-user">
                  <div className="message-avatar message-avatar-user" aria-hidden="true">
                    <Image src={USER_AVATAR_SRC} alt="" width={34} height={34} className="user-avatar-img" />
                  </div>
                  <div className="question-bubble pending-question">{pendingQuestion}</div>
                </div>
                <div className="message-row message-row-assistant">
                  <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                    <Image src={LOGO_SRC} alt="" width={26} height={26} className="brand-logo" />
                  </div>
                  <div className="answer-block" aria-live="polite">
                    <MarkdownContent content={liveAnswer || "思考中..."} />
                    {(liveRequestId || liveLatencyMs !== null) && (
                      <details className="meta-details">
                        <summary aria-label="查看请求信息" title="查看请求信息">
                          <span className="meta-icon" aria-hidden="true">
                            i
                          </span>
                        </summary>
                        <div className="ops-row">
                          请求ID: {liveRequestId || "-"} | 延迟: {liveLatencyMs ?? "-"} ms
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            )}

            {!!errorMessage && (
              <article className="message-row message-row-assistant">
                <div className="message-avatar message-avatar-assistant" aria-hidden="true">
                  <Image src={LOGO_SRC} alt="" width={26} height={26} className="brand-logo" />
                </div>
                <div className="error-block">
                  <h3>请求失败</h3>
                  <p>{errorMessage}</p>
                  <p>请求ID: {errorRequestId || "-"}</p>
                </div>
              </article>
            )}
          </div>

          <form className="composer" onSubmit={submitQuestion}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={hasConversation ? "继续追问..." : "请输入你的问题..."}
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
          <p className="workspace-note">AI 可能会犯错，请核验关键信息。</p>
        </div>
      </section>
    </main>
  );
}


