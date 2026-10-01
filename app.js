// ¿Qué personaje de The Office sos? — modo en vivo
// Un solo link: con ?admin=CLAVE abre el modo presentador; sin clave, el modo jugador.

const app = document.getElementById("app");
const bannerEl = document.getElementById("banner");
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const imgSrc = (qi, oi) => `img/q${qi + 1}-${oi + 1}.webp`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

// La clave se guarda en la sesión y se quita de la barra de direcciones,
// así no aparece en el QR ni si alguien mira la pantalla.
let adminKey = new URLSearchParams(location.search).get("admin");
if (adminKey) {
  try { sessionStorage.setItem("ak", adminKey); } catch (e) {}
  history.replaceState(null, "", location.pathname);
} else {
  try { adminKey = sessionStorage.getItem("ak"); } catch (e) {}
}
const PUBLIC_URL = location.origin + location.pathname;

async function api(path, body) {
  const opt = { cache: "no-store", headers: {} };
  if (body) { opt.method = "POST"; opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
  if (adminKey) opt.headers["x-admin-key"] = adminKey;
  const r = await fetch("/api/" + path, opt);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(r.status); e.status = r.status; e.data = data; throw e; }
  return data;
}

function optionsGrid(qi, { interactive, chosen }) {
  const item = Q[qi];
  return `<div class="grid">${item.o.map((o, i) => `
    <button class="opt" data-i="${i}" ${interactive ? "" : "tabindex='-1'"} aria-pressed="${chosen === i}">
      <span class="pic" style="--c:${item.c}"><img src="${imgSrc(qi, i)}" alt="" decoding="async"></span>
      <span class="cap">${esc(o[0])}</span>
    </button>`).join("")}</div>`;
}

function resultCard(ans) {
  const { s, ranked } = scoreFrom(ans);
  const top = CH[ranked[0]];
  const total = ranked.slice(0, 3).reduce((t, k) => t + s[k], 0) || 1;
  return { code: ranked[0], html: `
  <span class="tab">Expediente de personal</span>
  <section class="sheet file" style="--rc:${top.color}">
    <div class="stamp" aria-hidden="true">ASIGNADO</div>
    <div class="emblem" aria-hidden="true">${top.emblem}</div>
    <p class="field">Puesto asignado:</p>
    <h2 class="name">${top.name}</h2>
    <p class="bio">${top.bio}</p>
    <div class="compat"><h3>Tu mezcla</h3>
      ${ranked.slice(0, 3).map((k) => `
        <div class="bar" style="--bc:${CH[k].color}">
          <span>${CH[k].name.split(" ")[0]}</span>
          <i><b style="width:${Math.round((s[k] / total) * 100)}%"></b></i>
          <span>${Math.round((s[k] / total) * 100)} %</span>
        </div>`).join("")}
    </div>
  </section>` };
}

/* ======================= MODO JUGADOR ======================= */
function player() {
  let pid = store.get("pid");
  if (!pid) { pid = "p" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); store.set("pid", pid); }
  let st = null, mine = null, fails = 0, offline = false;
  let joinedRound = null, sentResult = null, lastKey = "";

  const loadMine = (round) => { const m = store.get("ans"); return m && m.round === round ? m : { round, a: Array(Q.length).fill(null) }; };
  const saveMine = () => store.set("ans", mine);

  function banner(show) {
    bannerEl.innerHTML = show ? `<div class="banner" role="status"><span>Se cortó la conexión con la pantalla grande.</span><button id="goOffline">Seguir por mi cuenta</button></div>` : "";
    if (show) document.getElementById("goOffline").onclick = goOffline;
  }

  function goOffline() {
    offline = true; banner(false);
    if (!st) { st = { round: "offline", phase: "question", q: 0 }; mine = loadMine("offline"); }
    advanceOffline();
  }
  function advanceOffline() {
    const q = mine.a.findIndex((x) => x == null);
    st = { ...st, phase: q < 0 ? "final" : "question", q: q < 0 ? st.q : q };
    lastKey = ""; render();
  }

  async function poll() {
    if (offline) return;
    try { onState(await api("state")); fails = 0; banner(false); }
    catch (e) { fails++; if (fails === 5) banner(true); }
    setTimeout(poll, 1500);
  }

  function onState(s) {
    if (!st || s.round !== st.round) mine = loadMine(s.round);
    st = s;
    if (joinedRound !== s.round) { joinedRound = s.round; api("join", { pid, round: s.round }).catch(() => { joinedRound = null; }); }
    const key = [s.round, s.phase, s.q, mine.a[s.q] != null].join("|");
    if (key !== lastKey) { lastKey = key; render(); }
  }

  function render() {
    if (!st) { app.innerHTML = `<section class="intro"><h1>¿Qué personaje de The Office sos?</h1><p>Conectando con la pantalla grande…</p></section>`; return; }
    if (st.phase === "lobby") {
      app.innerHTML = `<section class="intro"><h1>¿Qué personaje de The Office sos?</h1>
        <div class="memo"><b>Ya estás adentro.</b> Esperá a que arranque el test en la pantalla grande.</div></section>`;
      return;
    }
    if (st.phase === "question") {
      const q = st.q, done = mine.a[q];
      if (done != null && !offline) {
        app.innerHTML = `<span class="tab">Pregunta ${q + 1} de ${Q.length}</span>
          <section class="sheet wait"><h2>Respuesta registrada</h2>
          <p>Mirá la pantalla grande: en un momento pasamos a la siguiente.</p>
          <div class="chosen"><img src="${imgSrc(q, done)}" alt=""><span>${esc(Q[q].o[done][0])}</span></div></section>`;
        return;
      }
      app.innerHTML = `<span class="tab">Pregunta ${q + 1} de ${Q.length}</span>
        <section class="sheet"><div class="qhead"><h2>${esc(Q[q].q)}</h2></div>
        ${optionsGrid(q, { interactive: true, chosen: done })}</section>`;
      app.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.i;
        mine.a[q] = i; saveMine();
        if (offline) { setTimeout(advanceOffline, 300); return; }
        api("answer", { pid, round: st.round, q, choice: i }).catch(() => {});
        lastKey = ""; render();
      }));
      window.scrollTo({ top: 0 });
      return;
    }
    // final
    if (mine.a.every((x) => x == null)) {
      app.innerHTML = `<section class="sheet wait"><h2>Llegaste tarde a la oficina</h2>
        <p>No llegaste a responder ninguna pregunta, así que no hay expediente para vos esta vez.</p></section>`;
      return;
    }
    const r = resultCard(mine.a);
    app.innerHTML = r.html + `<footer>Test hecho por fans, sin vínculo con la serie ni con sus productores.</footer>`;
    if (!offline && sentResult !== st.round) { sentResult = st.round; api("result", { pid, round: st.round, char: r.code }).catch(() => { sentResult = null; }); }
    window.scrollTo({ top: 0 });
  }

  render(); poll();
}

/* ===================== MODO PRESENTADOR ===================== */
function presenter() {
  document.body.classList.add("pres");
  let st = null, lastKey = "", busy = false;

  async function control(action) {
    if (busy) return; busy = true;
    try { await api("control", { action }); await poll(true); }
    catch (e) { if (e.status === 401) return showError(); alert("No se pudo cambiar de pregunta. Probá de nuevo."); }
    finally { busy = false; }
  }

  function showError() {
    app.innerHTML = `<section class="sheet err"><h2 class="qtext">Clave de presentador incorrecta</h2>
      <p>Abrí el link con <b>?admin=</b> y la clave que configuraste en Vercel.</p></section>`;
  }

  async function poll(once) {
    try {
      const s = await api("state");
      if (!s.admin) { showError(); return; }
      st = s; render();
    } catch (e) { /* se reintenta en el próximo ciclo */ }
    if (!once) setTimeout(poll, 1000);
  }

  function tallyHTML() {
    const counts = {}; (st.results || []).forEach((c) => (counts[c] = (counts[c] || 0) + 1));
    const total = (st.results || []).length;
    const rows = ORDER.filter((k) => counts[k]).sort((a, b) => counts[b] - counts[a]);
    if (!total) return `<p class="count">Esperando resultados…</p>`;
    return rows.map((k) => `<div class="bar" style="--bc:${CH[k].color}">
      <span>${CH[k].emblem} ${CH[k].name.split(" ")[0]}</span>
      <i><b style="width:${Math.round((counts[k] / total) * 100)}%"></b></i><span>${counts[k]}</span></div>`).join("");
  }

  function render() {
    const key = [st.round, st.phase, st.q].join("|");
    const full = key !== lastKey; lastKey = key;
    const live = document.getElementById("live");
    if (!full && live) {
      live.innerHTML = st.phase === "lobby" ? `${st.players} conectados`
        : st.phase === "question" ? `${st.answered} de ${st.players} respondieron` : tallyHTML();
      return;
    }
    if (st.phase === "lobby") {
      app.innerHTML = `<section class="sheet lobby">
        <div><h1 class="big">¿Qué personaje de The Office sos?</h1>
          <p class="url">Escaneá el código o entrá a<br><b>${esc(PUBLIC_URL)}</b></p>
          <p class="count" id="live">${st.players} conectados</p>
          <div class="controls"><button class="btn" id="go">Empezar el test</button></div></div>
        <div class="qr" id="qr"></div></section>`;
      if (window.QRCode) new QRCode(document.getElementById("qr"), { text: PUBLIC_URL, width: 260, height: 260 });
      document.getElementById("go").onclick = () => control("start");
      return;
    }
    if (st.phase === "question") {
      const last = st.q === Q.length - 1;
      app.innerHTML = `<div class="pres-top"><span class="tab">Pregunta ${st.q + 1} de ${Q.length}</span>
        <span class="count" id="live">${st.answered} de ${st.players} respondieron</span></div>
        <section class="sheet"><div class="qhead"><h2 class="qtext">${esc(Q[st.q].q)}</h2></div>
        ${optionsGrid(st.q, { interactive: false })}
        <div class="nav controls"><button class="btn ghost" id="prev" ${st.q === 0 ? "disabled" : ""}>Anterior</button>
        <button class="btn" id="next">${last ? "Ver resultados" : "Siguiente pregunta"}</button></div></section>`;
      document.getElementById("prev").onclick = () => control("prev");
      document.getElementById("next").onclick = () => control("next");
      return;
    }
    app.innerHTML = `<section class="sheet tally"><h1 class="big">Así quedó la oficina</h1>
      <p>Cada uno tiene su expediente en el celular.</p>
      <div id="live">${tallyHTML()}</div>
      <div class="controls" style="margin-top:24px"><button class="btn ghost" id="back">Volver a la última pregunta</button>
      <button class="btn ghost" id="reset">Nueva ronda</button></div></section>`;
    document.getElementById("back").onclick = () => control("prev");
    document.getElementById("reset").onclick = () => { if (confirm("¿Empezar una ronda nueva? Las respuestas de esta ronda dejan de contar.")) control("reset"); };
  }

  // Atajos de teclado para manejarlo con un control de presentaciones
  document.addEventListener("keydown", (e) => {
    if (!st) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); control(st.phase === "lobby" ? "start" : "next"); }
    if (["ArrowLeft", "PageUp"].includes(e.key) && st.phase !== "lobby") { e.preventDefault(); control("prev"); }
  });

  app.innerHTML = `<section class="intro"><h1>Conectando…</h1></section>`;
  poll();
}

if (adminKey) presenter(); else player();
