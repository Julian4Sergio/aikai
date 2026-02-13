"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

type Phase = "home" | "loading" | "chat";

const mockAnswers = [
  {
    intro:
      "Practicing mindfulness in a high-pressure workplace serves as a cognitive anchor, helping professionals navigate complex demands with greater clarity and emotional resilience.",
    cardA:
      "Mindfulness reduces multitasking noise and helps teams sustain priority focus with lower mental fatigue.",
    cardB:
      "It creates a pause between stimulus and reaction, enabling more measured communication during stress.",
    ending:
      "Over time, even short daily practice can improve collaboration quality and perceived productivity across teams.",
  },
  {
    intro:
      "For early-stage product teams, concise rituals and shared context reduce decision churn and improve shipping cadence.",
    cardA:
      "Daily focus windows lower context switching and protect deep work for core architecture tasks.",
    cardB:
      "A short async check-in can surface risks earlier without adding heavy meeting overhead.",
    ending:
      "The practical outcome is fewer blocked tasks and a steadier release rhythm under pressure.",
  },
];

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("home");
  const [question, setQuestion] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [showError, setShowError] = useState(false);
  const [answerIndex, setAnswerIndex] = useState(0);

  const answer = mockAnswers[answerIndex];

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const content = question.trim();
    if (!content) {
      return;
    }

    setShowError(false);
    setActiveQuestion(content);
    setAnswerIndex(Math.floor(Math.random() * mockAnswers.length));
    setPhase("loading");

    const shouldFail = content.toLowerCase().includes("error");

    window.setTimeout(() => {
      if (shouldFail) {
        setShowError(true);
      }
      setPhase("chat");
    }, 1100);

    setQuestion("");
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
        <button className="top-action" type="button">
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
              onClick={() => setQuestion("Brainstorm ideas for a minimalist website")}
            >
              <strong>Brainstorm ideas</strong>
              <span>Creative concepts for a minimalist website.</span>
            </button>
            <button
              className="prompt-card"
              type="button"
              onClick={() => setQuestion("Summarize this article into three key points")}
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

          {phase === "chat" && !showError && (
            <article className="answer-block">
              <div className="label">INSIGHT</div>
              <p>{answer.intro}</p>
              <div className="insight-cards">
                <section>
                  <h3>Cognitive Resilience</h3>
                  <p>{answer.cardA}</p>
                </section>
                <section>
                  <h3>Emotional Regulation</h3>
                  <p>{answer.cardB}</p>
                </section>
              </div>
              <p>{answer.ending}</p>
              <div className="ops-row">Copy · Helpful · Share</div>
            </article>
          )}

          {phase === "chat" && showError && (
            <article className="error-block">
              <h3>Mock Error</h3>
              <p>
                This is a frontend-only simulated failure. Remove the word
                &quot;error&quot; from your prompt to get a normal response.
              </p>
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
        <button type="submit">{phase === "home" ? "➤" : "Ask"}</button>
      </form>

      <footer className="foot-note">AI MODEL: V2.4 MINIMALIST · NO LOGS STORED</footer>
    </main>
  );
}
