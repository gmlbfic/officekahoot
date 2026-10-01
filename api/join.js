import { redis, K, TTL, ICONS, readBody, okPid, cleanName, getState } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { pid, round, name, icon } = readBody(req);
  const n = cleanName(name);
  if (!okPid(pid) || !n || !ICONS.includes(icon)) return res.status(400).json({ error: "bad_input" });
  const st = await getState();
  if (round !== st.round) return res.status(409).json(st);
  await redis.hset(K.people(st.round), { [pid]: JSON.stringify({ name: n, icon }) });
  await redis.expire(K.people(st.round), TTL);
  return res.status(200).json({ ok: true });
}
