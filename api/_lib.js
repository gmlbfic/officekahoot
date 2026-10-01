import { Redis } from "@upstash/redis";

// Vercel + Upstash inyecta una de estas dos parejas de variables, según cómo se conecte.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const NQ = 8;
export const CHARS = ["DW", "JI", "MI", "PA", "OS", "KE", "RY", "ME", "TO"];
export const DEFAULT_STATE = { phase: "lobby", q: 0, round: "r0" };
export const TTL = 60 * 60 * 48; // las respuestas se borran solas a las 48 h

export const K = {
  state: "oq:state",
  players: (r) => `oq:${r}:players`,
  answers: (r, q) => `oq:${r}:a:${q}`,
  results: (r) => `oq:${r}:res`,
};

export const isAdmin = (req) =>
  !!process.env.ADMIN_KEY && req.headers["x-admin-key"] === process.env.ADMIN_KEY;

export function readBody(req) {
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body || {};
}

export const okPid = (p) => typeof p === "string" && /^[a-z0-9]{6,40}$/i.test(p);

export async function getState() {
  return (await redis.get(K.state)) || DEFAULT_STATE;
}
