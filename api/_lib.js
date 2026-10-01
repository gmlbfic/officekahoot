import { Redis } from "@upstash/redis";

// Busca las credenciales de Upstash aunque Vercel las haya creado con otro prefijo
// (UPSTASH_REDIS_REST_URL, KV_REST_API_URL, STORAGE_KV_REST_API_URL, etc.).
function findEnv(suffixes, exclude = []) {
  for (const suf of suffixes) {
    const k = Object.keys(process.env).find((n) => n.endsWith(suf) && !exclude.some((x) => n.includes(x)));
    if (k && process.env[k]) return { name: k, value: process.env[k] };
  }
  return null;
}
const URL_ENV = findEnv(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL", "REST_API_URL", "REDIS_REST_URL"]);
const TOKEN_ENV = findEnv(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN", "REST_API_TOKEN", "REDIS_REST_TOKEN"], ["READ_ONLY"]);

export const DIAG = {
  urlVar: URL_ENV ? URL_ENV.name : null,
  tokenVar: TOKEN_ENV ? TOKEN_ENV.name : null,
  adminKeySet: !!process.env.ADMIN_KEY,
  redisUrlOnly: !URL_ENV && !!process.env.REDIS_URL,
};

export const redis = URL_ENV && TOKEN_ENV ? new Redis({ url: URL_ENV.value, token: TOKEN_ENV.value }) : null;

export const NQ = 8;
export const CHARS = ["DW", "JI", "MI", "PA", "OS", "KE", "RY", "ME", "TO"];
export const DEFAULT_STATE = { phase: "lobby", q: 0, round: "r0" };
export const TTL = 60 * 60 * 48; // las respuestas se borran solas a las 48 h

export const K = {
  state: "oq:state",
  people: (r) => `oq:${r}:people`,
  answers: (r, q) => `oq:${r}:a:${q}`,
  results: (r) => `oq:${r}:res`,
};

export const isAdmin = (req) =>
  !!process.env.ADMIN_KEY && req.headers["x-admin-key"] === process.env.ADMIN_KEY;

export function readBody(req) {
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body || {};
}

export const ICONS = ["🦊","🐙","🦉","🐸","🐧","🦁","🐼","🐨","🐯","🦄","🐝","🦋","🐢","🦀","🐳","🦩","🦔","🦜","🐞","🦭","🐊","🦒","🦓","🐌","🦇","🐺","🐻","🐷","🐮","🐔"];

// Nombre visible: sin caracteres de control ni invisibles, máximo 20 caracteres.
export function cleanName(n) {
  if (typeof n !== "string") return "";
  return n.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
}

export const okPid = (p) => typeof p === "string" && /^[a-z0-9]{6,40}$/i.test(p);

export async function getState() {
  if (!redis) throw new Error("sin_credenciales_redis");
  return (await redis.get(K.state)) || DEFAULT_STATE;
}
