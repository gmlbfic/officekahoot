import { redis, K, NQ, isAdmin, readBody, getState } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "clave_incorrecta" });
  const { action } = readBody(req);
  const st = await getState();
  let next = st;
  if (action === "start") next = { ...st, phase: "question", q: 0 };
  else if (action === "next") next = st.q >= NQ - 1 ? { ...st, phase: "final" } : { ...st, phase: "question", q: st.q + 1 };
  else if (action === "prev") next = { ...st, phase: "question", q: Math.max(0, st.phase === "final" ? NQ - 1 : st.q - 1) };
  else if (action === "finish") next = { ...st, phase: "final" };
  else if (action === "reset") next = { phase: "lobby", q: 0, round: "r" + Date.now().toString(36) };
  else return res.status(400).json({ error: "accion_desconocida" });
  await redis.set(K.state, next);
  return res.status(200).json(next);
}
