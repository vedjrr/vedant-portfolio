"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { GuestbookEntry } from "@/lib/guestbook";

export type Presence = { online: number; countries: [string, number][]; cursors: boolean };
// [id, x, y, path, color, country]. x and y are null when that cursor left.
export type Move = [string, number | null, number | null, string, string, string];

export type ServerMessage =
  | { type: "welcome"; id: string; color: string }
  | ({ type: "presence" } & Presence)
  | { type: "cursors"; moves: Move[] }
  | { type: "guestbook"; entry: GuestbookEntry }
  | { type: "guestbook-remove"; githubId: number };

type Listener = (msg: ServerMessage) => void;

type Realtime = {
  presence: Presence | null;
  selfId: string | null;
  send: (msg: object) => void;
  subscribe: (listener: Listener) => () => void;
};

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;
// A hidden tab lets go of its connection after this long, so "here now" means here.
const HIDDEN_GRACE_MS = 30_000;

const RealtimeContext = createContext<Realtime>({
  presence: null,
  selfId: null,
  send: () => {},
  subscribe: () => () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

/** One shared connection to the realtime Worker for presence, cursors and the guestbook. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [presence, setPresence] = useState<Presence | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<Listener>());

  useEffect(() => {
    if (!REALTIME_URL) return;
    const endpoint = `${REALTIME_URL.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
    let stopped = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    let hiddenTimer: number | undefined;

    const connect = () => {
      if (stopped || socket.current || document.hidden) return;
      const ws = new WebSocket(endpoint);
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
      };
      ws.onmessage = (e) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.type === "welcome") setSelfId(msg.id);
        if (msg.type === "presence") {
          setPresence({ online: msg.online, countries: msg.countries, cursors: msg.cursors });
        }
        listeners.current.forEach((listener) => listener(msg));
      };
      ws.onclose = () => {
        if (socket.current === ws) socket.current = null;
        setPresence(null);
        if (stopped || document.hidden) return;
        // Back off 1s, 2s, 4s ... up to 30s, e.g. when the free daily quota runs out.
        retryTimer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt++));
      };
    };
    const disconnect = () => {
      const ws = socket.current;
      socket.current = null;
      ws?.close();
    };
    const onVisibility = () => {
      window.clearTimeout(hiddenTimer);
      if (document.hidden) {
        hiddenTimer = window.setTimeout(disconnect, HIDDEN_GRACE_MS);
      } else {
        window.clearTimeout(retryTimer);
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      disconnect();
    };
  }, []);

  const send = useCallback((msg: object) => {
    const ws = socket.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ presence, selfId, send, subscribe }),
    [presence, selfId, send, subscribe],
  );

  return <RealtimeContext value={value}>{children}</RealtimeContext>;
}
