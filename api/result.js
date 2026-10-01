import { redis, K, TTL, CHARS, readBody, okPid, getState } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pid, round, char } = readBody(req);
  if (!okPid(pid) || !CHARS.includes(char)) return res.status(400).json({ error: "bad_input" });
  const st = await getState();
  if (round !== st.round) return res.status(409).json(st);
  await redis.hset(K.results(st.round), { [pid]: char });
  await redis.expire(K.results(st.round), TTL);
  return res.status(200).json({ ok: true });
}
