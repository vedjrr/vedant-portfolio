import { DurableObject } from "cloudflare:workers";

// One Durable Object ("lobby") holds every live connection to the portfolio.
// It counts who is here, relays cursors between visitors and stores the
// guestbook whiteboard in its built-in SQLite database. Everything fits the
// Workers Free plan, where going over a daily limit returns errors instead of a bill.

interface Env {
  LOBBY: DurableObjectNamespace<Lobby>;
  ALLOWED_ORIGINS: string;
  ADMIN_SECRET: string;
}

type Visitor = { id: string; country: string; color: string };

// A pen stroke or a typed note on the whiteboard, in board units. points is
// flat: [x1, y1, x2, y2, ...]. Keep in step with Mark in the site's src/lib/guestbook.ts.
type Pen = { kind: "pen"; color: number; points: number[] };
type Note = { kind: "text"; color: number; x: number; y: number; text: string };
export type Mark = (Pen | Note) & { id: string };

type DrawResult = { ok: true; mark: Mark } | { ok: false; error: string; status: number };

// [id, x, y, path, color, country, anchor]. anchor is the element under the
// cursor, as child indexes from <main> ("2.1.0"); x and y are its position
// inside that element in ten-thousandths of its width and height, so it lands
// on the same content at any window width. x and y are null when the cursor leaves.
type Move = [string, number | null, number | null, string, string, string, string];

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#ef4444"];
// Past this many visitors, only counts are shared: cursors stop to protect the free quota.
const CURSOR_LIMIT = 25;
// Cursor moves are batched into one broadcast this often.
const FLUSH_MS = 80;
// Join and leave updates are merged into at most one broadcast per second.
const PRESENCE_MS = 1000;
// A connection sending more than this per second is closed.
const MAX_PER_SECOND = 30;

// Whiteboard. The first four must match the site's src/lib/guestbook.ts.
const BOARD_WIDTH = 760;
const BOARD_MAX_HEIGHT = 20_000;
const INK_COUNT = 5;
const MAX_POINTS = 600;
const MAX_TEXT = 60;
// Past this many marks the board is full.
const MAX_MARKS = 5000;
// Per visitor (IP address). The hourly count includes marks later undone, so
// drawing and undoing in a loop can't burn through the free quota.
const MARKS_PER_HOUR = 150;
const MARKS_PER_DAY = 300;
// Links invite spam, so notes are plain text only.
const LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|xyz|ru|cn|top|link|click|gg|me|co)\b/i;

export class Lobby extends DurableObject<Env> {
  private moves = new Map<string, Move>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private presenceTimer: ReturnType<typeof setTimeout> | undefined;
  private rates = new Map<string, { second: number; count: number }>();
  private hourly = new Map<string, { hour: number; count: number }>();
  private salt: string;
  // The board as JSON and its mark count, kept while the object is awake.
  private board: string | null = null;
  private total: number | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    // The old GitHub guestbook's table. It never held a note in production.
    sql.exec("DROP TABLE IF EXISTS entries");
    // owner: hash of the random key the drawer's browser keeps, so they can undo.
    // visitor: salted hash of the drawer's IP, for limits and moderation.
    sql.exec(`CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      owner TEXT NOT NULL,
      visitor TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`);
    sql.exec("CREATE INDEX IF NOT EXISTS marks_by_visitor ON marks (visitor, created_at)");
    sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    const saved = sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'salt'").toArray()[0];
    this.salt = saved?.value ?? crypto.randomUUID();
    if (!saved) sql.exec("INSERT INTO meta (key, value) VALUES ('salt', ?)", this.salt);
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

    let msg: { t?: unknown; x?: unknown; y?: unknown; p?: unknown; a?: unknown };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.t !== "c" || this.open().length > CURSOR_LIMIT) return;

    const path = typeof msg.p === "string" ? msg.p.slice(0, 80) : "/";
    const anchor = typeof msg.a === "string" && /^[\d.]{0,32}$/.test(msg.a) ? msg.a : "";
    const hide = msg.x === null || msg.y === null;
    const x = Number(msg.x);
    const y = Number(msg.y);
    if (!hide && !(Number.isFinite(x) && Number.isFinite(y))) return;
    this.queueMove([
      visitor.id,
      hide ? null : Math.round(Math.max(-100_000, Math.min(100_000, x))),
      hide ? null : Math.round(Math.max(-100_000, Math.min(100_000, y))),
      path,
      visitor.color,
      visitor.country,
      anchor,
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

  // Whiteboard, called over RPC by the Worker below.

  /** Every mark, oldest first, as a JSON array. */
  list(): string {
    this.board ??= `[${this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM marks ORDER BY created_at, id")
      .toArray()
      .map((row) => row.data)
      .join(",")}]`;
    return this.board;
  }

  async draw(body: Record<string, unknown>, ip: string): Promise<DrawResult> {
    const draft = readDraft(body);
    if (typeof draft === "string") return { ok: false, error: draft, status: 400 };
    const key = typeof body.key === "string" ? body.key : "";
    if (key.length < 16 || key.length > 64) {
      return { ok: false, error: "Reload the page and try again.", status: 400 };
    }
    const [owner, visitor] = await Promise.all([hash(key), hash(`${this.salt}:${ip}`)]);

    // No awaits from here on, so nothing can slip in between the checks and the write.
    const sql = this.ctx.storage.sql;
    const now = Date.now();
    const hour = Math.floor(now / 3_600_000);
    const recent = this.hourly.get(visitor);
    const thisHour = recent?.hour === hour ? recent.count : 0;
    if (thisHour >= MARKS_PER_HOUR) {
      return { ok: false, error: "Slow down a little. Try again later.", status: 429 };
    }
    const today = sql
      .exec<{ n: number }>(
        "SELECT COUNT(*) AS n FROM marks WHERE visitor = ? AND created_at > ?",
        visitor,
        now - 86_400_000,
      )
      .one().n;
    if (today >= MARKS_PER_DAY) {
      return { ok: false, error: "That's plenty for today. Come back tomorrow.", status: 429 };
    }
    this.total ??= sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM marks").one().n;
    if (this.total >= MAX_MARKS) return { ok: false, error: "The board is full.", status: 409 };

    const mark: Mark = { id: crypto.randomUUID().replaceAll("-", "").slice(0, 12), ...draft };
    sql.exec(
      "INSERT INTO marks (id, data, owner, visitor, created_at) VALUES (?, ?, ?, ?, ?)",
      mark.id,
      JSON.stringify(mark),
      owner,
      visitor,
      now,
    );
    this.hourly.set(visitor, { hour, count: thisHour + 1 });
    this.total += 1;
    this.board = null;
    this.broadcast(JSON.stringify({ type: "board-add", mark }));
    return { ok: true, mark };
  }

  /**
   * Removes a mark and returns the ids that went. A visitor can remove their own
   * marks with their key. The site owner can remove any mark, or with
   * `everything`, every mark by the same visitor.
   */
  async erase(id: string, by: { key: string } | { admin: true; everything: boolean }) {
    const sql = this.ctx.storage.sql;
    const owner = "key" in by ? await hash(by.key) : null;
    const rows =
      owner !== null
        ? sql.exec<{ id: string }>("DELETE FROM marks WHERE id = ? AND owner = ? RETURNING id", id, owner)
        : "everything" in by && by.everything
          ? sql.exec<{ id: string }>(
              "DELETE FROM marks WHERE visitor = (SELECT visitor FROM marks WHERE id = ?) RETURNING id",
              id,
            )
          : sql.exec<{ id: string }>("DELETE FROM marks WHERE id = ? RETURNING id", id);
    const ids = rows.toArray().map((row) => row.id);
    if (ids.length) {
      if (this.total !== null) this.total -= ids.length;
      this.board = null;
      this.broadcast(JSON.stringify({ type: "board-remove", ids }));
    }
    return ids;
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
      this.queueMove([visitor.id, null, null, "", visitor.color, visitor.country, ""]);
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

/** Checks a mark sent by a browser. Returns the clean mark, or why it was refused. */
function readDraft(body: Record<string, unknown>): Pen | Note | string {
  const color = Number(body.color);
  if (!Number.isInteger(color) || color < 0 || color >= INK_COUNT) return "Pick a colour first.";

  if (body.kind === "pen") {
    const raw = body.points;
    if (!Array.isArray(raw) || raw.length < 4 || raw.length > MAX_POINTS * 2 || raw.length % 2) {
      return "That stroke couldn't be saved.";
    }
    const points: number[] = [];
    for (const [i, n] of raw.entries()) {
      if (typeof n !== "number" || !Number.isFinite(n)) return "That stroke couldn't be saved.";
      points.push(clamp(n, i % 2 ? BOARD_MAX_HEIGHT : BOARD_WIDTH));
    }
    return { kind: "pen", color, points };
  }

  if (body.kind === "text") {
    const text = String(body.text ?? "")
      .replace(/\p{Cc}/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "Write something first.";
    if (text.length > MAX_TEXT) return `Keep it to ${MAX_TEXT} characters.`;
    if (LINK.test(text)) return "Links aren't allowed on the board.";
    const x = Number(body.x);
    const y = Number(body.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return "That note couldn't be saved.";
    return { kind: "text", color, x: clamp(x, BOARD_WIDTH), y: clamp(y, BOARD_MAX_HEIGHT), text };
  }

  return "That mark couldn't be saved.";
}

const clamp = (n: number, max: number) => Math.round(Math.max(0, Math.min(max, n)));

async function hash(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest).slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function allowedOrigin(origin: string | null, env: Env) {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  return allowed.includes("*") || (origin !== null && allowed.includes(origin));
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const headers: Record<string, string> = { "Cache-Control": "no-store", Vary: "Origin" };
  if (origin && allowedOrigin(origin, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

/** Checks the site owner's ADMIN_SECRET, sent as a Bearer token. Constant time. */
function authorized(request: Request, env: Env) {
  if (!env.ADMIN_SECRET) return false;
  const given = new TextEncoder().encode(request.headers.get("Authorization") ?? "");
  const expected = new TextEncoder().encode(`Bearer ${env.ADMIN_SECRET}`);
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

    // GET /board lists every mark. POST /board adds one. DELETE /board/:id removes one.
    if (url.pathname === "/board" || url.pathname.startsWith("/board/")) {
      const origin = request.headers.get("Origin");
      const headers = corsHeaders(origin, env);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
      const id = url.pathname.slice("/board/".length);

      if (!id && request.method === "GET") {
        return new Response(await lobby.list(), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      // Writes come from the site in a visitor's browser, or from the site owner.
      const admin = authorized(request, env);
      if (request.headers.has("Authorization") && !admin) {
        return reply({ ok: false, error: "Wrong admin key." }, 401);
      }
      if (!admin && !allowedOrigin(origin, env)) {
        return reply({ ok: false, error: "Origin not allowed." }, 403);
      }
      const parsed: unknown = await request.json().catch(() => null);
      const body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

      if (!id && request.method === "POST") {
        const result = await lobby.draw(body, request.headers.get("CF-Connecting-IP") ?? "unknown");
        return result.ok ? reply(result) : reply({ ok: false, error: result.error }, result.status);
      }
      if (id && request.method === "DELETE") {
        const ids = await lobby.erase(
          id,
          admin ? { admin: true, everything: url.searchParams.has("visitor") } : { key: String(body.key ?? "") },
        );
        return reply({ ok: ids.length > 0, ids }, ids.length ? 200 : 404);
      }
      return reply({ ok: false, error: "Method not allowed." }, 405);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
