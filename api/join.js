import { redis, K, TTL, readBody, okPid, getState } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pid, round } = readBody(req);
  if (!okPid(pid)) return res.status(400).json({ error: "bad_pid" });
  const st = await getState();
  if (round !== st.round) return res.status(409).json(st);
  await redis.sadd(K.players(st.round), pid);
  await redis.expire(K.players(st.round), TTL);
  return res.status(200).json({ ok: true });
}
