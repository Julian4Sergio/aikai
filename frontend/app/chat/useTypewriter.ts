import { useEffect, useRef, useState } from "react";

type Typewriter = {
  streamingText: string;
  enqueue: (chunk: string) => void;
  finish: () => Promise<void>;
  reset: () => void;
};

export function useTypewriter(intervalMs = 15): Typewriter {
  const [streamingText, setStreamingText] = useState("");

  const queueRef = useRef("");
  const intervalRef = useRef<number | null>(null);
  const doneResolverRef = useRef<(() => void) | null>(null);
  const streamEndedRef = useRef(false);

  const stop = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    if (intervalRef.current !== null) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const nextChar = queueRef.current[0];
      if (nextChar) {
        queueRef.current = queueRef.current.slice(1);
        setStreamingText((prev) => prev + nextChar);
        return;
      }

      if (!streamEndedRef.current) {
        return;
      }

      stop();
      const resolver = doneResolverRef.current;
      doneResolverRef.current = null;
      if (resolver) {
        resolver();
      }
    }, intervalMs);
  };

  const enqueue = (chunk: string) => {
    if (!chunk) {
      return;
    }
    queueRef.current += chunk;
    start();
  };

  const finish = async () => {
    streamEndedRef.current = true;

    if (!queueRef.current && intervalRef.current === null) {
      return;
    }

    start();
    await new Promise<void>((resolve) => {
      doneResolverRef.current = resolve;
    });
  };

  const reset = () => {
    stop();
    queueRef.current = "";
    streamEndedRef.current = false;
    doneResolverRef.current = null;
    setStreamingText("");
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { streamingText, enqueue, finish, reset };
}
