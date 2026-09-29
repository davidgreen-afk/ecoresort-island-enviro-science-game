/* Island Reborn: user interface. Renders each phase, the dashboard, and handles every interaction. */
(function () {
  const D = window.DATA, C = window.ECO_CONFIG, M = window.Model, A = window.Avatars, E = window.Export, Sim = window.Sim;
  const clamp = M.clamp, R = Math.round, esc = E.esc;
  const $ = s => document.querySelector(s);
  let S = null, prevM = null, tab = "vitals", nightOn = false, pick = null, dlg = null, typer = null;
  const NP = window.NPCS;

  const ZN = {}; D.zones.forEach(z => { ZN[z.id] = z; });
  const majorOf = id => D.majors.find(m => m.id === id) || D.majors[0];
  const diff = () => C.difficulty[S.difficulty];
  const phIdx = id => D.phases.findIndex(p => p.id === id);

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function award(key, pts) { S.awarded = S.awarded || {}; if (!S.awarded[key]) { S.awarded[key] = 1; S.kp += pts; toast("+" + pts + " knowledge points"); } }
  function setPath(path, val) { const p = path.split("."); let o = S; for (let i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = val; }
  function getPath(path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), S); }
  function maxIdx() { const i = D.phases.findIndex(p => !S.done[p.id]); return i < 0 ? D.phases.length - 1 : i; }

  // ---------- Modal ----------
  function openModal(html) { $("#modalBox").innerHTML = html; $("#modal").classList.add("open"); const f = $("#modalBox button, #modalBox input"); if (f) f.focus(); }
  function closeModal() { $("#modal").classList.remove("open"); }

  // ---------- Meters and charts ----------
  function meter(label, val, o) {
    o = o || {}; const good = o.low ? 100 - val : val, col = good >= 66 ? "#2f855a" : good >= 40 ? "#F4A825" : "#D9483B";
    const d = o.prev != null ? val - o.prev : 0, dc = (o.low ? -d : d) > 0 ? "up" : "down";
    return `<div class="meter"><div class="lab"><span>${label}</span><b>${R(val)}${Math.abs(d) >= 1 ? `<span class="delta ${dc}">${d > 0 ? "+" : ""}${R(d)}</span>` : ""}</b></div><div class="bar"><i style="width:${clamp(val)}%;background:${col}"></i></div></div>`;
  }
  function lineChart(hist, series) {
    if (!hist.length) return "";
    const w = 340, h = 150, px = 28, n = D.events.length, X = y => px + (y - 1) / (n - 1) * (w - px - 8), Y = v => h - 18 - clamp(v) / 100 * (h - 32);
    let g = "";
    [0, 50, 100].forEach(v => { g += `<line x1="${px}" x2="${w - 8}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d5e2df"/><text x="${px - 4}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="#64748b">${v}</text>`; });
    series.forEach(sr => { g += `<polyline fill="none" stroke="${sr.c}" stroke-width="2.5" points="${hist.map(p => X(p.year) + "," + Y(p[sr.k])).join(" ")}"/>`; });
    for (let y = 1; y <= n; y += 3) g += `<text x="${X(y)}" y="${h - 4}" font-size="10" text-anchor="middle" fill="#64748b">${2030 + y}</text>`;
    const leg = series.map(sr => `<span style="color:${sr.c};font-size:12px;margin-right:10px">● ${sr.l}</span>`).join("");
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Trends over ten years">${g}</svg><div>${leg}</div>`;
  }

  // ---------- Dashboard ----------
  function renderChips() {
    const yr = S.sim && S.sim.year ? 2030 + S.sim.year : 2030;
    $("#chipYear").textContent = yr; $("#chipKP").textContent = S.kp;
    const c = $("#chipResort"); if (S.resortName.trim()) { c.hidden = false; c.textContent = S.resortName; } else c.hidden = true;
  }
  function renderBoard() {
    $("#board").innerHTML = `<span class="rname">${esc(S.resortName || C.island.name + " project")}</span>` +
      S.team.map((t, i) => `<button class="dir ${S.hero === i ? "hero" : ""}" data-act="hero" data-i="${i}" title="Play as ${esc(t.name || "this director")}">${A.svg(t.av, 42, { label: t.name, badge: "" })}<div>${esc(t.name || "Director")}${S.hero === i ? " 🎮" : ""}<small>${esc(t.role)} ${majorOf(t.major).icon}</small></div></button>`).join("");
  }
  function renderHud(m) {
    $("#hud").innerHTML = m.operating ? `<span class="chip">👥 <b>${S.visitors}k</b> guests a year</span><span class="chip">💼 <b>${m.jobs}</b> jobs</span><span class="chip">⚡ <b>${R(m.renewShare * 100)}%</b> renewable</span><span class="chip">🧹 <b>${S.debris.length}/${NP.debris.length}</b></span>` : `<span class="chip">🏝️ ${esc(C.island.name)}, ${esc(C.island.region)}</span>`;
  }
  function renderTab(m) {
    const pane = $("#tabpane"), fin = S.sim && S.sim.final, p = prevM || m;
    document.querySelectorAll("#tabbar button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === tab));
    if (tab === "vitals") {
      const over = m.capex > m.budget;
      pane.innerHTML = `<div class="meters">${meter("Biodiversity", m.bio, { prev: p.bio })}${meter("Water quality", m.wq, { prev: p.wq })}${meter("Community", m.comm, { prev: p.comm })}${meter("Health", m.health, { prev: p.health })}${meter("Guest happiness", m.guest, { prev: p.guest })}${meter("Storm resilience", m.resil, { prev: p.resil })}${meter("Staff well-being", m.empl, { prev: p.empl })}${meter("Footprint (lower is better)", m.fpIdx, { low: true, prev: p.fpIdx })}</div>
<div class="budgetbar" title="Capital committed"><i class="${over ? "over" : ""}" style="width:${clamp(m.capex / m.budget * 100, 0, 100)}%"></i></div>
<div class="money"><div>Capital<b>$${R(m.capex)}M</b>of $${m.budget}M${over ? " (over)" : ""}</div><div>Revenue<b>$${R(m.revenue)}M</b>a year</div><div>Profit<b>${m.profit < 0 ? "−" : ""}$${R(Math.abs(m.profit))}M</b>${m.profit > 0 ? "payback " + R(m.payback) + " yrs" : "a year"}</div></div>`;
    } else if (tab === "quests") {
      const cons = D.phases.filter(p => p.consult), done = cons.filter(p => S.talked[p.id]).length, sk = NP.spots, fnd = sk.filter(x => S.found[x.id]).length, dn = NP.debris.length;
      const bar = (a, b) => `<div class="qbar"><i style="width:${a / b * 100}%"></i></div>`;
      const tour = S.tut && S.tut.on && !S.tut.done ? `<div class="quest"><b>Village tour</b>: ${Object.keys(S.tut.steps).length} of ${NP.tutorial.length}<div class="legend">${(tutNext() || {}).text || ""}</div></div>` : "";
      const side = QS.map(q => {
        const st = S.quests[q.id], gv = NP.N[q.giver];
        if (st && st.st === "done") return `<div class="quest"><b>${esc(q.title)}</b> <span class="ck">Done ✓</span></div>`;
        if (st) return `<div class="quest"><b>${esc(q.title)}</b>: step ${st.step + 1} of ${q.steps.length}${bar(st.step, q.steps.length)}<div class="legend">${esc(q.steps[st.step].text)}<br><i>${esc(q.teaser)}</i></div></div>`;
        if (q.unlock(S)) return `<div class="quest" style="border-color:var(--gold)"><b>New: ${esc(q.title)}</b><div class="legend">Talk to ${esc(gv.name)} at ${esc(gv.spot)}. ${esc(q.teaser)}.</div></div>`;
        return "";
      }).join("");
      const lockedN = QS.filter(q => !S.quests[q.id] && !q.unlock(S)).length;
      const trusts = Object.keys(S.trust).filter(k => S.trust[k]).map(k => `${esc(NP.N[k].name.split(" ").slice(-1)[0])} ${S.trust[k] > 0 ? "+" : ""}${S.trust[k]}`).join(", ");
      pane.innerHTML = tour + side + (lockedN ? `<div class="quest" style="opacity:.6">🔒 ${lockedN} more side quest${lockedN > 1 ? "s" : ""} will open as your plan grows.</div>` : "") +
        `<div class="quest"><b>Listen to the island</b>: ${done} of ${cons.length} conversations${bar(done, cons.length)}<div class="legend">A gold ! means someone has something to tell you. A ? means you can report back. A 💬 means someone has a reaction to what you built.</div></div>
<div class="quest"><b>Shoreline cleanup</b>: ${S.debris.length} of ${dn} pieces ${S.debrisPaid ? '<span class="ck">Done ✓</span>' : S.debris.length >= dn ? "Tell Old Tomas!" : ""}${bar(S.debris.length, dn)}<div class="legend">Walk over the glinting litter along the beaches.</div></div>
<div class="quest"><b>Field survey</b>: ${fnd} of ${sk.length} readings${bar(fnd, sk.length)}<div class="legend">${sk.map(x => (S.found[x.id] ? "✓ " : "○ ") + x.label).join("<br>")}</div></div>
<div class="quest"><b>Community trust</b>: ${m.trustBonus >= 0 ? "+" : ""}${Math.round(m.trustBonus * 10) / 10} to your community score<div class="legend">${trusts || "Nobody yet."}<br>Trust unlocks options in later phases. Very low trust can lock some.</div></div>`;
    } else if (tab === "venn") {
      const e = fin ? fin.env : m.env, s2 = fin ? fin.soc : m.soc, ec = fin ? fin.econ : m.econ, t = fin ? fin.tbl : m.tbl;
      pane.innerHTML = `<div style="display:grid;justify-items:center">${E.vennSVG(e, s2, ec, t)}</div><p class="note">${fin ? "Final scores after ten years." : "Live scores for the current plan."} The overlap is the geometric mean, so one weak circle pulls it down.</p>`;
    } else if (tab === "foot") {
      const keys = Object.keys(m.fpBy).sort((a, b) => m.fpBy[b] - m.fpBy[a]), mx = Math.max.apply(null, keys.map(k => Math.abs(m.fpBy[k])).concat([1]));
      pane.innerHTML = keys.map(k => { const v = m.fpBy[k]; return `<div class="cov"><div class="row" style="grid-template-columns:150px 1fr 48px"><span>${esc(k)}</span><div class="bar" style="background:#eef3f2"><i style="width:${Math.abs(v) / mx * 100}%;background:${v < 0 ? "#2f855a" : "#c9793a"}"></i></div><b>${v < 0 ? "" : "+"}${Math.round(v * 10) / 10}</b></div></div>`; }).join("") +
        `<p class="note">Footprint index: <b>${R(m.fpIdx)}</b> (lower is better). Green bars are reductions and offsets.</p>`;
    } else {
      const rows = D.groups.filter(g => (S.sel[g.id] || []).length).map(g => `<p><b>${esc(g.title)}:</b> ${esc(M.selected(S, g.id).map(o => o.name).join("; "))}</p>`).join("");
      const refl = D.phases.filter(p => (S.reflect[p.id] || "").trim()).map(p => `<p><b>${esc(p.title)}:</b> <i>${esc(S.reflect[p.id])}</i></p>`).join("");
      pane.innerHTML = (rows || "<p>Your decisions will collect here.</p>") + (refl ? "<h4>Team reflections</h4>" + refl : "");
    }
  }
  function renderDash() { const m = M.compute(S); renderHud(m); renderTab(m); prevM = m; return m; }

  // ---------- Quests, tour, reactions, markers ----------
  const QS = NP.quests;
  const qStep = q => { const st = S.quests[q.id]; return st && st.st === "active" ? q.steps[st.step] : null; };
  const tutOn = () => !!(S.tut && S.tut.on && !S.tut.done);
  const tutNext = () => NP.tutorial.find(x => !S.tut.steps[x.id]);
  const reactionFor = (id, m) => NP.reactions.find(r => r.npc === id && !S.reacted[r.id] && r.when(S, m));
  function questTalkFor(id) { for (let i = 0; i < QS.length; i++) { const s = qStep(QS[i]); if (s && s.type === "talk" && s.npc === id) return { q: QS[i], s }; } return null; }
  const questOfferFor = id => QS.find(q => q.giver === id && !S.quests[q.id] && q.unlock(S));
  function markFor(id, m) {
    if (tutOn()) { const nx = tutNext(); if (nx && nx.npc === id) return "!"; }
    const cur = D.phases[S.phase];
    if (cur.consult === id && !S.talked[cur.id] && !S.skipped[cur.id] && NP.N[id].topics[cur.id]) return "!";
    if (questTalkFor(id)) return "?";
    if (questOfferFor(id)) return "!";
    if (id === "tomas" && S.debris.length >= NP.debris.length && !S.debrisPaid) return "?";
    if (reactionFor(id, m)) return "💬";
    return "";
  }
  function guide() {
    const hot = {}; let wp = null;
    QS.forEach(q => { const s = qStep(q); if (s && s.type === "inspect") hot[s.spot] = 1; });
    if (tutOn()) {
      const nx = tutNext();
      if (nx) { if (nx.spot) hot[nx.spot] = 1; if (nx.npc) wp = NP.N[nx.npc].at; else if (nx.spot) wp = NP.spots.find(x => x.id === nx.spot).at; else if (nx.debris) { const d = NP.debris.find(x => x.id === nx.debris && S.debris.indexOf(x.id) < 0) || NP.debris.find(x => S.debris.indexOf(x.id) < 0); if (d) wp = { x: d.x, y: d.y }; } }
      return { wp, hot };
    }
    const cur = D.phases[S.phase];
    if (cur.consult && !S.talked[cur.id] && !S.skipped[cur.id]) wp = NP.N[cur.consult].at;
    if (!wp) for (let i = 0; i < QS.length && !wp; i++) { const s = qStep(QS[i]); if (s) wp = s.type === "talk" ? NP.N[s.npc].at : NP.spots.find(x => x.id === s.spot).at; }
    return { wp, hot };
  }
  function advanceQuest(q) {
    const st = S.quests[q.id]; st.step++;
    if (st.step >= q.steps.length) { st.st = "done"; award("quest:" + q.id, q.reward.kp); toast("⭐ Quest complete: " + q.title); }
    else toast("Quest updated: " + q.title);
  }
  function questInspect(spotId) { QS.forEach(q => { const s = qStep(q); if (s && s.type === "inspect" && s.spot === spotId) advanceQuest(q); }); }
  function tutCheck() { if (tutOn() && NP.tutorial.every(x => S.tut.steps[x.id])) { S.tut.done = true; award("tour", 10); toast("🎉 Tour complete! Meet your advisors when you are ready."); } }
  function tutTick() { changed(); if (M.phaseId(S) === "intro") render(); }

  // ---------- Scene bridge ----------
  function refreshScene(m) {
    m = m || M.compute(S);
    const id = M.phaseId(S), mapMode = id === "map";
    let place = S.place;
    if (!mapMode) place = Object.assign({}, M.autoPlace(S), S.place);
    const tone = {};
    if (mapMode && pick) {
      D.plots.forEach(p => {
        const r = M.evalPlacement(pick, p, S), sc = r.e.bio + r.e.wq + r.e.comm + r.e.health + r.e.guest + r.e.resil + r.e.empl - r.e.cost * 2 + (r.z.mangrove || 0) + (r.z.inland || 0) - (r.exposed ? 3 : 0);
        tone[p.id] = sc >= 3 ? "good" : sc >= -3 ? "warn" : "bad";
      });
    }
    let scale = 1;
    if (S.sim && S.sim.year && !S.sim.done) scale = clamp(S.sim.cur.bio / Math.max(m.bio, 1), 0.25, 1.1);
    const gd = guide();
    const npcs = Object.keys(NP.N).map(id => {
      const n = NP.N[id], bk = NP.barks[id] ? NP.barks[id](m) : null;
      return { id, x: n.at.x, y: n.at.y, name: n.name, skin: A.SKIN[n.av.skin], hair: A.HAIR[n.av.hairColor], shirt: A.OUTFIT[n.av.outfit], mark: markFor(id, m), bark: bk };
    });
    const hr = S.team[S.hero] || S.team[0];
    Scene.setModel({ npcs, spots: NP.spots.map(x => ({ id: x.id, x: x.at.x, y: x.at.y, icon: x.icon, label: x.label, done: !!S.found[x.id], hot: !!gd.hot[x.id] })),
      debris: NP.debris.filter(d => S.debris.indexOf(d.id) < 0), hero: { shirt: A.OUTFIT[hr.av.outfit % 8], skin: A.SKIN[hr.av.skin % 6], hair: A.HAIR[hr.av.hairColor % 8], name: hr.name || "" },
      waypoint: gd.wp ? { x: gd.wp.x, y: gd.wp.y } : null, zq: m.zq, fpIdx: m.fpIdx, wq: m.wq, bio: m.bio, sel: S.sel, place, visitors: S.visitors, species: S.species, name: S.resortName,
      brand: E.PALETTES[S.palette || 0].c, team: S.team, derelictGone: !!m.flags.decon, mapMode, plotTone: tone, night: nightOn, scale, invest: S.invest });
  }
  function changed() { const pr = M.prune(S); if (pr.length) toast("🔒 No longer available: " + pr.join(", ")); M.save(S); const m = renderDash(); refreshScene(m); renderChips(); renderBoard(); }
  function full() { const y = window.scrollY; changed(); render(); window.scrollTo(0, y); }

  // ---------- Quest rail ----------
  function renderQuest() {
    const mi = maxIdx();
    $("#quest").innerHTML = D.phases.map((p, i) => `<button data-act="goto" data-i="${i}" class="${S.done[p.id] ? "done" : ""} ${i === S.phase ? "cur" : ""} ${i > mi ? "lock" : ""}" title="${esc(p.title)}" aria-label="${esc(p.title)}" ${i > mi ? "disabled" : ""}>${p.icon}</button>`).join("");
  }

  // ---------- Building blocks ----------
  function effChips(o) {
    if (!diff().showEffects) return "";
    const e = o.eff, out = [], sc = k => ((o.v || []).indexOf(k) >= 0 ? "*" : "");
    const push = (t, c) => out.push(`<span class="${c}">${t}</span>`), sg = v => (v > 0 ? "+" : "−") + Math.abs(v);
    if (e.cost) push("$" + e.cost + "M", e.cost > 0 ? "b" : "g");
    if (e.ops) push("$" + e.ops + "M a year" + sc("ops"), e.ops > 0 ? "b" : "g");
    if (e.cap) push("Supports " + e.cap + "k guests", "g");
    if (e.dem) push("Cuts demand " + R(e.dem * 100) + "%", "g");
    if (o.mit) push("Cuts activity damage " + R(o.mit * 100) + "%", "g");
    if (e.rev) push(sg(e.rev).replace(/^(.)/, "$1$") + " per visit", e.rev > 0 ? "g" : "b");
    [["bio", "Biodiversity"], ["wq", "Water quality"], ["comm", "Community"], ["health", "Health"], ["guest", "Guests"], ["resil", "Resilience"], ["empl", "Staff"], ["edu", "Learning"], ["jobs", "Jobs"], ["conn", "Connectivity"]].forEach(a => { if (e[a[0]]) push(a[1] + " " + sg(e[a[0]]) + sc(a[0]), e[a[0]] > 0 ? "g" : "b"); });
    if (e.fp) push("Footprint " + sg(e.fp) + sc("fp"), e.fp > 0 ? "b" : "g");
    if (e.z) for (const z in e.z) push(ZN[z].short + " habitat " + sg(e.z[z]), e.z[z] > 0 ? "g" : "b");
    return `<div class="eff">${out.join("")}</div>`;
  }
  function groupHTML(g) {
    const sel = S.sel[g.id], cnt = M.selected(S, g.id).length, full = g.max > 1 && cnt >= g.max;
    const rule = g.max === 1 ? "Pick one" : g.min > 0 ? `Pick ${g.min} to ${g.max}` : `Pick up to ${g.max}`;
    return `<div class="grp"><h3>${g.pillar ? "Pillar " + g.pillar + ": " : ""}${esc(g.title)}<small>${rule}, ${cnt} chosen</small></h3><p class="prompt">${esc(g.prompt)}</p><div class="opts">` +
      g.options.map(o => { const lk = M.lock(S, o), on = !lk.locked && sel.indexOf(o.id) >= 0;
        return `<button class="opt ${on ? (o.violates ? "bad" : "sel") : ""} ${lk.locked ? "locked" : ""} ${full && !on && !lk.locked ? "full" : ""}" data-act="toggle" data-g="${g.id}" data-o="${o.id}" aria-pressed="${on}"><span class="oi">${lk.locked ? "🔒" : o.icon}</span><span><span class="on">${esc(o.name)}</span><br><span class="od">${esc(o.d)}</span>${lk.locked ? `<div class="onote lock">${esc(lk.why)}</div>` : effChips(o)}${on && o.n ? `<div class="onote">${esc(o.n)}</div>` : ""}${on && o.violates ? `<div class="onote" style="background:#fde4e1;color:#a63428">${esc(o.violates)}</div>` : ""}</span></button>`; }).join("") + "</div></div>";
  }
  function covHTML(m, keys) {
    const L = { water: "Water", food: "Food", energy: "Energy", waste: "Waste", lodging: "Lodging" };
    const rows = keys.filter(k => (S.sel[k] || []).length || k === "lodging").map(k => {
      const pct = m.cov[k] * 100, w = clamp(pct / 2, 0, 100);
      return `<div class="row"><span>${L[k]}</span><div class="bar"><i style="width:${w}%;background:${pct < 100 ? "#D9483B" : "#0B7A75"}"></i></div><b>${R(pct)}%</b></div>`;
    }).join("");
    let extra = "";
    if (keys.indexOf("energy") >= 0 && (S.sel.energy || []).length) extra += `<p class="note">Renewable share: <b>${R(m.renewShare * 100)}%</b></p>`;
    if (keys.indexOf("food") >= 0 && (S.sel.food || []).length) extra += `<p class="note">Locally produced: <b>${R(m.localShare * 100)}%</b> of your food supply.</p>`;
    if (!rows) return "";
    return `<div class="cov"><h4 style="margin:6px 0;font-family:var(--serif)">Coverage of demand at ${S.visitors},000 guests</h4>${rows}<p style="font-size:12px;margin:2px 0;color:#64748b">The center line is 100% of demand. Below it, emergency supplies cost money and add to your footprint.</p></div>${extra}`;
  }
  function econBox(m) {
    return `<div class="money" id="econ"><div>Guests hosted<b>${R(m.effV)}k</b>of ${S.visitors}k</div><div>Revenue<b>$${R(m.revenue)}M</b>a year</div><div>Profit<b>${m.profit < 0 ? "−" : ""}$${R(Math.abs(m.profit))}M</b>a year</div></div>`;
  }
  function quizHTML(ph) {
    if (!ph.quiz) return "";
    const q = ph.quiz, ans = S.quiz[ph.id];
    return `<div class="quiz"><h4>Knowledge check</h4><p>${esc(q.q)}</p>` + q.opts.map((o, i) => `<button class="qopt ${ans != null ? (i === q.a ? "right" : i === ans ? "wrong" : "") : ""}" data-act="quiz" data-i="${i}" ${ans != null ? "disabled" : ""}>${esc(o)}</button>`).join("") + (ans != null ? `<p class="why">${ans === q.a ? "Correct. " : "Not quite. "}${esc(q.why)}</p>` : "") + "</div>";
  }
  function reflectHTML(ph) {
    if (!ph.reflect) return "";
    return `<div class="reflect"><h4>Team reflection</h4><p style="margin:0 0 6px;font-size:14px">${esc(ph.reflect)}</p><textarea data-bind="reflect.${ph.id}" placeholder="Discuss as a team, then write what you agreed on.">${esc(S.reflect[ph.id] || "")}</textarea></div>`;
  }

  // ---------- Phase bodies ----------
  function bodyTeam() {
    const cards = S.team.map((t, i) => {
      const sw = (k, arr, cur) => arr.map((c, j) => `<button class="sw ${cur === j ? "on" : ""}" style="background:${c}" data-act="av" data-m="${i}" data-k="${k}" data-v="${j}" aria-label="${k} ${j + 1}"></button>`).join("");
      const pills = (k, arr, cur) => arr.map(v => `<button class="pillbtn ${cur === v ? "on" : ""}" data-act="av" data-m="${i}" data-k="${k}" data-v="${v}">${v}</button>`).join("");
      return `<div class="dircard"><div>${A.svg(t.av, 96, { label: t.name || "Director " + (i + 1), badge: majorOf(t.major).icon })}<button class="btn small ghost" style="color:var(--navy);margin-top:6px" data-act="avrand" data-m="${i}">Shuffle</button></div>
<div class="fields"><div class="full"><label for="dn${i}">Director ${i + 1} name</label><input type="text" id="dn${i}" data-bind="team.${i}.name" value="${esc(t.name)}" maxlength="24" placeholder="Name"></div>
<div><label>Major</label><select data-sel="team.${i}.major">${D.majors.map(m => `<option value="${m.id}" ${m.id === t.major ? "selected" : ""}>${m.icon} ${m.label}</option>`).join("")}</select></div>
<div><label>Board role</label><select data-sel="team.${i}.role">${D.roles.map(r => `<option ${r === t.role ? "selected" : ""}>${r}</option>`).join("")}</select></div>
<div><label>Skin</label><div class="swatches">${sw("skin", A.SKIN, t.av.skin)}</div></div><div><label>Outfit</label><div class="swatches">${sw("outfit", A.OUTFIT, t.av.outfit)}</div></div>
<div><label>Hair color</label><div class="swatches">${sw("hairColor", A.HAIR, t.av.hairColor)}</div></div><div><label>Hair style</label><div class="swatches">${pills("hairStyle", A.STYLES, t.av.hairStyle)}</div></div>
<div class="full"><label>Accessory</label><div class="swatches">${pills("acc", A.ACCS, t.av.acc)}</div></div></div></div>`;
    }).join("");
    const cov = M.teamCoverage(S);
    return `<div class="dirs">${cards}</div><p class="note">Expertise coverage: your board has a specialist for <b>${R(cov * 100)}%</b> of the decisions ahead. Specialists lead their phases and unlock insights.</p>`;
  }
  function bodyName() {
    return `<label for="rn"><b>Resort name</b></label><input type="text" id="rn" data-bind="resortName" value="${esc(S.resortName)}" maxlength="30" placeholder="For example, Osprey Landing">
<p><button class="btn small" data-act="suggestName">Suggest a name</button></p>
<label for="tg"><b>Tagline</b></label><input type="text" id="tg" data-bind="tagline" value="${esc(S.tagline)}" maxlength="70" placeholder="One line that tells guests what makes you different">
<p><button class="btn small" data-act="suggestTag">Suggest a tagline</button></p>
<p><b>Brand color</b> (shows on your sign and your pitch page)</p><div class="pal">${E.PALETTES.map((p, i) => `<button data-act="pal" data-i="${i}" class="${(S.palette || 0) === i ? "on" : ""}" style="background:${p.c}" aria-label="${p.name}"></button>`).join("")}</div>`;
  }
  function bodyConcept(m) {
    return `<div class="grp"><h3>Guests a year<small>Revenue rises with volume. So does pressure.</small></h3><div class="slider"><input type="range" min="10" max="120" step="5" value="${S.visitors}" data-range="visitors" aria-label="Guests a year in thousands"><output id="visOut">${S.visitors},000</output></div><div id="econWrap">${econBox(m)}</div>
<p class="note" id="crowdNote" ${S.visitors > 50 ? "" : "hidden"}>Above about 50,000 guests, crowding starts to lower guest happiness.</p></div>` +
      groupHTML(D.groupById.lodging) + covHTML(m, ["lodging"]) + groupHTML(D.groupById.recreation) + groupHTML(D.groupById.mitigation) +
      `<p class="note">Damage from activities is cut to <b>${R(m.mitF * 100)}%</b> of its unprotected level by your safeguards. Effects marked * grow with guest numbers.</p>`;
  }
  function bodyHabitats(m) {
    const z = D.zones.map(zn => `<div class="zone"><div class="zt"><span>${zn.icon} ${esc(zn.name)}</span><span class="zq" id="zq-${zn.id}">${R(m.zq[zn.id])}</span></div><p>${esc(zn.what)}</p>
<div class="slider"><input type="range" min="0" max="30" step="1" value="${S.invest[zn.id]}" data-range="invest.${zn.id}" aria-label="Investment in ${zn.short}, millions"><output id="io-${zn.id}">$${S.invest[zn.id]}M</output></div><div class="meter"><div class="bar"><i id="zb-${zn.id}" style="width:${m.zq[zn.id]}%;background:${zn.color}"></i></div></div></div>`).join("");
    return `<p class="note">Habitat quality runs from 0 (degraded) to 100 (thriving). Your weakest habitat limits the chain.</p>${z}<p class="note" id="invTot">Restoration total: <b>$${Object.keys(S.invest).reduce((a, k) => a + S.invest[k], 0)}M</b>. Connectivity: <b id="connV">${R(m.conn)}</b> of 100. Biodiversity: <b id="bioV">${R(m.bio)}</b>.</p>` + groupHTML(D.groupById.corridors);
  }
  function bodySpecies(m) {
    const cards = D.species.map(sp => `<button class="spc ${S.species === sp.id ? "sel" : ""}" data-act="species" data-id="${sp.id}"><span class="big">${sp.icon}</span><span><b>${esc(sp.name)}</b> <i>${esc(sp.sci)}</i><br>${esc(sp.blurb)}<span class="needs">${D.zones.map(z => `<span>${z.icon} ${R(sp.needs[z.id] * 100)}%</span>`).join("")}</span></span></button>`).join("");
    let niche = "";
    const sp = D.species.find(x => x.id === S.species);
    if (sp) {
      niche = `<h3 style="margin-top:14px">Prove you know the niche of the ${esc(sp.name)}</h3>` + sp.niche.map(n => {
        const key = sp.id + ":" + n.zone, ans = S.nicheAnswers[key], z = ZN[n.zone];
        return `<div class="quiz"><h4>${z.icon} ${esc(z.short)}</h4><p>${esc(n.q)}</p>` + n.opts.map((o, i) => `<button class="qopt ${ans != null ? (i === n.a ? "right" : i === ans ? "wrong" : "") : ""}" data-act="niche" data-q="${key}" data-i="${i}" ${ans != null ? "disabled" : ""}>${esc(o)}</button>`).join("") + (ans != null ? `<p class="why">${ans === n.a ? "Correct. " : "Not quite. "}${esc(n.why)}</p>` : "") + "</div>";
      }).join("") + (m.viability != null ? `<div class="meters" style="margin-top:8px">${meter("Species viability on your island", m.viability)}</div><p class="note">The percentages on each card show how much that species relies on each habitat. Viability uses your habitat quality and connectivity.</p>` : "");
    }
    return `<div class="spcards">${cards}</div>${niche}`;
  }
  function bodyEarth() {
    const gr = ["ec1", "ec2", "ec3", "ec4"].map(g => groupHTML(D.groupById[g])).join("");
    const q = D.pillarQuiz.map((p, i) => {
      const a = S.pillarAnswers[i];
      return `<div class="quiz"><p>${esc(p.text)}</p><div class="swatches">` + ["I", "II", "III", "IV"].map(r => `<button class="pillbtn ${a === r ? "on" : ""}" data-act="pillar" data-i="${i}" data-p="${r}" title="${esc(D.pillarNames[r])}">${r}</button>`).join("") + "</div>" + (a ? `<p class="why">${a === p.a ? "Correct. " : "Not quite, this one is pillar " + p.a + ". "}${esc(D.pillarNames[p.a])}.</p>` : "") + "</div>";
    }).join("");
    return gr + `<h3>Match each statement to its pillar</h3><p class="note">${["I", "II", "III", "IV"].map(r => `<b>${r}</b> ${esc(D.pillarNames[r])}`).join("<br>")}</p>` + q;
  }
  function bodyFootprint(m) { return groupHTML(D.groupById.footprint) + `<p class="note">Current footprint index: <b>${R(m.fpIdx)}</b> (lower is better). See the Footprint tab for the full breakdown. Effects marked * grow with guest numbers.</p>`; }
  function bodyMap() {
    const chips = D.facilities.map(f => `<button data-act="pickfac" data-f="${f.id}" class="${pick === f.id ? "on" : ""} ${S.place[f.id] ? "placed" : ""}">${f.icon} ${f.name}</button>`).join("");
    const rep = M.placementReport(S);
    const notes = D.facilities.filter(f => rep.items[f.id]).map(f => { const pl = D.plots.find(p => p.id === S.place[f.id]); return `<div class="rep"><b>${f.icon} ${f.name}</b> at ${esc(pl.name)}<br>` + rep.items[f.id].notes.map(n => `<span class="t ${n.tone}"></span>${esc(n.text)}<br>`).join("") + "</div>"; }).join("");
    return `<p class="note">${pick ? "Now tap a plot on the island for the <b>" + D.facilities.find(f => f.id === pick).name + "</b>. Green rings are good sites, yellow are mixed, red are risky. The bars beside each plot name show height above sea level." : "Pick a facility below, then tap a plot on the island map."}</p><div class="fpick">${chips}</div>
<p style="margin:10px 0"><button class="btn small" data-act="autoplace">Auto-place a good layout</button> <button class="btn small ghost" style="color:var(--navy)" data-act="clearplace">Clear</button></p>${notes || "<p><em>Nothing placed yet.</em></p>"}`;
  }
  function bodyMidpoint(m) {
    const vals = [["Biodiversity", m.bio], ["Water quality", m.wq], ["Community", m.comm], ["Health", m.health], ["Guest happiness", m.guest], ["Storm resilience", m.resil]];
    const weak = vals.slice().sort((a, b) => a[1] - b[1])[0], strong = vals.slice().sort((a, b) => b[1] - a[1])[0];
    return `<div class="meters">${vals.map(v => meter(v[0], v[1])).join("")}</div>${econBox(m)}<p class="note">Strongest so far: <b>${strong[0]}</b>. Weakest: <b>${weak[0]}</b>. The habitat work ahead will lift biodiversity and water quality, but community, health, and guests depend on the choices you have already made.</p>`;
  }
  function bodyTbl(m) {
    const fin = m, arr = [["Environmental responsibility", fin.env], ["Social well-being", fin.soc], ["Economic growth", fin.econ]], weak = arr.slice().sort((a, b) => a[1] - b[1])[0];
    return `<div style="display:grid;justify-items:center">${E.vennSVG(m.env, m.soc, m.econ, m.tbl)}</div>${econBox(m)}<p class="note">Your weakest circle is <b>${weak[0]}</b> at ${R(weak[1])}. Every point you add there lifts the overlap more than a point added to your strongest circle.</p>`;
  }
  function bodySim() {
    const sim = S.sim;
    if (!sim) return `<p>The next ten events are already on the calendar: a permit hearing, fuel shocks, storms, investors, bleaching, illness, and more. How your plan is built sets the odds. How you respond sets the outcome.</p><p><button class="btn gold" data-act="simStart">Cut the ribbon</button></p>`;
    const hist = lineChart(sim.history, [{ k: "bio", c: "#2f855a", l: "Biodiversity" }, { k: "comm", c: "#F4A825", l: "Community" }, { k: "guest", c: "#2b6cb0", l: "Guests" }, { k: "resil", c: "#D9483B", l: "Resilience" }]);
    const money = `<div class="money"><div>Year<b>${2030 + sim.year}</b>of 2040</div><div>Profit last year<b>${sim.lastProfit < 0 ? "−" : ""}$${R(Math.abs(sim.lastProfit || 0))}M</b></div><div>Cash position<b>${sim.cash < 0 ? "−" : ""}$${R(Math.abs(sim.cash))}M</b></div></div>`;
    if (sim.pending) {
      const p = sim.pending, ev = p.ev, lv = p.sev < 0.45 ? "mild" : p.sev < 0.9 ? "serious" : "severe";
      return `${money}<div class="evcard"><h3>${ev.icon} ${2030 + sim.year}: ${esc(ev.title)}</h3><p>${esc(ev.text)}</p>${p.why ? `<p class="note">${esc(p.why)} Expected impact: <b>${ev.sevKey === "flat" ? "depends on your choice" : lv}</b>.</p>` : ""}` + ev.choices.map((c, i) => `<button class="evchoice" data-act="simChoice" data-i="${i}">${esc(c.label)}</button>`).join("") + `</div>${hist}`;
    }
    const rec = sim.log[sim.log.length - 1];
    const chips = Object.keys(rec.deltas).filter(k => rec.deltas[k]).map(k => { const L = { cash: "Cash", bio: "Biodiversity", comm: "Community", guest: "Guests", resil: "Resilience", health: "Health", wq: "Water quality" }[k], v = rec.deltas[k]; return `<span class="${v > 0 ? "g" : "b"}">${L} ${v > 0 ? "+" : "−"}${Math.abs(k === "cash" ? Math.round(v * 10) / 10 : R(v))}${k === "cash" ? "M" : ""}</span>`; }).join("");
    return `${money}<div class="evcard"><h3>${esc(rec.title)}</h3><p><b>You chose:</b> ${esc(rec.choice)}</p><p>${esc(rec.msg)}</p><div class="dchips">${chips || "<span class='g'>No change</span>"}</div></div>${hist}<p><button class="btn gold" data-act="simNext">${sim.done ? "See the final report" : "On to " + (2031 + sim.year)}</button></p>`;
  }
  function bodyResults() {
    const sim = S.sim, fin = sim && sim.final; if (!fin) return "<p>Run the ten-year simulation first.</p>";
    const ach = M.ACHIEVEMENTS.map(a => `<div class="badge ${fin.achievements.indexOf(a.id) >= 0 ? "" : "off"}"><b>${a.icon} ${a.name}</b>${a.desc}</div>`).join("");
    const tl = sim.log.map(l => `<div><b>${2030 + l.year}: ${esc(l.title)}.</b> ${esc(l.choice)}</div>`).join("");
    const scales = D.objectives.map((o, i) => `<div class="scale"><span>${esc(o)}</span><span><input type="range" min="1" max="10" value="${S.objectives[i]}" data-range="objectives.${i}" aria-label="Confidence ${i + 1}" style="width:130px"> <output>${S.objectives[i]}</output></span></div>`).join("");
    const civ = D.civicQuestions.map((q, i) => `<div class="reflect"><p style="margin:0 0 6px;font-size:14px">${esc(q)}</p><textarea data-bind="civic.${i}">${esc((S.civic || {})[i] || "")}</textarea></div>`).join("");
    return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><div class="grade">${fin.grade}</div><div><b style="font-size:18px">${esc(S.resortName)}</b><br>Sustainability overlap ${R(fin.tbl)}. Score <b>${fin.score}</b>.<br>Environment ${R(fin.env)}, people ${R(fin.soc)}, profit ${R(fin.econ)}.</div></div>
<div style="display:grid;justify-items:center">${E.vennSVG(fin.env, fin.soc, fin.econ, fin.tbl)}</div>
<h3>Achievements</h3><div class="badges">${ach}</div><h3 style="margin-top:14px">Your ten years</h3><div class="timeline">${tl}</div>
${lineChart(sim.history, [{ k: "bio", c: "#2f855a", l: "Biodiversity" }, { k: "comm", c: "#F4A825", l: "Community" }, { k: "guest", c: "#2b6cb0", l: "Guests" }, { k: "resil", c: "#D9483B", l: "Resilience" }])}
<h3 style="margin-top:14px">Civic debrief</h3>${civ}<h3>How confident are you now?</h3><p class="note">Rate each outcome from 1 (cannot do at all) to 10 (highly certain I can).</p>${scales}
<h3 style="margin-top:14px">Take it with you</h3><p>${C.features.pitchExport ? `<button class="btn" data-act="exPitch">Download pitch webpage</button> ` : ""}<button class="btn" data-act="exShot">Save island picture</button> <button class="btn ghost" style="color:var(--navy)" data-act="exJson">Save game file</button> <button class="btn ghost" style="color:var(--navy)" data-act="exCsv">Download results CSV</button></p><p><button class="btn gold" data-act="replay">Play again with a new plan</button></p>`;
  }
  function bodyIntro() {
    if (S.tut && S.tut.on) {
      const steps = NP.tutorial.map(x => `<div class="quest">${S.tut.steps[x.id] ? '<span class="ck">✓</span>' : "○"} ${esc(x.text)}</div>`).join("");
      return `<div class="hero"><h2>Village tour</h2><p>You have stepped ashore at the landing. The island is on the left. Walk your director around, and press E near people or glowing markers. The tour shows you everything you will need.</p></div>${steps}
<p class="note">Gold rings on the map show your next target. A gold ! over a person means they have something to tell you.</p>
<p><button class="btn gold" data-act="start" ${S.tut.done ? "" : "disabled"}>Meet your advisors</button> <button class="linkbtn" data-act="start">Skip the rest of the tour</button></p>`;
    }
    return `<div class="hero"><h2>${esc(C.island.name)}, 2030</h2><p>Picture an island in ${esc(C.island.region)}. Once it was a shark nursery, ringed by mangroves and reef. Then a developer bulldozed it to build a resort, and left when the economy turned. Now it is scarred, and it is yours to rebuild.</p><p>Your consulting firm has been asked to pitch a sustainable ecoresort that restores what was lost. Make every decision like you have to live with it, because in ten years you will.</p></div>
<h3>Choose your difficulty</h3><div class="diffs">${Object.keys(C.difficulty).map(k => `<button class="${S.difficulty === k ? "on" : ""}" data-act="diff" data-k="${k}"><b>${C.difficulty[k].label}</b>, $${C.difficulty[k].budget}M budget<br><span style="font-size:13px;color:#475569">${C.difficulty[k].blurb}</span></button>`).join("")}</div>
<p class="note">Work in teams of three. One director leads each decision, the others challenge with evidence. There is no single right answer, only tradeoffs you can defend. What the people of the island tell you will shape what you are able to build.</p><p><button class="btn gold" data-act="tutStart">Step ashore</button> <button class="linkbtn" data-act="start">Skip the village tour</button></p>`;
  }

  // ---------- Panel shell ----------
  function consultHTML(ph) {
    if (!ph.consult) return "";
    const n = NP.N[ph.consult], tips = S.tips[ph.id] || [];
    if (S.talked[ph.id]) return `<div class="consult done">${A.svg(n.av, 56, { label: n.name })}<div><b>Local knowledge from ${esc(n.name)}</b>${tips.length ? "<ul>" + tips.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>" : "<div style='font-size:13.5px'>They had little to offer after that conversation.</div>"}</div></div>`;
    if (S.skipped[ph.id]) return `<div class="consult">${A.svg(n.av, 56, { label: n.name })}<div style="font-size:13.5px">You skipped the conversation with <b>${esc(n.name)}</b>. You can still walk over and talk any time.<div class="acts"><button class="btn small" data-act="way" data-n="${n.id}">Show me the way</button></div></div></div>`;
    return `<div class="consult">${A.svg(n.av, 56, { label: n.name })}<div><b>Before you decide, talk to ${esc(n.name)}</b> (${esc(n.role)}) at ${esc(n.spot)}.<div style="font-size:13.5px">Walk your director there with the arrow keys or WASD, or tap the island. Press E when you are close.</div><div class="acts"><button class="btn small" data-act="way" data-n="${n.id}">Show me the way</button><button class="linkbtn" data-act="skipConsult">Skip this conversation</button></div></div></div>`;
  }

  function render() {
    const idx = S.phase, ph = D.phases[idx], m = M.compute(S), adv = D.advisors[ph.advisor];
    if (S._heroPhase !== idx) { S._heroPhase = idx; const l0 = M.leadDirector(S, ph, idx) || M.rotatingDirector(S, idx); const hi = S.team.indexOf(l0); if (hi >= 0 && idx > 1) { S.hero = hi; renderBoard(); refreshScene(m); } }
    let body = "";
    switch (ph.type || ph.id) {
      case "intro": body = bodyIntro(); break;
      case "team": body = bodyTeam(); break;
      case "name": body = bodyName(); break;
      case "groups": body = (ph.id === "concept" ? bodyConcept(m) : ph.groups.map(g => groupHTML(D.groupById[g])).join("") + covHTML(m, ph.groups.filter(g => ["water", "food", "energy", "waste"].indexOf(g) >= 0)) + (ph.id === "footprint" ? "" : "")); if (ph.footprintChart) body = bodyFootprint(m); break;
      case "habitats": body = bodyHabitats(m); break;
      case "species": body = bodySpecies(m); break;
      case "earthcharter": body = bodyEarth(); break;
      case "map": body = bodyMap(); break;
      case "midpoint": body = bodyMidpoint(m); break;
      case "tbl": body = bodyTbl(m); break;
      case "sim": body = bodySim(); break;
      case "results": body = bodyResults(); break;
    }
    const lead = M.leadDirector(S, ph, idx), rot = M.rotatingDirector(S, idx);
    const leadHTML = ph.id === "intro" || ph.id === "team" ? "" : lead
      ? `<div class="lead">${A.svg(lead.av, 30, { label: lead.name })}<span><b>${esc(lead.name || "Director")}</b> leads this decision (${majorOf(lead.major).label}). Everyone else: challenge with evidence.</span></div>`
      : `<div class="lead">${A.svg(rot.av, 30, { label: rot.name })}<span><b>${esc(rot.name || "Director")}</b> leads this one. No one on the board is a specialist here, so research it together.</span></div>`;
    const ins = lead && ph.insight ? `<div class="insight">${A.svg(lead.av, 40, { label: lead.name })}<span><b>Insight from ${esc(lead.name || "your director")}:</b> ${esc(ph.insight)}</span></div>` : "";
    const talk = ph.brief ? `<div class="talk">${A.svg(adv.av, 72, { label: adv.name })}<div class="bubble"><div class="who">${esc(adv.name)} <span>${esc(adv.role)}</span></div>${ph.brief.map(l => `<p>${esc(l)}</p>`).join("")}</div></div>` : "";
    const sci = ph.science ? `<details class="field"><summary>Field note: the science</summary><p>${esc(ph.science)}</p></details>` : "";
    const introTalk = ph.id === "intro" ? "" : talk;
    let footer = "";
    if (ph.id !== "intro" && ph.id !== "sim" && ph.id !== "results") {
      const issues = M.validatePhase(S, idx);
      footer = `<div class="foot">${issues.length ? `<ul class="issues" id="issues">${issues.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : `<ul class="issues" id="issues"></ul>`}<button class="btn ghost" style="color:var(--navy)" data-act="back" ${idx <= 1 ? "disabled" : ""}>Back</button><button class="btn gold" id="btnNext" data-act="next" ${issues.length ? "disabled" : ""}>Confirm and continue</button></div>`;
    } else if (ph.id === "sim") {
      footer = `<div class="foot"><button class="btn ghost" style="color:var(--navy)" data-act="back">Back</button>${S.sim ? `<button class="btn ghost" style="color:var(--navy)" data-act="simRestart">Restart the ten years</button>` : ""}</div>`;
    }
    $("#panel").innerHTML = `<div class="ph-head"><span class="ic">${ph.icon}</span><div><h2>${esc(ph.title)}</h2><div class="sub">Step ${idx + 1} of ${D.phases.length}</div></div></div>${leadHTML}${introTalk}${ins}${consultHTML(ph)}${body}${ph.id === "sim" || ph.id === "results" ? "" : sci + quizHTML(ph) + reflectHTML(ph)}${footer}`;
    renderQuest();
  }

  function updateLive() {
    const m = M.compute(S);
    D.zones.forEach(z => { const t = $("#zq-" + z.id); if (t) { t.textContent = R(m.zq[z.id]); $("#zb-" + z.id).style.width = m.zq[z.id] + "%"; $("#io-" + z.id).textContent = "$" + S.invest[z.id] + "M"; } });
    const tot = $("#invTot"); if (tot) { tot.innerHTML = `Restoration total: <b>$${Object.keys(S.invest).reduce((a, k) => a + S.invest[k], 0)}M</b>. Connectivity: <b id="connV">${R(m.conn)}</b> of 100. Biodiversity: <b id="bioV">${R(m.bio)}</b>.`; }
    const vo = $("#visOut"); if (vo) { vo.textContent = S.visitors + ",000"; const w = $("#econWrap"); if (w) w.innerHTML = econBox(m); const cn = $("#crowdNote"); if (cn) cn.hidden = S.visitors <= 50; }
    const ob = document.querySelectorAll("[data-range^='objectives']"); ob.forEach(i => { i.nextElementSibling.textContent = i.value; });
    const idx = S.phase, issues = M.validatePhase(S, idx), ul = $("#issues"), nb = $("#btnNext");
    if (ul) ul.innerHTML = issues.map(i => `<li>${esc(i)}</li>`).join(""); if (nb) nb.disabled = issues.length > 0;
  }

  // ---------- Flow ----------
  function advance() {
    const idx = S.phase, ph = D.phases[idx];
    if (M.validatePhase(S, idx).length) return;
    S.done[ph.id] = true; award("done:" + ph.id, 5);
    if ((S.reflect[ph.id] || "").trim().length >= 25) award("ref:" + ph.id, 5);
    S.phase = Math.min(D.phases.length - 1, idx + 1); pick = null;
    changed(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
    const g = D.facilities.find(f => f.groups.some(x => (D.phases[idx].groups || []).indexOf(x) >= 0));
    if (g) toast(g.icon + " " + g.name + " is under construction");
  }
  function go(i) { if (i > maxIdx() || i === S.phase) return; S.phase = i; pick = null; changed(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const NAMES1 = ["Pelican", "Osprey", "Mangrove", "Conch", "Tern", "Coral", "Lagoon", "Heron", "Seagrape", "Sapphire"], NAMES2 = ["Landing", "Haven", "Reborn", "Reserve", "Rest", "Sanctuary", "Cay", "Point"];
  const TAGS = ["Come for the reef. Stay because it is coming back.", "A resort that gives the island back more than it takes.", "Where every guest helps restore the shoreline.", "Rest here. The island is working while you do.", "Built on the scars of the past, run for the next century."];
  const rp = a => a[Math.floor(Math.random() * a.length)];

  function onClick(e) {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    switch (act) {
      case "goto": go(+b.dataset.i); break;
      case "diff": S.difficulty = b.dataset.k; full(); break;
      case "start": S.done.intro = true; S.phase = 1; changed(); render(); window.scrollTo(0, 0); break;
      case "next": advance(); break;
      case "back": if (S.phase > 1) { S.phase--; pick = null; changed(); render(); window.scrollTo(0, 0); } break;
      case "toggle": {
        const g = D.groupById[b.dataset.g], id = b.dataset.o, sel = S.sel[g.id], i = sel.indexOf(id), o = M.opt(g.id, id), lk = M.lock(S, o);
        if (lk.locked) { toast("🔒 " + lk.why); return; }
        if (g.max === 1) S.sel[g.id] = [id];
        else if (i >= 0) sel.splice(i, 1);
        else if (M.selected(S, g.id).length >= g.max) { toast("You can pick up to " + g.max + " here. Remove one first."); return; }
        else sel.push(id);
        if (o.violates && i < 0) toast("The brief forbids this one.");
        full(); break;
      }
      case "quiz": { const ph = D.phases[S.phase]; S.quiz[ph.id] = +b.dataset.i; if (+b.dataset.i === ph.quiz.a) award("quiz:" + ph.id, 10); full(); break; }
      case "niche": { const [sp, z] = b.dataset.q.split(":"), n = D.species.find(x => x.id === sp).niche.find(x => x.zone === z); S.nicheAnswers[b.dataset.q] = +b.dataset.i; if (+b.dataset.i === n.a) award("niche:" + b.dataset.q, 5); full(); break; }
      case "pillar": { S.pillarAnswers[b.dataset.i] = b.dataset.p; if (D.pillarQuiz[+b.dataset.i].a === b.dataset.p) award("pil:" + b.dataset.i, 5); full(); break; }
      case "species": S.species = b.dataset.id; full(); break;
      case "av": { const t = S.team[+b.dataset.m], k = b.dataset.k; t.av[k] = ["skin", "hairColor", "outfit"].indexOf(k) >= 0 ? +b.dataset.v : b.dataset.v; full(); break; }
      case "avrand": S.team[+b.dataset.m].av = A.random(); full(); break;
      case "pal": S.palette = +b.dataset.i; full(); break;
      case "suggestName": S.resortName = rp(NAMES1) + " " + rp(NAMES2); full(); break;
      case "suggestTag": S.tagline = rp(TAGS); full(); break;
      case "pickfac": pick = pick === b.dataset.f ? null : b.dataset.f; full(); break;
      case "autoplace": S.place = M.autoPlace(S); pick = null; full(); break;
      case "clearplace": S.place = {}; pick = null; full(); break;
      case "simStart": Sim.start(S); Sim.nextYear(S); full(); break;
      case "simChoice": { const rec = Sim.resolve(S, +b.dataset.i), ev = D.events.find(x => x.id === rec.event); if (ev.fx) Scene.fx(ev.fx, 7); if (S.sim.done) award("sim", 20); full(); break; }
      case "simNext": if (S.sim.done) advance(); else { Sim.nextYear(S); full(); } break;
      case "simRestart": S.sim = null; full(); break;
      case "exPitch": {
        const m = M.compute(S), shot = Scene.snapshot(); E.download(E.slug(S) + "-pitch.html", E.pitchHTML(S, m, shot), "text/html"); break;
      }
      case "exShot": { const u = Scene.snapshot(); if (u) { const a = document.createElement("a"); a.href = u; a.download = E.slug(S) + "-island.png"; a.click(); } break; }
      case "exJson": E.download(E.slug(S) + "-save.json", JSON.stringify(S), "application/json"); break;
      case "exCsv": E.download(E.slug(S) + "-results.csv", E.csv(S, M.compute(S)), "text/csv"); break;
      case "replay": openModal(`<h2>Start a new plan?</h2><p>Your finished game stays in your downloads if you saved it. This clears the current game.</p><div class="btns"><button class="btn ghost" style="color:var(--navy)" data-act="closeModal">Keep this game</button><button class="btn gold" data-act="newgame">Start fresh</button></div>`); break;
      case "newgame": M.clearSave(); init(M.newState(S.difficulty)); closeModal(); break;
      case "closeModal": closeModal(); break;
      case "tutStart": S.tut = { on: true, done: false, steps: {} }; S.hero = 0; Scene.resetWalk(); changed(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); narrate("Pelican Cay, 2030", "The boat idles at the northeast landing and then pulls away. Ahead of you: a bulldozed island, a rusting shell of a resort, and a village that has been waiting a long time to see whether you will listen. Walk up to the village square and find Iris."); break;
      case "dlg": dlgChoose(+b.dataset.i); break;
      case "dlgclose": closeDlg(); break;
      case "hero": S.hero = +b.dataset.i; changed(); break;
      case "way": { const n = NP.N[b.dataset.n]; Scene.moveTo(n.at.x, n.at.y + 10, n.id); const sw = document.querySelector(".scene-wrap"); if (sw && sw.scrollIntoView) sw.scrollIntoView({ behavior: "smooth", block: "nearest" }); break; }
      case "skipConsult": S.skipped[D.phases[S.phase].id] = true; full(); break;
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.bind) { setPath(t.dataset.bind, t.value); M.save(S); if (t.dataset.bind.indexOf("team.") === 0 || t.dataset.bind === "resortName") { renderBoard(); renderChips(); refreshScene(); } updateLive(); }
    else if (t.dataset.range) {
      setPath(t.dataset.range, +t.value); updateLive(); M.save(S);
      if (t.dataset.range !== "objectives" && t.dataset.range.indexOf("objectives") !== 0) { const m = renderDash(); refreshScene(m); }
    }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.sel) { setPath(t.dataset.sel, t.value); full(); }
    else if (t.dataset.range && t.dataset.range.indexOf("objectives") !== 0) full();
  }

  // ---------- Dialogue ----------
  function nextConvo(id, m) {
    const n = NP.N[id], cur = D.phases[S.phase], tp = n.topics || {};
    if (tutOn()) {
      if (id === "iris" && !S.talked.w_iris) return { kind: "tut", id: "w_iris", node: tp.w_iris };
      if (id === "jo" && S.talked.w_iris && !S.talked.w_jo) return { kind: "tut", id: "w_jo", node: tp.w_jo };
    }
    if (cur.consult === id && !S.talked[cur.id] && tp[cur.id]) return { kind: "topic", id: cur.id, node: tp[cur.id] };
    const qt = questTalkFor(id); if (qt) return { kind: "qstep", id: "q:" + qt.q.id, quest: qt.q, node: qt.s.node };
    const qo = questOfferFor(id); if (qo) return { kind: "qoffer", id: "q:" + qo.id, quest: qo, node: qo.offer };
    if (id === "tomas" && S.debris.length >= NP.debris.length && !S.debrisPaid) return { kind: "debris", id: "debris", node: n.debris };
    const rc = reactionFor(id, m); if (rc) return { kind: "react", id: rc.id, node: rc.node };
    const cu = S.phase, list = Object.keys(tp).filter(k => phIdx(k) >= 0 && !S.talked[k]).map(k => ({ id: k, i: phIdx(k) }));
    list.sort((a, b) => (a.i >= cu ? a.i - cu : 100 + cu - a.i) - (b.i >= cu ? b.i - cu : 100 + cu - b.i));
    return list.length ? { kind: "topic", id: list[0].id, node: tp[list[0].id] } : null;
  }
  function typeText(el, text, done) {
    clearInterval(typer); let i = 0; el.textContent = "";
    typer = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typer); if (done) done(); } }, 16);
    el.onclick = () => { clearInterval(typer); el.textContent = text; if (done) done(); };
  }
  function drawDlg(o) {
    const box = $("#dlg"); box.hidden = false;
    box.innerHTML = `<button class="dlgx" data-act="dlgclose" aria-label="Close conversation" title="Close (Esc)">✕</button>${A.svg(o.av, 72, { label: o.name })}<div><div class="who">${esc(o.name)}<small>${esc(o.role)}</small></div><div class="gain">${(o.gain || []).join("")}</div><div class="txt" id="dtxt"></div><div class="ch" id="dch"></div></div>`;
    const showCh = () => { $("#dch").innerHTML = o.choices.map((c, i) => `<button data-act="dlg" data-i="${i}"><kbd>${i + 1}</kbd>${esc(c.t)}</button>`).join(""); };
    $("#dch").innerHTML = ""; typeText($("#dtxt"), o.text, showCh); dlg.choices = o.choices;
  }
  function openDialogue(near) {
    if (!near || dlg) return; $("#prompt").hidden = true; Scene.setPaused(true);
    if (near.kind === "spot") {
      const sp = NP.spots.find(x => x.id === near.id), hr = S.team[S.hero] || S.team[0], first = !S.found[sp.id], gain = [];
      S.found[sp.id] = true; if (first) { award("spot:" + sp.id, 2); gain.push("<span>+2 knowledge points</span>"); }
      if (NP.spots.every(x => S.found[x.id])) award("survey", 15);
      if (tutOn() && sp.id === "board") { S.tut.steps.board = true; tutCheck(); }
      const before = JSON.stringify(S.quests); questInspect(sp.id); if (JSON.stringify(S.quests) !== before) gain.push("<span>Quest progress</span>");
      dlg = { kind: "spot", spot: sp };
      drawDlg({ av: hr.av, name: sp.icon + " " + sp.label, role: "Field note", text: sp.text(M.compute(S), S), gain, choices: [{ t: "Close", act: "close" }] });
      changed(); if (M.phaseId(S) === "intro") render(); return;
    }
    const n = NP.N[near.id], m = M.compute(S), cv = nextConvo(near.id, m);
    dlg = { kind: "npc", npc: n, convo: cv, used: {} };
    if (cv) drawDlg({ av: n.av, name: n.name, role: n.role, text: cv.node.say, choices: cv.node.opts.map((op, i) => ({ t: op.t, act: "ask", i })).concat(cv.kind === "qoffer" || cv.kind === "tut" ? [] : [{ t: "Maybe later.", act: "close" }]) });
    else {
      const b = NP.barks[n.id] ? NP.barks[n.id](m) : null, lines = NP.chat[n.id];
      drawDlg({ av: n.av, name: n.name, role: n.role, text: b || lines[Math.floor(Math.random() * lines.length)], choices: [{ t: "Goodbye.", act: "close" }] });
    }
  }
  function dlgChoose(i) {
    if (!dlg || !dlg.choices || !dlg.choices[i]) return; const c = dlg.choices[i];
    if (c.act === "close") return closeDlg();
    if (c.act !== "ask") return;
    const cv = dlg.convo, op = cv.node.opts[c.i], n = dlg.npc, gain = [], single = ["qoffer", "qstep", "react"].indexOf(cv.kind) >= 0;
    if (!dlg.used[c.i]) {
      dlg.used[c.i] = true;
      if (op.trust) { S.trust[n.id] = (S.trust[n.id] || 0) + op.trust; gain.push(`<span class="${op.trust < 0 ? "b" : ""}">Trust with ${esc(n.name.split(" ").slice(-1)[0])} ${op.trust > 0 ? "+" : "−"}${Math.abs(op.trust)}</span>`); }
      if (op.tip) { if (cv.kind === "topic") { S.tips[cv.id] = S.tips[cv.id] || []; if (S.tips[cv.id].indexOf(op.tip) < 0) { S.tips[cv.id].push(op.tip); gain.push("<span>New local knowledge</span>"); } } else gain.push("<span>New local knowledge</span>"); }
    }
    if (cv.kind === "topic") { S.talked[cv.id] = true; award("talk:" + cv.id, 3); }
    else if (cv.kind === "tut") { S.talked[cv.id] = true; S.tut.steps[cv.id === "w_iris" ? "iris" : "jo"] = true; tutCheck(); }
    else if (cv.kind === "debris") { if (!S.debrisPaid) { S.debrisPaid = true; award("debris", 10); gain.push("<span>+10 knowledge points</span>"); } }
    else if (cv.kind === "react") { S.reacted[cv.id] = true; }
    else if (cv.kind === "qoffer") { if (op.accept) { S.quests[cv.quest.id] = { st: "active", step: 0 }; gain.push(`<span>New quest: ${esc(cv.quest.title)}</span>`); toast("📜 New quest: " + cv.quest.title); } }
    else if (cv.kind === "qstep") {
      const lab = D.effMeta;
      for (const k in (op.bonus || {})) { S.bonus[k] = (S.bonus[k] || 0) + op.bonus[k]; if (op.bonus[k]) gain.push(`<span class="${op.bonus[k] < 0 ? "b" : ""}">${esc(lab[k].label)} ${op.bonus[k] > 0 ? "+" : "−"}${Math.abs(op.bonus[k])}</span>`); }
      const q = cv.quest; advanceQuest(q); if (S.quests[q.id].st === "done") gain.push(`<span>Quest complete. ${esc(q.teaser)}.</span>`);
    }
    const left = single ? [] : cv.node.opts.map((x, j) => ({ t: x.t, act: "ask", i: j })).filter(x => !dlg.used[x.i]);
    dlg.choices = null;
    drawDlg({ av: n.av, name: n.name, role: n.role, text: op.say, gain, choices: left.concat([{ t: left.length ? "That is all for now." : "Thank you.", act: "close" }]) });
    changed(); if (M.phaseId(S) === "intro") render();
  }
  function narrate(title, text) {
    if (dlg) return; const hr = S.team[S.hero] || S.team[0]; Scene.setPaused(true); $("#prompt").hidden = true;
    dlg = { kind: "narr" }; drawDlg({ av: hr.av, name: title, role: "Arrival", text, choices: [{ t: "Step ashore", act: "close" }] });
  }
  function closeDlg() { clearInterval(typer); dlg = null; $("#dlg").hidden = true; $("#dlg").innerHTML = ""; Scene.setPaused(false); full(); Scene.renear(); }

  function menu() {
    openModal(`<h2>Menu</h2><p>Your game saves automatically in this browser.</p><div class="btns" style="justify-content:flex-start">
<button class="btn" data-act="exJson">Save game file</button><label class="btn ghost" style="color:var(--navy);cursor:pointer">Load game file<input type="file" id="loadFile" accept=".json" hidden></label>
<button class="btn ghost" style="color:var(--navy)" onclick="window.print()">Print</button>${C.features.teacherPanel ? `<button class="btn ghost" style="color:var(--navy)" data-act="teacher">Instructor panel</button>` : ""}
<button class="btn ghost" style="color:var(--coral)" data-act="replay">New game</button></div><div class="btns"><button class="btn gold" data-act="closeModal">Close</button></div>`);
    const lf = $("#loadFile"); if (lf) lf.onchange = () => { const f = lf.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { init(hydrate(JSON.parse(r.result))); closeModal(); toast("Game loaded"); } catch (x) { toast("That file could not be read."); } }; r.readAsText(f); };
  }
  function teacher() {
    const m = M.compute(S);
    openModal(`<h2>Instructor panel</h2><p>Download this team's decisions, scores, reflections, and confidence ratings for grading. Edit budgets, island name, and difficulty in <code>js/config.js</code>. Edit any wording or numbers in <code>js/data.js</code>.</p>
<p><b>${esc(S.resortName || "Unnamed resort")}</b>, ${esc(S.difficulty)} mode, ${S.kp} knowledge points, phase ${S.phase + 1} of ${D.phases.length}.<br>Board expertise coverage: ${R(M.teamCoverage(S) * 100)}%. Sustainability overlap: ${R(S.sim && S.sim.final ? S.sim.final.tbl : m.tbl)}.</p>
<div class="btns" style="justify-content:flex-start"><button class="btn" data-act="exCsv">Results CSV</button><button class="btn" data-act="exJson">Full game file</button>${C.features.pitchExport ? `<button class="btn" data-act="exPitch">Pitch webpage</button>` : ""}</div><div class="btns"><button class="btn gold" data-act="closeModal">Close</button></div>`);
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-act='teacher']")) teacher(); });

  function hydrate(saved) { const base = M.newState(saved.difficulty || "standard"); const s = Object.assign(base, saved); D.groups.forEach(g => { if (!s.sel[g.id]) s.sel[g.id] = []; }); s.invest = Object.assign(base.invest, saved.invest || {}); s.awarded = s.awarded || {}; return s; }

  function init(state) {
    S = state; prevM = null; pick = null; if (!S.awarded) S.awarded = {};
    changed(); render();
  }

  function boot(saved) {
    $("#gameTitle").textContent = C.gameTitle; $("#gameSub").textContent = C.subtitle;
    Scene.init($("#scene"));
    Scene.onPlotClick(pid => {
      if (M.phaseId(S) !== "map") return;
      const occ = Object.keys(S.place).find(f => S.place[f] === pid);
      if (!pick) { if (occ) { pick = occ; full(); } else toast("Pick a facility first."); return; }
      if (occ && occ !== pick) delete S.place[occ];
      S.place[pick] = pid; const fid = pick; pick = null; award("place:" + fid, 3); full();
    });
    $("#panel").addEventListener("click", onClick); $("#quest").addEventListener("click", onClick); $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); else onClick(e); });
    $("#panel").addEventListener("input", onInput); $("#panel").addEventListener("change", onChange);
    $("#btnMenu").onclick = menu;
    $("#board").addEventListener("click", onClick); $("#dlg").addEventListener("click", onClick);
    Scene.onNear(o => { const p = $("#prompt"); if (!o || dlg) { p.hidden = true; return; } p.hidden = false; p.innerHTML = `<kbd>E</kbd>${o.kind === "npc" ? "Talk to " : "Inspect "}${esc(o.label)}`; });
    $("#prompt").onclick = () => Scene.interact();
    Scene.onInteract(openDialogue);
    Scene.onWalk(() => { if (tutOn() && !S.tut.steps.move) { S.tut.steps.move = true; tutTick(); } });
    Scene.onCollect(id => { if (S.debris.indexOf(id) >= 0) return; S.debris.push(id); toast("🧹 Collected " + S.debris.length + " of " + NP.debris.length); if (tutOn() && !S.tut.steps.debris) { S.tut.steps.debris = true; tutCheck(); tutTick(); } if (S.debris.length >= NP.debris.length) toast("Shoreline clear! Tell Old Tomas."); changed(); });
    document.querySelectorAll("#dpad button").forEach(b => { const d = b.dataset.d; b.addEventListener("pointerdown", e => { e.preventDefault(); Scene.vkey(d, true); }); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, () => Scene.vkey(d, false))); });
    $("#tabbar").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { tab = b.dataset.tab; renderDash(); } });
    $("#btnNight").onclick = e => { nightOn = !nightOn; e.currentTarget.setAttribute("aria-pressed", nightOn); refreshScene(); };
    $("#btnShot").onclick = () => { const u = Scene.snapshot(); if (u) { const a = document.createElement("a"); a.href = u; a.download = "island.png"; a.click(); } };
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { closeModal(); if (dlg) closeDlg(); }
      else if (dlg && dlg.choices && /^[1-9]$/.test(e.key)) dlgChoose(+e.key - 1);
    });
    init(saved ? hydrate(saved) : M.newState("standard"));
  }

  window.UI = { boot, _dbg: { get S() { return S; }, render, full, onClick, advance, init, hydrate, openDialogue, dlgChoose, closeDlg, get dlg() { return dlg; } } };
})();
