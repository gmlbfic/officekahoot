import { redis, K, isAdmin, getState } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const st = await getState();
    if (!isAdmin(req)) return res.status(200).json(st);
    const p = redis.pipeline();
    p.scard(K.players(st.round));
    p.hlen(K.answers(st.round, st.q));
    p.hvals(K.results(st.round));
    const [players, answered, results] = await p.exec();
    return res.status(200).json({ ...st, admin: true, players, answered, results: results || [] });
  } catch (e) {
    return res.status(500).json({ error: "state_failed" });
  }
}
