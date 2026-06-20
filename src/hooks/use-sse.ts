"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface SSEEvent {
  ticketId?: string;
  conversationId?: string;
  type?: string;
  [key: string]: unknown;
}

export function useSSE(event: string, callback: (data: SSEEvent) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const evtSource = new EventSource("/api/events");

    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        callbackRef.current(data);
      } catch {}
    };

    evtSource.addEventListener(event, handler);

    return () => {
      evtSource.removeEventListener(event, handler);
      evtSource.close();
    };
  }, [event]);
}

export function useRealtimeTickets() {
  const [updates, setUpdates] = useState<SSEEvent[]>([]);

  const handler = useCallback((data: SSEEvent) => {
    setUpdates((prev) => [data, ...prev].slice(0, 50));
  }, []);

  useSSE("ticket-updated", handler);

  return updates;
}

export function useRealtimeInbox() {
  const [updates, setUpdates] = useState<SSEEvent[]>([]);

  const handler = useCallback((data: SSEEvent) => {
    setUpdates((prev) => [data, ...prev].slice(0, 50));
  }, []);

  useSSE("inbox-updated", handler);

  return updates;
}
