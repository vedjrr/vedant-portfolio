import { DurableObject } from "cloudflare:workers";

// One Durable Object ("lobby") holds every live connection to the portfolio.
// It counts who is here, relays cursors between visitors and stores the
// guestbook in its built-in SQLite database. Everything fits the Workers Free
// plan, where going over a daily limit returns errors instead of a bill.

interface Env {
  LOBBY: DurableObjectNamespace<Lobby>;
  ALLOWED_ORIGINS: string;
  REALTIME_SECRET: string;
}

type Visitor = { id: string; country: string; color: string };

export type Entry = {
  githubId: number;
  login: string;
  name: string | null;
  message: string;
  createdAt: number;
  hidden?: boolean;
};

type EntryRow = {
  github_id: number;
  login: string;
  name: string | null;
  message: string;
  created_at: number;
  updated_at: number;
  hidden: number;
};

// [id, x, y, path, color, country]. x and y are null when the cursor leaves.
type Move = [string, number | null, number | null, string, string, string];

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#ef4444"];
// Past this many visitors, only counts are shared: cursors stop to protect the free quota.
const CURSOR_LIMIT = 25;
// Cursor moves are batched into one broadcast this often.
const FLUSH_MS = 80;
// Join and leave updates are merged into at most one broadcast per second.
const PRESENCE_MS = 1000;
// A connection sending more than this per second is closed.
const MAX_PER_SECOND = 30;
const MAX_MESSAGE = 120;
const EDIT_GAP_MS = 30_000;

export class Lobby extends DurableObject<Env> {
  private moves = new Map<string, Move>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private presenceTimer: ReturnType<typeof setTimeout> | undefined;
  private rates = new Map<string, { second: number; count: number }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS entries (
      github_id INTEGER PRIMARY KEY,
      login TEXT NOT NULL,
      name TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0
    )`);
    // Answered by the runtime without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    const id = crypto.randomUUID().slice(0, 8);
    const visitor: Visitor = {
      id,
      country: request.headers.get("x-country") ?? "XX",
      color: COLORS[parseInt(id, 16) % COLORS.length],
    };
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(visitor);
    server.send(JSON.stringify({ type: "welcome", id, color: visitor.color }));
    server.send(this.presence());
    this.schedulePresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const visitor = ws.deserializeAttachment() as Visitor | null;
    if (!visitor || typeof raw !== "string" || raw.length > 200) return;
    if (this.overLimit(visitor.id)) {
      ws.close(1008, "Too many messages");
      return;
    }

    let msg: { t?: unknown; x?: unknown; y?: unknown; p?: unknown };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.t !== "c" || this.open().length > CURSOR_LIMIT) return;

    const path = typeof msg.p === "string" ? msg.p.slice(0, 80) : "/";
    const hide = msg.x === null || msg.y === null;
    const x = Number(msg.x);
    const y = Number(msg.y);
    if (!hide && !(Number.isFinite(x) && Number.isFinite(y))) return;
    this.queueMove([
      visitor.id,
      hide ? null : Math.round(Math.max(-2000, Math.min(4000, x))),
      hide ? null : Math.round(Math.max(0, Math.min(100_000, y))),
      path,
      visitor.color,
      visitor.country,
    ]);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    this.leave(ws);
    try {
      ws.close(code, reason);
    } catch {
      // Already closed, or a reserved code that can't be echoed.
    }
  }

  async webSocketError(ws: WebSocket) {
    this.leave(ws);
  }

  // Guestbook, called over RPC by the Worker below.

  list(includeHidden = false): Entry[] {
    const rows = this.ctx.storage.sql
      .exec<EntryRow>(
        `SELECT * FROM entries ${includeHidden ? "" : "WHERE hidden = 0"}
         ORDER BY created_at DESC LIMIT 500`,
      )
      .toArray();
    return rows.map(toEntry);
  }

  sign(input: { githubId: number; login: string; name: string | null; message: string }) {
    const message = input.message.trim().slice(0, MAX_MESSAGE);
    if (!message) return { ok: false as const, error: "Write something first." };

    const existing = this.ctx.storage.sql
      .exec<EntryRow>("SELECT * FROM entries WHERE github_id = ?", input.githubId)
      .toArray()[0];
    const now = Date.now();
    if (existing?.hidden) return { ok: false as const, error: "This account can't sign the guestbook." };
    if (existing && now - existing.updated_at < EDIT_GAP_MS) {
      return { ok: false as const, error: "Slow down. Try again in half a minute." };
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO entries (github_id, login, name, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(github_id) DO UPDATE SET
         login = excluded.login, name = excluded.name,
         message = excluded.message, updated_at = excluded.updated_at`,
      input.githubId,
      input.login,
      input.name,
      message,
      now,
      now,
    );
    const entry: Entry = {
      githubId: input.githubId,
      login: input.login,
      name: input.name,
      message,
      createdAt: existing?.created_at ?? now,
    };
    this.broadcast(JSON.stringify({ type: "guestbook", entry }));
    return { ok: true as const, entry };
  }

  /** Removes a visitor's own note. Hidden notes stay, so a hidden account can't sign again. */
  remove(githubId: number) {
    this.ctx.storage.sql.exec("DELETE FROM entries WHERE github_id = ? AND hidden = 0", githubId);
    this.broadcast(JSON.stringify({ type: "guestbook-remove", githubId }));
  }

  /** Moderation: hides a note and stops that account from signing again. */
  setHidden(githubId: number, hidden: boolean) {
    this.ctx.storage.sql.exec(
      "UPDATE entries SET hidden = ? WHERE github_id = ?",
      hidden ? 1 : 0,
      githubId,
    );
    if (hidden) {
      this.broadcast(JSON.stringify({ type: "guestbook-remove", githubId }));
    } else {
      const row = this.ctx.storage.sql
        .exec<EntryRow>("SELECT * FROM entries WHERE github_id = ?", githubId)
        .toArray()[0];
      if (row) this.broadcast(JSON.stringify({ type: "guestbook", entry: toEntry(row) }));
    }
  }

  // Presence and cursors.

  private open() {
    return this.ctx.getWebSockets().filter((ws) => ws.readyState === WebSocket.OPEN);
  }

  private presence() {
    const sockets = this.open();
    const countries = new Map<string, number>();
    for (const ws of sockets) {
      const visitor = ws.deserializeAttachment() as Visitor | null;
      if (visitor) countries.set(visitor.country, (countries.get(visitor.country) ?? 0) + 1);
    }
    return JSON.stringify({
      type: "presence",
      online: sockets.length,
      countries: [...countries].sort((a, b) => b[1] - a[1]),
      cursors: sockets.length <= CURSOR_LIMIT,
    });
  }

  private schedulePresence() {
    this.presenceTimer ??= setTimeout(() => {
      this.presenceTimer = undefined;
      this.broadcast(this.presence());
    }, PRESENCE_MS);
  }

  private queueMove(move: Move) {
    this.moves.set(move[0], move);
    this.flushTimer ??= setTimeout(() => {
      this.flushTimer = undefined;
      if (!this.moves.size) return;
      const payload = JSON.stringify({ type: "cursors", moves: [...this.moves.values()] });
      this.moves.clear();
      this.broadcast(payload);
    }, FLUSH_MS);
  }

  private leave(ws: WebSocket) {
    const visitor = ws.deserializeAttachment() as Visitor | null;
    if (visitor) {
      this.rates.delete(visitor.id);
      this.queueMove([visitor.id, null, null, "", visitor.color, visitor.country]);
    }
    this.schedulePresence();
  }

  private overLimit(id: string) {
    const second = Math.floor(Date.now() / 1000);
    const rate = this.rates.get(id);
    if (!rate || rate.second !== second) {
      this.rates.set(id, { second, count: 1 });
      return false;
    }
    rate.count += 1;
    return rate.count > MAX_PER_SECOND;
  }

  private broadcast(payload: string) {
    for (const ws of this.open()) {
      try {
        ws.send(payload);
      } catch {
        // The socket closed mid-send; its close handler cleans up.
      }
    }
  }
}

function toEntry(row: EntryRow): Entry {
  return {
    githubId: row.github_id,
    login: row.login,
    name: row.name,
    message: row.message,
    createdAt: row.created_at,
    ...(row.hidden ? { hidden: true } : {}),
  };
}

function allowedOrigin(origin: string | null, env: Env) {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  return allowed.includes("*") || (origin !== null && allowed.includes(origin));
}

/** Checks the shared secret the site's server sends. Constant time. */
function authorized(request: Request, env: Env) {
  if (!env.REALTIME_SECRET) return false;
  const given = new TextEncoder().encode(request.headers.get("Authorization") ?? "");
  const expected = new TextEncoder().encode(`Bearer ${env.REALTIME_SECRET}`);
  return given.byteLength === expected.byteLength && crypto.subtle.timingSafeEqual(given, expected);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const lobby = env.LOBBY.getByName("main");

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected a WebSocket", { status: 426 });
      }
      if (!allowedOrigin(request.headers.get("Origin"), env)) {
        return new Response("Origin not allowed", { status: 403 });
      }
      const headers = new Headers(request.headers);
      headers.set("x-country", String(request.cf?.country ?? "XX"));
      return lobby.fetch(new Request(request, { headers }));
    }

    if (url.pathname === "/guestbook") {
      const admin = authorized(request, env);
      if (request.method === "GET") {
        return Response.json(await lobby.list(admin && url.searchParams.has("all")), {
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (!admin) return new Response("Unauthorized", { status: 401 });

      const body = await request.json<Record<string, unknown>>().catch(() => null);
      const githubId = Number(body?.githubId);
      if (!body || !Number.isSafeInteger(githubId)) {
        return Response.json({ error: "Bad request" }, { status: 400 });
      }

      if (request.method === "POST") {
        const result = await lobby.sign({
          githubId,
          login: String(body.login ?? "").slice(0, 39),
          name: typeof body.name === "string" ? body.name.slice(0, 80) : null,
          message: String(body.message ?? ""),
        });
        return Response.json(result, { status: result.ok ? 200 : 400 });
      }
      if (request.method === "DELETE") {
        await lobby.remove(githubId);
        return Response.json({ ok: true });
      }
      if (request.method === "PATCH") {
        await lobby.setHidden(githubId, body.hidden !== false);
        return Response.json({ ok: true });
      }
      return new Response("Method not allowed", { status: 405 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
