"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

type Phase = "home" | "loading" | "chat";

type ChatSuccess = {
  answer: string;
  request_id: string;
  latency_ms: number;
};

type ChatError = {
  error_code: string;
  error_message: string;
  request_id: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("home");
  const [question, setQuestion] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [requestId, setRequestId] = useState("");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const answerParagraphs = useMemo(
    () => answerText.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    [answerText],
  );

  const resetToHome = () => {
    setPhase("home");
    setQuestion("");
    setActiveQuestion("");
    setAnswerText("");
    setRequestId("");
    setLatencyMs(null);
    setErrorMessage("");
  };

  const submitQuestion = async (event: FormEvent) => {
    event.preventDefault();
    const content = question.trim();
    if (!content) {
      return;
    }

    setErrorMessage("");
    setAnswerText("");
    setRequestId("");
    setLatencyMs(null);
    setActiveQuestion(content);
    setPhase("loading");

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 16000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          tenant_id: "tenant_personal_default",
          edition: "personal",
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as ChatSuccess | ChatError;

      if (!response.ok) {
        const errPayload = payload as ChatError;
        setErrorMessage(
          `${errPayload.error_code}: ${errPayload.error_message || "请求失败"}`,
        );
        setRequestId(errPayload.request_id || "");
        setPhase("chat");
        setQuestion("");
        return;
      }

      const successPayload = payload as ChatSuccess;
      setAnswerText(successPayload.answer);
      setRequestId(successPayload.request_id);
      setLatencyMs(successPayload.latency_ms);
      setPhase("chat");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setErrorMessage("请求超时，请稍后重试。");
      } else {
        setErrorMessage(
          "无法连接后端服务。请先在本地启动 FastAPI（http://localhost:8000）。",
        );
      }
      setPhase("chat");
    } finally {
      window.clearTimeout(timer);
      setQuestion("");
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <Image src="/logo.png" alt="" width={20} height={20} />
          </span>
          <span className="brand-text">aikai</span>
        </div>
        <button className="top-action" type="button" onClick={resetToHome}>
          + New Chat
        </button>
      </header>

      {phase === "home" && (
        <section className="home-state fade-in">
          <div className="avatar">AI</div>
          <h1>How can I help you today?</h1>
          <p>
            Ask me a question, explore a topic, or generate ideas. I&apos;m here to
            provide simple, direct answers.
          </p>

          <div className="prompt-cards">
            <button
              className="prompt-card"
              type="button"
              onClick={() => setQuestion("帮我总结一下今天需要做的三件事")}
            >
              <strong>Brainstorm ideas</strong>
              <span>Creative concepts for a minimalist website.</span>
            </button>
            <button
              className="prompt-card"
              type="button"
              onClick={() => setQuestion("请给我一个可执行的学习计划")}
            >
              <strong>Summarize text</strong>
              <span>Condense this article into three key points.</span>
            </button>
          </div>
        </section>
      )}

      {(phase === "loading" || phase === "chat") && (
        <section className="chat-state fade-in">
          <div className="question-bubble">{activeQuestion}</div>

          {phase === "loading" && (
            <div className="loading-block" aria-live="polite">
              <span className="dot" />
              <span>Thinking...</span>
            </div>
          )}

          {phase === "chat" && !errorMessage && (
            <article className="answer-block">
              <div className="label">INSIGHT</div>
              {answerParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="ops-row">
                request_id: {requestId || "-"} · latency: {latencyMs ?? "-"} ms
              </div>
            </article>
          )}

          {phase === "chat" && !!errorMessage && (
            <article className="error-block">
              <h3>Request Failed</h3>
              <p>{errorMessage}</p>
              <p>request_id: {requestId || "-"}</p>
            </article>
          )}
        </section>
      )}

      <form className="composer" onSubmit={submitQuestion}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            phase === "home" ? "Ask me anything..." : "Type your next question..."
          }
        />
        <button type="submit" disabled={phase === "loading"}>
          {phase === "home" ? "➤" : "Ask"}
        </button>
      </form>

      <footer className="foot-note">AI MODEL: LOCAL MOCK BACKEND · V1.0 BASELINE</footer>
    </main>
  );
}
