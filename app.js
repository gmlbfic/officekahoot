// ¿Y vos qué personaje de The Office serías? — modo en vivo
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
const ICONS = ["🦊","🐙","🦉","🐸","🐧","🦁","🐼","🐨","🐯","🦄","🐝","🦋","🐢","🦀","🐳","🦩","🦔","🦜","🐞","🦭","🐊","🦒","🦓","🐌","🦇","🐺","🐻","🐷","🐮","🐔"];
const randomIcon = (not) => { let i; do { i = ICONS[Math.floor(Math.random() * ICONS.length)]; } while (i === not); return i; };

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
  let profile = store.get("profile");
  if (profile && (!profile.name || !ICONS.includes(profile.icon))) profile = null;

  function join() {
    if (!profile || !st || offline || joinedRound === st.round) return;
    joinedRound = st.round;
    api("join", { pid, round: st.round, name: profile.name, icon: profile.icon }).catch(() => { joinedRound = null; });
  }

  function renderForm() {
    if (document.getElementById("profileForm")) return; // no pisar lo que la persona está escribiendo
    let icon = randomIcon();
    app.innerHTML = `<section class="intro"><h1>¿Y vos qué personaje de The Office serías?</h1>
      <form class="sheet profile" id="profileForm" autocomplete="off">
        <label for="nm">¿Cómo te llamamos?</label>
        <input id="nm" maxlength="20" placeholder="Tu nombre o apodo" required>
        <div class="iconrow"><span class="bigicon" id="ic" aria-label="Tu ícono">${icon}</span>
          <button type="button" class="btn ghost" id="reroll">Otro ícono</button></div>
        <button class="btn" type="submit">Entrar a la oficina</button>
      </form></section>`;
    document.getElementById("reroll").onclick = () => { icon = randomIcon(icon); document.getElementById("ic").textContent = icon; };
    document.getElementById("profileForm").onsubmit = (ev) => {
      ev.preventDefault();
      const name = document.getElementById("nm").value.replace(/\s+/g, " ").trim().slice(0, 20);
      if (!name) return;
      profile = { name, icon }; store.set("profile", profile);
      joinedRound = null; lastKey = ""; join(); render();
    };
    document.getElementById("nm").focus();
  }

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
    join();
    const key = [s.round, s.phase, s.q, mine.a[s.q] != null].join("|");
    if (key !== lastKey) { lastKey = key; render(); }
  }

  function render() {
    if (!profile && !offline) { renderForm(); return; }
    if (!st) { app.innerHTML = `<section class="intro"><h1>¿Y vos qué personaje de The Office serías?</h1><p>Conectando con la pantalla grande…</p></section>`; return; }
    if (st.phase === "lobby") {
      app.innerHTML = `<section class="intro"><h1>¿Y vos qué personaje de The Office serías?</h1>
        <div class="memo"><b>Ya estás adentro, ${esc(profile.icon)} ${esc(profile.name)}.</b> Esperá a que arranque el test en la pantalla grande.</div></section>`;
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
  let fstep = 0, revealed = {}, lastSig = "";
  const FINAL_STEPS = 4; // 0 diagnóstico, 1 revelación, 2 premios, 3 reparto completo

  async function control(action) {
    if (busy) return; busy = true;
    try { await api("control", { action }); await poll(true); }
    catch (e) { if (e.status === 401) return showError(); alert("No se pudo cambiar de pregunta. Probá de nuevo."); }
    finally { busy = false; }
  }

  // Si el servidor no responde, el presentador ve el motivo en vez de quedarse en "Conectando…".
  function showConnError(e) {
    const d = (e && e.data && e.data.diagnostico) || null;
    let why = "No se pudo contactar al servidor del quiz.";
    let fix = "Revisá que el deploy en Vercel esté terminado y recargá la página.";
    if (e && e.status === 404) { why = "El servidor no encuentra las funciones del quiz (/api)."; fix = "Verificá que la carpeta api esté en la raíz del repositorio y que el proyecto use el preset Other."; }
    else if (d && d.modo === "sin_base") {
      why = "No hay ninguna base de datos conectada al proyecto.";
      fix = "En Vercel: Storage, conectar una base Redis (Upstash o Redis) a este proyecto y después Redeploy.";
    } else if (e && e.data && e.data.error) { why = "La base de datos respondió con un error: " + e.data.error; }
    app.innerHTML = `<section class="sheet err"><h2 class="qtext">No hay conexión con el servidor</h2>
      <p><b>${esc(why)}</b></p><p>${esc(fix)}</p>
      <p class="field">Detalle técnico: estado ${esc(e && e.status || "sin respuesta")}${d ? `, variable de URL: ${esc(d.urlVar || "no encontrada")}, variable de token: ${esc(d.tokenVar || "no encontrada")}, clave de presentador configurada: ${d.adminKeySet ? "sí" : "no"}` : ""}</p>
      <p>Se reintenta solo cada segundo.</p></section>`;
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
    } catch (e) {
      if (!st) showConnError(e);
    }
    if (!once) setTimeout(poll, 1000);
  }

  const chip = (p) => `<span class="chip">${esc(p.icon)} ${esc(p.name)}</span>`;
  const peopleHTML = () => (st.people || []).length
    ? `<div class="chips">${st.people.map(chip).join("")}</div>`
    : `<p class="field">Todavía no entró nadie.</p>`;
  const facesHTML = () => `<div class="faces" aria-label="Quién respondió">${(st.people || [])
    .map((p) => `<span class="${p.answered ? "on" : ""}" title="${esc(p.name)}">${esc(p.icon)}</span>`).join("")}</div>`;

  // ---------- Cálculos del cierre grupal ----------
  function groupCounts() {
    const byChar = {};
    (st.people || []).forEach((p) => { if (p.result && CH[p.result]) (byChar[p.result] = byChar[p.result] || []).push(p); });
    const order = ORDER.filter((k) => byChar[k]).sort((a, b) => byChar[b].length - byChar[a].length || ORDER.indexOf(a) - ORDER.indexOf(b));
    const total = order.reduce((t, k) => t + byChar[k].length, 0);
    return { byChar, order, total };
  }

  function diagnosisHTML() {
    const { byChar, order, total } = groupCounts();
    if (!total) return `<p class="count">Esperando resultados…</p>`;
    const top = order[0], second = order[1];
    const balanced = order.length >= 4 && byChar[top].length / total <= 0.35;
    const [title, text] = balanced ? DIAG_BALANCED : DIAG[top];
    const twist = !balanced && second ? `<p class="twist">Con un toque de ${CH[second].name.split(" ")[0]}: ${DIAG_TWIST[second]}</p>` : "";
    return `<p class="field">Diagnóstico de la oficina</p><h1 class="big diag">${esc(title)}</h1>
      <p class="diagtext">${esc(text)}</p>${twist}`;
  }

  function revealHTML(animate) {
    const { byChar, order, total } = groupCounts();
    if (!total) return `<p class="count">Esperando resultados…</p>`;
    const max = byChar[order[0]].length;
    const winners = order.filter((k) => byChar[k].length === max);
    const rest = order.filter((k) => !winners.includes(k)).reverse(); // de menos a más
    const rows = rest.map((k, i) => `<div class="rrow ${animate ? "hide" : ""}" data-d="${i}">
        <span class="remb">${CH[k].emblem}</span><span class="rname" style="color:${CH[k].color}">${CH[k].name}</span>
        <span class="rcount">${byChar[k].length}</span><div class="chips">${byChar[k].map(chip).join("")}</div></div>`).join("");
    const winTitle = winners.length > 1
      ? `Disputa territorial: ${winners.map((k) => CH[k].name.split(" ")[0]).join(" y ")}`
      : `La oficina es de ${CH[winners[0]].name}`;
    const win = `<div class="winner ${animate ? "hide" : ""}" data-d="${rest.length}" style="--wc:${CH[winners[0]].color}">
        <div class="stamp">${winners.length > 1 ? "EMPATE" : "DOMINANTE"}</div>
        <div class="wemb">${winners.map((k) => CH[k].emblem).join(" ")}</div>
        <h1 class="big">${esc(winTitle)}</h1>
        <p class="field">${max} de ${total} ${total === 1 ? "persona" : "personas"}${winners.length > 1 ? " cada uno" : ""}</p>
        <div class="chips">${winners.flatMap((k) => byChar[k]).map(chip).join("")}</div></div>`;
    return `<p class="field">¿De quién es esta oficina?</p><div class="reveal">${rows}${win}</div>`;
  }

  function awardsHTML() {
    const ppl = (st.people || []).filter((p) => p.result && Array.isArray(p.answers) && p.answers.some((a) => a != null));
    if (ppl.length < 2) return `<p class="count">Los premios necesitan al menos dos participantes.</p>`;
    const cards = [];
    // Almas gemelas: el par con más respuestas iguales
    let best = null;
    for (let i = 0; i < ppl.length; i++) for (let j = i + 1; j < ppl.length; j++) {
      let same = 0, both = 0;
      ppl[i].answers.forEach((a, q) => { const b = ppl[j].answers[q]; if (a != null && b != null) { both++; if (a === b) same++; } });
      if (both && (!best || same > best.same)) best = { a: ppl[i], b: ppl[j], same, both };
    }
    if (best && best.same > 0) cards.push(["💞", "Almas gemelas", `${chip(best.a)} ${chip(best.b)}`, `${best.same} de ${best.both} respuestas iguales`]);
    // Pureza: qué tan concentrado está el puntaje en el personaje principal
    const purity = ppl.map((p) => { const { s, ranked } = scoreFrom(p.answers); const tot = Object.values(s).reduce((t, v) => t + v, 0) || 1; return { p, top: ranked[0], share: s[ranked[0]] / tot }; })
      .sort((x, y) => y.share - x.share);
    const pure = purity[0];
    cards.push([CH[pure.top].emblem, `La persona más ${CH[pure.top].name.split(" ")[0]} de la sala`, chip(pure.p), `${Math.round(pure.share * 100)} % ${CH[pure.top].name.split(" ")[0]}`]);
    const mixed = purity[purity.length - 1];
    if (ppl.length >= 3 && mixed.p !== pure.p) cards.push(["🌀", "Indescifrable", chip(mixed.p), `Su puntaje está repartido entre varios personajes`]);
    // Oveja negra: más elecciones que nadie más hizo
    const picks = Array.from({ length: Q.length }, () => ({}));
    ppl.forEach((p) => p.answers.forEach((a, q) => { if (a != null) picks[q][a] = (picks[q][a] || 0) + 1; }));
    const lone = ppl.map((p) => ({ p, n: p.answers.filter((a, q) => a != null && picks[q][a] === 1).length })).sort((x, y) => y.n - x.n);
    if (ppl.length >= 3 && lone[0].n > 0) cards.push(["🐑", "La oveja negra", chip(lone[0].p), `${lone[0].n} ${lone[0].n === 1 ? "respuesta que nadie más eligió" : "respuestas que nadie más eligió"}`]);
    return `<p class="field">Premios de la oficina</p><div class="awards">${cards.map(([e, t, who, d]) =>
      `<div class="award"><div class="aemb">${e}</div><h3>${esc(t)}</h3><div class="chips">${who}</div><p>${esc(d)}</p></div>`).join("")}</div>`;
  }

  function runReveal() {
    const items = [...app.querySelectorAll(".reveal .hide")];
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    items.forEach((el) => {
      const d = +el.dataset.d, last = el.classList.contains("winner");
      setTimeout(() => el.classList.remove("hide"), reduce ? 0 : (last ? d * 1100 + 1200 : d * 1100 + 300));
    });
  }

  function tallyHTML() {
    const byChar = {};
    (st.people || []).forEach((p) => { if (p.result && CH[p.result]) (byChar[p.result] = byChar[p.result] || []).push(p); });
    const total = Object.values(byChar).reduce((t, l) => t + l.length, 0);
    if (!total) return `<p class="count">Esperando resultados…</p>`;
    return ORDER.filter((k) => byChar[k]).sort((a, b) => byChar[b].length - byChar[a].length).map((k) => `
      <div class="trow"><div class="bar" style="--bc:${CH[k].color}">
        <span>${CH[k].emblem} ${CH[k].name.split(" ")[0]}</span>
        <i><b style="width:${Math.round((byChar[k].length / total) * 100)}%"></b></i><span>${byChar[k].length}</span></div>
        <div class="chips">${byChar[k].map(chip).join("")}</div></div>`).join("");
  }

  function render() {
    const key = [st.round, st.phase, st.q].join("|");
    const full = key !== lastKey; lastKey = key;
    if (st.phase !== "final") fstep = 0;
    if (st.phase === "final") { renderFinal(full); return; }
    const live = document.getElementById("live");
    if (!full && live) {
      live.innerHTML = st.phase === "lobby" ? `${st.players} conectados`
        : st.phase === "question" ? `${st.answered} de ${st.players} respondieron` : tallyHTML();
      const ppl = document.getElementById("people");
      if (ppl) ppl.innerHTML = st.phase === "lobby" ? peopleHTML() : facesHTML();
      return;
    }
    if (st.phase === "lobby") {
      app.innerHTML = `<section class="sheet lobby">
        <div><h1 class="big">¿Y vos qué personaje de The Office serías?</h1>
          <p class="url">Escaneá el código o entrá a<br><b>${esc(PUBLIC_URL)}</b></p>
          <p class="count" id="live">${st.players} conectados</p>
          <div id="people">${peopleHTML()}</div>
          <div class="controls"><button class="btn" id="go">Empezar el test</button></div></div>
        <div class="qr" id="qr"></div></section>`;
      if (window.QRCode) new QRCode(document.getElementById("qr"), { text: PUBLIC_URL, width: 260, height: 260 });
      document.getElementById("go").onclick = () => control("start");
      return;
    }
    if (st.phase === "question") {
      const last = st.q === Q.length - 1;
      app.innerHTML = `<div class="pres-top"><span class="tab">Pregunta ${st.q + 1} de ${Q.length}</span>
        <div id="people">${facesHTML()}</div>
        <span class="count" id="live">${st.answered} de ${st.players} respondieron</span></div>
        <section class="sheet"><div class="qhead"><h2 class="qtext">${esc(Q[st.q].q)}</h2></div>
        ${optionsGrid(st.q, { interactive: false })}
        <div class="nav controls"><button class="btn ghost" id="prev" ${st.q === 0 ? "disabled" : ""}>Anterior</button>
        <button class="btn" id="next">${last ? "Ver resultados" : "Siguiente pregunta"}</button></div></section>`;
      document.getElementById("prev").onclick = () => control("prev");
      document.getElementById("next").onclick = () => control("next");
      return;
    }
    renderFinal(full);
  }

  function renderFinal(force) {
    const sig = (st.people || []).map((p) => p.result || "-").join(",");
    if (!force && sig === lastSig) return;
    if (!force && fstep === 1 && revealed[st.round] !== "done") return; // no interrumpir la revelación
    lastSig = sig;
    let body;
    if (fstep === 0) body = diagnosisHTML();
    else if (fstep === 1) body = revealHTML(force && !revealed[st.round]);
    else if (fstep === 2) body = awardsHTML();
    else body = `<h1 class="big">Así quedó la oficina</h1><p>Cada uno tiene su expediente en el celular.</p><div id="live">${tallyHTML()}</div>`;
    const last = fstep === FINAL_STEPS - 1;
    app.innerHTML = `<span class="tab">Cierre ${fstep + 1} de ${FINAL_STEPS}</span>
      <section class="sheet tally">${body}
      <div class="controls" style="margin-top:24px">
        <button class="btn ghost" id="back">Anterior</button>
        ${last ? `<button class="btn ghost" id="reset">Nueva ronda</button>` : `<button class="btn" id="fnext">Siguiente</button>`}
      </div></section>`;
    if (fstep === 1 && force && !revealed[st.round]) {
      revealed[st.round] = "running"; runReveal();
      const n = app.querySelectorAll(".reveal .hide").length;
      setTimeout(() => { revealed[st.round] = "done"; }, n * 1100 + 1600);
    }
    document.getElementById("back").onclick = () => finalBack();
    const nx = document.getElementById("fnext"); if (nx) nx.onclick = () => finalNext();
    const rs = document.getElementById("reset");
    if (rs) rs.onclick = () => { if (confirm("¿Empezar una ronda nueva? Las respuestas de esta ronda dejan de contar.")) control("reset"); };
  }
  function finalNext() { if (fstep < FINAL_STEPS - 1) { fstep++; renderFinal(true); } }
  function finalBack() { if (fstep > 0) { fstep--; renderFinal(true); } else control("prev"); }

  // Atajos de teclado para manejarlo con un control de presentaciones
  document.addEventListener("keydown", (e) => {
    if (!st) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); if (st.phase === "final") finalNext(); else control(st.phase === "lobby" ? "start" : "next"); }
    if (["ArrowLeft", "PageUp"].includes(e.key) && st.phase !== "lobby") { e.preventDefault(); if (st.phase === "final") finalBack(); else control("prev"); }
  });

  app.innerHTML = `<section class="intro"><h1>Conectando…</h1></section>`;
  poll();
}

if (adminKey) presenter(); else player();
