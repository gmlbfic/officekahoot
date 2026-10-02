import { redis, K, NQ, isAdmin, getState, DIAG } from "./_lib.js";

const parse = (v) => { if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } } return v; };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const st = await getState();
    if (!isAdmin(req)) return res.status(200).json(st);
    const p = redis.pipeline();
    p.hgetall(K.people(st.round));
    p.hkeys(K.answers(st.round, st.q));
    p.hgetall(K.results(st.round));
    // En la etapa final también se leen todas las respuestas, para los premios del grupo.
    const finalPhase = st.phase === "final";
    if (finalPhase) for (let i = 0; i < NQ; i++) p.hgetall(K.answers(st.round, i));
    const [peopleRaw, answeredPids, resultsRaw, ...allAnswers] = await p.exec();
    const answeredSet = new Set(answeredPids || []);
    const results = resultsRaw || {};
    // Al presentador solo le llegan nombre, ícono, si respondió y su personaje; nunca los identificadores.
    const people = Object.entries(peopleRaw || {})
      .map(([pid, v]) => {
        const o = parse(v) || {};
        const person = { name: o.name || "Alguien", icon: o.icon || "🙂", answered: answeredSet.has(pid), result: results[pid] || null };
        if (finalPhase) person.answers = allAnswers.map((h) => { const c = h && h[pid]; const n = c == null ? null : Number(c); return Number.isInteger(n) ? n : null; });
        return person;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return res.status(200).json({
      ...st, admin: true, people,
      players: people.length,
      answered: people.filter((x) => x.answered).length,
      results: Object.values(results),
    });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e), diagnostico: DIAG });
  }
}
