import { redis, K, TTL, NQ, readBody, okPid, getState } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pid, round, q, choice } = readBody(req);
  if (!okPid(pid) || !Number.isInteger(q) || q < 0 || q >= NQ || !Number.isInteger(choice) || choice < 0 || choice > 5) {
    return res.status(400).json({ error: "bad_input" });
  }
  const st = await getState();
  if (round !== st.round) return res.status(409).json(st);
  const key = K.answers(st.round, q);
  await redis.hset(key, { [pid]: choice });
  await redis.expire(key, TTL);
  return res.status(200).json({ ok: true });
}
