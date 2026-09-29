/* Island Reborn: the living island. A canvas diorama that reflects every decision the team makes. */
(function () {
  const D = window.DATA, G = window.Model.Geo, F = window.SceneFac;
  const W = G.W, H = G.H, PI2 = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry(20300);
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  function mix(a, b, f) { f = clamp(f, 0, 1); const x = hex(a), y = hex(b); return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * f) + "," + Math.round(x[1] + (y[1] - x[1]) * f) + "," + Math.round(x[2] + (y[2] - x[2]) * f) + ")"; }

  // ---------- Static geometry ----------
  function mk(s) { const p = new Path2D(); for (let i = 0; i <= 140; i++) { const pt = G.P(i / 140 * PI2, s); i ? p.lineTo(pt.x, pt.y) : p.moveTo(pt.x, pt.y); } p.closePath(); return p; }
  let P_ISLAND, P_LAND, P_H1, P_H2;
  const pond = G.P(15 * Math.PI / 180, 0.35);
  const plots = D.plots;
  const plotById = {}; plots.forEach(p => { plotById[p.id] = p; });
  const trees = [], reeds = [], mangroves = [], reefs = [], fish = [], scars = [], birds = [];

  function buildStatic() {
    P_ISLAND = mk(1); P_LAND = mk(0.94); P_H1 = mk(0.66); P_H2 = mk(0.36);
    for (let i = 0; i < 300; i++) {
      const a = rnd() * PI2, s = Math.sqrt(rnd()) * 0.88, pt = G.P(a, s);
      if (plots.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 34)) continue;
      if (Math.pow((pt.x - pond.x) / 56, 2) + Math.pow((pt.y - pond.y) / 34, 2) < 1) continue;
      trees.push({ x: pt.x, y: pt.y, thr: rnd(), palm: rnd() < 0.45, sz: 7 + rnd() * 6, ph: rnd() * 6 });
    }
    trees.sort((a, b) => a.y - b.y);
    for (let i = 0; i < 34; i++) { const a = rnd() * PI2, r = 0.55 + rnd() * 0.5; reeds.push({ x: pond.x + Math.cos(a) * 50 * r, y: pond.y + Math.sin(a) * 30 * r, thr: rnd(), ph: rnd() * 6 }); }
    for (let i = 0; i < 50; i++) { const a = -1.3 + rnd() * 1.25, s = 0.93 + rnd() * 0.12, pt = G.P(a, s); mangroves.push({ x: pt.x, y: pt.y, thr: rnd(), sz: 6 + rnd() * 5 }); }
    for (let i = 0; i < 30; i++) {
      const a = 0.05 + rnd() * 3.7; let s = 1.28 + rnd() * 0.22, pt = G.P(a, s);
      while ((pt.y > H - 24 || pt.x < 24 || pt.x > W - 24 || pt.y < 24) && s > 1.1) { s -= 0.03; pt = G.P(a, s); }
      const blobs = []; const n = 3 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) blobs.push({ dx: (rnd() - 0.5) * 30, dy: (rnd() - 0.5) * 16, r: 5 + rnd() * 6, c: Math.floor(rnd() * 5), thr: rnd() });
      reefs.push({ x: pt.x, y: pt.y, blobs });
      if (i % 2 === 0) for (let j = 0; j < 2; j++) fish.push({ cx: pt.x, cy: pt.y, ph: rnd() * 6, sp: 0.6 + rnd() * 0.8, r: 14 + rnd() * 16, thr: rnd(), col: ["#fbbf24", "#60a5fa", "#f472b6", "#a3e635"][Math.floor(rnd() * 4)] });
    }
    for (let i = 0; i < 9; i++) { const a = rnd() * PI2, s = 0.2 + rnd() * 0.6, pt = G.P(a, s); scars.push({ x: pt.x, y: pt.y, rx: 22 + rnd() * 30, ry: 10 + rnd() * 16, rot: rnd() * 3, thr: rnd() }); }
    for (let i = 0; i < 8; i++) birds.push({ ph: rnd() * 6, r: 60 + rnd() * 240, sp: 0.15 + rnd() * 0.25, y: rnd() * 60 });
  }

  // ---------- State ----------
  let cv, ctx, model = null, dpr = 1, scaleX = 1, t0 = 0, raf = 0, clickCb = null, hoverPlot = null;
  const built = {}, sigs = {}, fxs = {}; let night = 0;
  let people = [], peopleSig = "";
  const slow = (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ? 0.25 : 1;

  function init(canvas) {
    cv = canvas; ctx = cv.getContext("2d"); buildStatic(); t0 = performance.now();
    const resize = () => { dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || W; cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); scaleX = cv.width / W; };
    resize(); if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else window.addEventListener("resize", resize);
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    const near = e => { const q = pos(e); let best = null, bd = 30; plots.forEach(p => { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = p; } }); return best; };
    cv.addEventListener("mousemove", e => {
      if (!model) return; const q = pos(e);
      if (model.mapMode) { const p = near(e); hoverPlot = p ? p.id : null; cv.style.cursor = p ? "pointer" : "default"; return; }
      const n = (model.npcs || []).find(n2 => Math.hypot(n2.x - q.x, n2.y - q.y) < 22); hoverNpc = n ? n.id : null; cv.style.cursor = n ? "pointer" : "crosshair";
    });
    cv.addEventListener("mouseleave", () => { hoverPlot = null; hoverNpc = null; });
    cv.addEventListener("click", e => {
      if (!model) return;
      if (model.mapMode) { if (clickCb) { const p = near(e); if (p) clickCb(p.id); } return; }
      if (ws.paused) return; const q = pos(e);
      const n = (model.npcs || []).find(n2 => Math.hypot(n2.x - q.x, n2.y - q.y) < 24);
      if (n) { goTo(n.x, n.y + 10, n.id); return; }
      if (walkable(q.x, q.y)) goTo(q.x, q.y, null);
    });
    bindKeys();
    raf = requestAnimationFrame(frame);
  }
  function setModel(m) {
    model = m;
    D.facilities.forEach(f => {
      const sel = m.sel || {}, sig = f.groups.map(g => (sel[g] || []).join(",")).join("|") + "@" + (m.place[f.id] || "");
      if (sigs[f.id] !== sig) { sigs[f.id] = sig; built[f.id] = performance.now(); }
    });
  }
  function fx(name, secs) { fxs[name] = { start: performance.now(), dur: (secs || 6) * 1000 }; }
  function fxVal(name) { const f = fxs[name]; if (!f) return 0; const e = performance.now() - f.start; if (e > f.dur) return 0; return Math.min(1, e / 700) * Math.min(1, (f.dur - e) / 1500); }
  function setNight(v) { night = v ? 1 : 0; }
  function onPlotClick(cb) { clickCb = cb; }
  function snapshot() { try { return cv.toDataURL("image/png"); } catch (e) { return ""; } }

  // ---------- Helpers ----------
  const placed = () => D.facilities.filter(f => model.place[f.id] && f.groups.some(g => (model.sel[g] || []).length));
  function dirOf(p) { const dx = p.x - G.CX, dy = p.y - G.CY, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  function ensurePeople(list) {
    const n = model.sel.lodging && model.sel.lodging.length ? clamp(Math.round(model.visitors / 3.5), 4, 30) : 0;
    const sig = n + ":" + list.map(f => model.place[f.id]).join(",");
    if (sig === peopleSig) return; peopleSig = sig;
    const pts = list.map(f => plotById[model.place[f.id]]); if (!pts.length) { people = []; return; }
    const A = window.Avatars; people = [];
    for (let i = 0; i < n + 3; i++) {
      const dir = i >= n, m = dir ? model.team[i - n] : null, p = pts[Math.floor(rnd() * pts.length)];
      people.push({ x: p.x + (rnd() - 0.5) * 20, y: p.y + 14 + (rnd() - 0.5) * 10, tx: p.x, ty: p.y + 14, sp: 6 + rnd() * 6, dir, ph: rnd() * 6,
        shirt: dir && m ? A.OUTFIT[m.av.outfit % 8] : ["#fb923c", "#38bdf8", "#f472b6", "#a3e635", "#fde047", "#c084fc", "#f87171"][Math.floor(rnd() * 7)],
        skin: dir && m ? A.SKIN[m.av.skin % 6] : A.SKIN[Math.floor(rnd() * 6)], hair: dir && m ? A.HAIR[m.av.hairColor % 8] : A.HAIR[Math.floor(rnd() * 5)] });
    }
    people.pts = pts;
  }

  // ---------- Drawing ----------
  function drawSea(t, q) {
    const g = ctx.createRadialGradient(G.CX, G.CY, 60, G.CX, G.CY, 560);
    g.addColorStop(0, mix("#7a9a6a", "#37c6c8", q.wq / 100)); g.addColorStop(0.45, mix("#4d7c74", "#1c93b0", q.wq / 100)); g.addColorStop(1, "#0a3358");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const amp = 2 + fxVal("storm") * 7;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) {
      const y0 = i * 24 + 6; ctx.strokeStyle = "rgba(255,255,255," + (0.07 + (i % 3) * 0.02) + ")"; ctx.beginPath();
      for (let x = 0; x <= W; x += 24) { const y = y0 + Math.sin(x * 0.02 + t * 1.2 + i) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    [[74, 0.10], [46, 0.14], [22, 0.18]].forEach(a => { ctx.strokeStyle = "rgba(190,250,240," + a[1] + ")"; ctx.lineWidth = a[0]; ctx.stroke(P_ISLAND); });
    if (q.wq < 40) { ctx.strokeStyle = "rgba(120,90,50," + (0.28 * (1 - q.wq / 40)) + ")"; ctx.lineWidth = 30; ctx.stroke(P_ISLAND); }
  }

  function drawReef(t, q) {
    const rq = q.zq.reef / 100, bl = fxVal("bleach");
    reefs.forEach(r => {
      r.blobs.forEach(b => {
        if (b.thr > 0.35 + rq * 0.65) return;
        let col = rq < 0.35 ? mix("#7d7a6c", "#efe9dc", rq / 0.35) : mix("#efe9dc", ["#f2675d", "#f6a04d", "#e05a9b", "#8e6fd8", "#f2d04a"][b.c], (rq - 0.35) / 0.65);
        if (bl) col = mix("#efe9dc", "#efe9dc", 1) && col.replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b2, c) => "rgb(" + Math.round(+a + (239 - a) * bl * 0.8) + "," + Math.round(+b2 + (233 - b2) * bl * 0.8) + "," + Math.round(+c + (220 - c) * bl * 0.8) + ")");
        ctx.fillStyle = "rgba(0,40,60,.25)"; ctx.beginPath(); ctx.ellipse(r.x + b.dx + 2, r.y + b.dy + 3, b.r, b.r * 0.6, 0, 0, PI2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(r.x + b.dx, r.y + b.dy, b.r, b.r * 0.7, 0, 0, PI2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.ellipse(r.x + b.dx - 1, r.y + b.dy - 2, b.r * 0.5, b.r * 0.3, 0, 0, PI2); ctx.fill();
      });
    });
    if (model.zq.reef > 50 || (model.invest && model.invest.reef >= 8)) {
      for (let i = 0; i < 24; i++) { const a = 0.1 + i * 0.15, pt = G.P(a, 1.62); if (pt.y > H - 6 || pt.y < 6) continue; ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(pt.x, pt.y + Math.sin(t * 2 + i) * 1.2, 2.2, 0, PI2); ctx.fill(); }
    }
    fish.forEach(f => {
      if (f.thr > rq) return; const a = t * f.sp + f.ph, x = f.cx + Math.cos(a) * f.r, y = f.cy + Math.sin(a * 1.3) * f.r * 0.5, d = Math.cos(a) > 0 ? -1 : 1;
      ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 1.6, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + d * 3, y); ctx.lineTo(x + d * 6, y - 2); ctx.lineTo(x + d * 6, y + 2); ctx.fill();
    });
  }

  function drawLand(t, q) {
    ctx.fillStyle = "#ead9a9"; ctx.fill(P_ISLAND);
    const lq = clamp((q.zq.inland * 0.6 + q.zq.watershed * 0.4) / 100, 0, 1);
    const gr = ctx.createRadialGradient(G.CX, G.CY - 20, 20, G.CX, G.CY, 330);
    gr.addColorStop(0, mix("#b39a6b", "#5aa64f", lq)); gr.addColorStop(1, mix("#96805a", "#3e8a45", lq));
    ctx.fillStyle = gr; ctx.fill(P_LAND);
    ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill(P_H1); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill(P_H2);
    ctx.save(); ctx.clip(P_LAND);
    scars.forEach(s => { const a = clamp((1 - lq * 1.25) * 0.7 - s.thr * 0.15, 0, 0.7); if (a <= 0) return; ctx.fillStyle = "rgba(120,86,50," + a + ")"; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, s.rot, 0, PI2); ctx.fill(); });
    ctx.restore();
    // pond and stream
    const wc = mix("#8b7a52", "#4cc3d9", q.zq.watershed / 100);
    const end = G.P(70 * Math.PI / 180, 0.96);
    ctx.strokeStyle = wc; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(pond.x, pond.y + 12); ctx.quadraticCurveTo(pond.x - 30, (pond.y + end.y) / 2, end.x, end.y); ctx.stroke();
    ctx.fillStyle = wc; ctx.beginPath(); ctx.ellipse(pond.x, pond.y, 46, 26, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.beginPath(); ctx.ellipse(pond.x - 10, pond.y - 6, 18, 6, 0, 0, PI2); ctx.fill();
    const wq = q.zq.watershed / 100;
    reeds.forEach(r => { if (r.thr > wq) return; ctx.strokeStyle = "#3f8f4a"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + Math.sin(t + r.ph) * 1.5, r.y - 8); ctx.stroke(); });
  }

  function drawRoads(list, t) {
    const dock = plotById[model.place.transport] || { x: G.CX, y: G.CY };
    const walk = (model.sel.transportIsland || []).indexOf("walkways") >= 0;
    ctx.lineCap = "round"; ctx.strokeStyle = walk ? "rgba(233,211,165,.95)" : "rgba(201,180,135,.9)"; ctx.lineWidth = walk ? 3 : 4; ctx.setLineDash(walk ? [4, 3] : []);
    list.forEach(f => {
      const p = plotById[model.place[f.id]]; if (p === dock) return;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 6); ctx.quadraticCurveTo((p.x + dock.x) / 2 + 12, (p.y + dock.y) / 2 - 10, dock.x, dock.y + 6); ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function drawTree(tr, t, sway) {
    const s = tr.sz, sw = Math.sin(t * 1.4 + tr.ph) * sway;
    ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.beginPath(); ctx.ellipse(tr.x + 2, tr.y + 1, s * 0.7, s * 0.3, 0, 0, PI2); ctx.fill();
    if (tr.palm) {
      ctx.strokeStyle = "#7a5230"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tr.x, tr.y); ctx.lineTo(tr.x + sw, tr.y - s * 1.3); ctx.stroke();
      ctx.strokeStyle = "#2f9d4a"; ctx.lineWidth = 1.8;
      for (let i = 0; i < 6; i++) { const a = i / 6 * PI2; ctx.beginPath(); ctx.moveTo(tr.x + sw, tr.y - s * 1.3); ctx.quadraticCurveTo(tr.x + sw + Math.cos(a) * s * 0.7, tr.y - s * 1.7, tr.x + sw + Math.cos(a) * s, tr.y - s * 1.2 + Math.sin(a) * s * 0.4); ctx.stroke(); }
    } else {
      ctx.fillStyle = "#6b4a2b"; ctx.fillRect(tr.x - 1, tr.y - s * 0.6, 2, s * 0.6);
      ctx.fillStyle = "#2f7d3a"; ctx.beginPath(); ctx.arc(tr.x + sw * 0.5, tr.y - s * 0.9, s * 0.75, 0, PI2); ctx.fill();
      ctx.fillStyle = "rgba(160,220,120,.35)"; ctx.beginPath(); ctx.arc(tr.x + sw * 0.5 - 2, tr.y - s * 1.1, s * 0.4, 0, PI2); ctx.fill();
    }
  }

  function drawMangroves(t, q) {
    const mq = q.zq.mangrove / 100;
    mangroves.forEach(m => {
      if (m.thr > mq) return;
      ctx.strokeStyle = "#5b4630"; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(m.x + i * 3, m.y - 2); ctx.lineTo(m.x + i * 5, m.y + 5); ctx.stroke(); }
      ctx.fillStyle = "#2b6b4b"; ctx.beginPath(); ctx.arc(m.x, m.y - 4, m.sz * 0.8, 0, PI2); ctx.fill();
      ctx.fillStyle = "rgba(120,200,140,.3)"; ctx.beginPath(); ctx.arc(m.x - 2, m.y - 6, m.sz * 0.4, 0, PI2); ctx.fill();
    });
  }

  function drawDerelict() {
    const p = plotById.p12; ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = "rgba(90,70,50,.55)"; ctx.beginPath(); ctx.ellipse(0, 4, 42, 22, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = "#9a9a94"; ctx.fillRect(-30, -8, 36, 14); ctx.fillStyle = "#b3b3ac"; ctx.fillRect(-26, -12, 10, 8);
    ctx.strokeStyle = "#9a4a2a"; ctx.lineWidth = 1.2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-28 + i * 7, -8); ctx.lineTo(-28 + i * 7 + 2, -22 - (i % 2) * 6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-28, -22); ctx.lineTo(4, -20); ctx.stroke();
    ctx.fillStyle = "#e0a319"; ctx.fillRect(14, 4, 20, 9); ctx.fillStyle = "#b47f10"; ctx.fillRect(22, -3, 10, 7); ctx.fillStyle = "#333"; ctx.fillRect(12, 12, 24, 3);
    ctx.strokeStyle = "#8a8a84"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(4, 14); ctx.stroke();
    ctx.restore();
  }

  function drawFacilities(list, t, now) {
    const dockP = plotById[model.place.transport];
    list.slice().sort((a, b) => plotById[model.place[a.id]].y - plotById[model.place[b.id]].y).forEach(f => {
      const p = plotById[model.place[f.id]], d = dirOf(p), age = (now - (built[f.id] || 0)) / 1000, pr = clamp(age / 0.9, 0, 1), e = easeOut(pr);
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = "rgba(196,170,120,.6)"; ctx.beginPath(); ctx.ellipse(0, 5, 34, 15, 0, 0, PI2); ctx.fill();
      ctx.translate(0, (1 - e) * 10); ctx.scale(0.3 + 0.7 * e, 0.3 + 0.7 * e); ctx.globalAlpha = 0.2 + 0.8 * e;
      F.draw(ctx, f.id, model.sel, t, d, model.brand);
      ctx.restore();
      if (age < 1.2) { ctx.strokeStyle = "rgba(255,240,180," + (0.8 * (1 - age / 1.2)) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 12 + age * 46, 0, PI2); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = i + age * 3; ctx.fillStyle = "rgba(240,220,170," + (0.6 * (1 - age / 1.2)) + ")"; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * (10 + age * 30), p.y + 6 + Math.sin(a) * (5 + age * 12), 3, 0, PI2); ctx.fill(); } }
      if (f.id === "lodging" && model.name) {
        ctx.fillStyle = "#0D2137"; const w = Math.min(130, 20 + model.name.length * 6.2);
        ctx.fillRect(p.x - w / 2, p.y - 40, w, 15); ctx.fillStyle = model.brand || "#F4A825"; ctx.fillRect(p.x - w / 2, p.y - 26, w, 2);
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText(model.name.slice(0, 22), p.x, p.y - 29);
      }
    });
    if (dockP) { /* dock drawn as a facility */ }
  }

  function drawPeople(dt, t) {
    ensurePeople(placed()); if (!people.length) return;
    people.forEach(p => {
      const dx = p.tx - p.x, dy = p.ty - p.y, l = Math.hypot(dx, dy);
      if (l < 3) { const pt = people.pts[Math.floor(rnd() * people.pts.length)]; p.tx = pt.x + (rnd() - 0.5) * 28; p.ty = pt.y + 14 + (rnd() - 0.5) * 8; }
      else { p.x += dx / l * p.sp * dt; p.y += dy / l * p.sp * dt; }
      const b = Math.sin(t * 8 + p.ph) * 0.8;
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 3, 1.2, 0, 0, PI2); ctx.fill();
      ctx.fillStyle = "#334155"; ctx.fillRect(p.x - 1.6, p.y - 3 + b * 0.3, 1.2, 3); ctx.fillRect(p.x + 0.4, p.y - 3 - b * 0.3, 1.2, 3);
      ctx.fillStyle = p.shirt; ctx.fillRect(p.x - 2, p.y - 8 + b * 0.2, 4, 5);
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(p.x, p.y - 10 + b * 0.2, 2.2, 0, PI2); ctx.fill();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(p.x, p.y - 10.8 + b * 0.2, 2.2, Math.PI, 0); ctx.fill();
      if (p.dir) { ctx.strokeStyle = "#F4A825"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y - 5, 7, 0, PI2); ctx.stroke(); }
    });
  }

  function drawWildlife(t, q) {
    const bio = q.bio;
    if (bio > 45) { const n = Math.min(8, Math.round((bio - 40) / 8)); ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 1.4; for (let i = 0; i < n; i++) { const b = birds[i], a = t * b.sp + b.ph, x = G.CX + Math.cos(a) * b.r * 1.3, y = 100 + b.y + Math.sin(a * 1.4) * 40, f = Math.sin(t * 9 + i) * 3; ctx.beginPath(); ctx.moveTo(x - 5, y + f); ctx.quadraticCurveTo(x - 2, y - 3, x, y); ctx.quadraticCurveTo(x + 2, y - 3, x + 5, y + f); ctx.stroke(); } }
    if (bio > 30) {
      const n = bio > 65 ? 3 : bio > 45 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const a = 0.7 + i * 1.1 + t * 0.05 * (i + 1), pt = G.P(a, 1.24 + 0.05 * i), x = pt.x, y = pt.y, d = Math.cos(a + 1.57) > 0 ? 1 : -1;
        ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
        ctx.fillStyle = "#6b7a3a"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, PI2); ctx.fill(); ctx.fillStyle = "#8a9a4a"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.5, 0, 0, PI2); ctx.fill();
        ctx.fillStyle = "#a3b06a"; ctx.beginPath(); ctx.ellipse(9, 0, 3, 2.2, 0, 0, PI2); ctx.fill();
        const fl = Math.sin(t * 3 + i) * 2; ctx.fillStyle = "#7a8a45"; ctx.beginPath(); ctx.ellipse(-2, 7 + fl, 4, 1.6, 0.4, 0, PI2); ctx.ellipse(-2, -7 - fl, 4, 1.6, -0.4, 0, PI2); ctx.fill();
        ctx.restore();
      }
    }
    const sp = D.species.find(s => s.id === model.species);
    if (sp && q.zq.mangrove > 25) {
      const m = G.P(-0.7, 1.0), lag = G.P(-0.55, 1.14);
      if (sp.id === "croc") { ctx.fillStyle = "#3e6b3a"; ctx.beginPath(); ctx.ellipse(m.x + 6, m.y - 4, 12, 3, 0.2, 0, PI2); ctx.fill(); ctx.fillStyle = "#e8e2c0"; ctx.beginPath(); ctx.arc(m.x + 16, m.y - 6, 1.2, 0, PI2); ctx.fill(); }
      if (sp.id === "tarpon") { const ph = (t * 0.3) % 1; if (ph < 0.25) { const j = Math.sin(ph / 0.25 * 3.14); ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(lag.x, lag.y - j * 10, 7, 3.4, 5.9); ctx.stroke(); } }
      const mk2 = sp.id === "croc" ? m : lag; ctx.font = "16px sans-serif"; ctx.textAlign = "center"; ctx.fillText(sp.icon, mk2.x, mk2.y - 16 + Math.sin(t * 2) * 2);
      ctx.strokeStyle = "rgba(244,168,37,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mk2.x, mk2.y - 10 + Math.sin(t * 2) * 2, 12, 0, PI2); ctx.stroke();
    }
  }

  function drawOverlays(t, now, list) {
    const fpIdx = model.fpIdx;
    if (fpIdx > 40) { const a = Math.min(0.32, (fpIdx - 40) / 170); const g = ctx.createRadialGradient(G.CX, G.CY, 30, G.CX, G.CY, 380); g.addColorStop(0, "rgba(140,110,70," + a + ")"); g.addColorStop(1, "rgba(140,110,70,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (model.wq < 35) { ctx.fillStyle = "rgba(230,230,230,.7)"; for (let i = 0; i < 14; i++) { const pt = G.P(i * 0.45, 1.12 + (i % 3) * 0.06); ctx.fillRect(pt.x + Math.sin(t + i) * 3, pt.y, 3, 2); } }
    const st = fxVal("storm"), fl = fxVal("flood");
    if (fl) { ctx.strokeStyle = "rgba(60,150,230," + 0.5 * fl + ")"; ctx.lineWidth = 34 * fl; ctx.stroke(P_ISLAND); plots.forEach(p => { if (p.elev === 0) { ctx.fillStyle = "rgba(60,150,230," + 0.5 * fl + ")"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 40 * fl, 20 * fl, 0, 0, PI2); ctx.fill(); } }); }
    if (st) {
      ctx.fillStyle = "rgba(8,18,40," + 0.5 * st + ")"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(200,220,255," + 0.5 * st + ")"; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 150; i++) { const x = (i * 97 + t * 260) % (W + 60) - 30, y = (i * 53 + t * 520) % H; ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 14); }
      ctx.stroke();
      if (Math.sin(t * 5.3) > 0.985) { ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(0, 0, W, H); }
    }
    night += ((model.night ? 1 : 0) - night) * 0.05;
    if (night > 0.02) {
      ctx.fillStyle = "rgba(4,12,46," + 0.58 * night + ")"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      list.forEach(f => { const p = plotById[model.place[f.id]], g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 46); g.addColorStop(0, "rgba(255,200,100," + 0.55 * night + ")"); g.addColorStop(1, "rgba(255,200,100,0)"); ctx.fillStyle = g; ctx.fillRect(p.x - 46, p.y - 46, 92, 92); });
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawMapLayer(t) {
    ctx.textAlign = "center"; ctx.font = "bold 10px system-ui, sans-serif";
    const byPlot = {}; Object.keys(model.place).forEach(fid => { byPlot[model.place[fid]] = fid; });
    plots.forEach(p => {
      const occ = byPlot[p.id], tone = model.plotTone && model.plotTone[p.id], hov = hoverPlot === p.id;
      const col = occ ? "#F4A825" : tone === "good" ? "#4ade80" : tone === "warn" ? "#fde047" : tone === "bad" ? "#fb7185" : "#ffffff";
      ctx.strokeStyle = col; ctx.lineWidth = hov ? 4 : 2.5; ctx.setLineDash(occ ? [] : [5, 4]); ctx.lineDashOffset = -t * 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, 27 + (hov ? 3 : 0) + Math.sin(t * 3) * (occ ? 0 : 1.5), 0, PI2); ctx.stroke(); ctx.setLineDash([]);
      const lab = p.name + " " + "▁▃▆"[p.elev]; const w = ctx.measureText(lab).width + 10;
      ctx.fillStyle = "rgba(13,33,55,.82)"; ctx.fillRect(p.x - w / 2, p.y + 30, w, 14); ctx.fillStyle = "#fff"; ctx.fillText(lab, p.x, p.y + 40);
      if (occ) { const fac = D.facilities.find(f => f.id === occ); ctx.font = "15px sans-serif"; ctx.fillText(fac.icon, p.x, p.y - 30); ctx.font = "bold 10px system-ui, sans-serif"; }
    });
  }


  // ---------- Walking, villagers, spots, and cleanup items ----------
  const NP = window.NPCS, VL = NP.V;
  const ws = { path: null, retries: 0, x: NP.spawn.x, y: NP.spawn.y, dir: 1, moving: false, ph: 0, target: null, autoTalk: null, paused: false, near: null, keys: {}, v: {} };
  let nearCb = null, interactCb = null, collectCb = null, walkCb = null, hoverNpc = null;
  function walkable(x, y) {
    const dx = (x - G.CX) / G.RX, dy = (y - G.CY) / G.RY;
    if (Math.hypot(dx, dy) / G.R(Math.atan2(dy, dx)) > 0.985) return false;
    return Math.pow((x - pond.x) / 50, 2) + Math.pow((y - pond.y) / 30, 2) >= 1;
  }
  const npcBlock = (x, y) => (model.npcs || []).some(n => Math.hypot(n.x - x, n.y - y) < 11);

  function findPath(sx, sy, tx, ty) {
    const cs = 12, GW = Math.ceil(W / cs), GH = Math.ceil(H / cs);
    const free = (x, y) => walkable(x, y) && !(model.npcs || []).some(n => Math.hypot(n.x - x, n.y - y) < 17);
    const ok = (cx, cy) => cx >= 0 && cy >= 0 && cx < GW && cy < GH && free(cx * cs + cs / 2, cy * cs + cs / 2);
    const cell = (x, y) => [Math.floor(x / cs), Math.floor(y / cs)];
    let [scx, scy] = cell(sx, sy), [gcx, gcy] = cell(tx, ty);
    const nearest = (cx, cy) => { if (ok(cx, cy)) return [cx, cy]; for (let r = 1; r < 8; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(cx + dx, cy + dy)) return [cx + dx, cy + dy]; return null; };
    const s0 = nearest(scx, scy), g0 = nearest(gcx, gcy); if (!s0 || !g0) return [{ x: tx, y: ty }];
    const prev = new Int32Array(GW * GH).fill(-2), q = [s0[1] * GW + s0[0]]; prev[q[0]] = -1; const goal = g0[1] * GW + g0[0];
    for (let h = 0; h < q.length && prev[goal] === -2; h++) {
      const c = q[h], cx = c % GW, cy = (c - cx) / GW;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue; const nx = cx + dx, ny = cy + dy, n = ny * GW + nx;
        if (prev[n] !== -2 || !ok(nx, ny) || (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy)))) continue;
        prev[n] = c; q.push(n);
      }
    }
    if (prev[goal] === -2) return [{ x: tx, y: ty }];
    const pts = []; for (let c = goal; c !== -1; c = prev[c]) pts.push({ x: (c % GW) * cs + cs / 2, y: Math.floor(c / GW) * cs + cs / 2 }); pts.reverse();
    // string-pull: drop points when the straight line is clear
    const clear = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 5); for (let k = 1; k < n; k++) if (!free(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n)) return false; return true; };
    const out = []; let a = { x: sx, y: sy }, i2 = 0;
    while (i2 < pts.length) { let far = i2; for (let k = pts.length - 1; k > i2; k--) if (clear(a, pts[k])) { far = k; break; } out.push(pts[far]); a = pts[far]; i2 = far + 1; }
    const last = { x: tx, y: ty }; if (free(tx, ty) && clear(out.length ? out[out.length - 1] : { x: sx, y: sy }, last)) out.push(last);
    return out;
  }
  function goTo(x, y, autoId) { ws.target = { x, y }; ws.autoTalk = autoId || null; ws.path = findPath(ws.x, ws.y, x, y); ws.stuck = 0; }

  function stepPlayer(dt) {
    if (ws.paused || !model || model.mapMode) { ws.moving = false; return; }
    const k = ws.keys, v = ws.v;
    let ix = (k.arrowright || k.d || v.right ? 1 : 0) - (k.arrowleft || k.a || v.left ? 1 : 0), iy = (k.arrowdown || k.s || v.down ? 1 : 0) - (k.arrowup || k.w || v.up ? 1 : 0);
    if (ix || iy) { ws.target = null; ws.path = null; ws.autoTalk = null; }
    else if (ws.path && ws.path.length) {
      const p0 = ws.path[0], dx = p0.x - ws.x, dy = p0.y - ws.y, l0 = Math.hypot(dx, dy);
      if (l0 < 5) { ws.path.shift(); if (!ws.path.length) { ws.target = null; ws.path = null; } }
      else { ix = dx / l0; iy = dy / l0; }
    }
    const l = Math.hypot(ix, iy); ws.moving = l > 0;
    if (l) {
      ix /= l; iy /= l; const sp = 95 * dt; let moved = false;
      const nx = ws.x + ix * sp, ny = ws.y + iy * sp;
      if (walkable(nx, ny) && !npcBlock(nx, ny)) { ws.x = nx; ws.y = ny; moved = true; }
      else if (walkable(nx, ws.y) && !npcBlock(nx, ws.y)) { ws.x = nx; moved = true; }
      else if (walkable(ws.x, ny) && !npcBlock(ws.x, ny)) { ws.y = ny; moved = true; }
      if (ws.path) { ws.stuck = moved ? 0 : (ws.stuck || 0) + dt; if (ws.stuck > 0.6) { if (ws.target) ws.path = findPath(ws.x, ws.y, ws.target.x, ws.target.y); ws.stuck = 0; if (++ws.retries > 6) { ws.path = null; ws.target = null; ws.retries = 0; } } }
      if (Math.abs(ix) > 0.2) ws.dir = ix > 0 ? 1 : -1; ws.ph += dt * 10;
      if (moved) { ws.trav = (ws.trav || 0) + sp; if (ws.trav > 70 && walkCb && !ws.travFired) { ws.travFired = true; walkCb(); } }
    }
    if (collectCb) (model.debris || []).forEach(d => { if (Math.hypot(d.x - ws.x, d.y - ws.y) < 15) collectCb(d.id); });
    let best = null, bd = 44;
    (model.npcs || []).forEach(n => { const d = Math.hypot(n.x - ws.x, n.y - ws.y); if (d < bd) { bd = d; best = { kind: "npc", id: n.id, label: n.name }; } });
    (model.spots || []).forEach(s => { const d = Math.hypot(s.x - ws.x, s.y - ws.y); if (d < bd - 8) { bd = d; best = { kind: "spot", id: s.id, label: s.label }; } });
    const key = best ? best.kind + best.id : "", old = ws.near ? ws.near.kind + ws.near.id : "";
    if (key !== old) { ws.near = best; if (nearCb) nearCb(best); }
    if (ws.autoTalk && best && best.kind === "npc" && best.id === ws.autoTalk) { ws.autoTalk = null; if (interactCb) interactCb(best); }
  }

  function fig(x, y, sc, shirt, skin, hair, b, ring) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(0, 1, 3.4, 1.4, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = "#334155"; ctx.fillRect(-1.7, -3 + b * 0.3, 1.3, 3); ctx.fillRect(0.4, -3 - b * 0.3, 1.3, 3);
    ctx.fillStyle = shirt; ctx.fillRect(-2.2, -8 + b * 0.2, 4.4, 5);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -10 + b * 0.2, 2.4, 0, PI2); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -10.8 + b * 0.2, 2.4, Math.PI, 0); ctx.fill();
    if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(0, 1, 5.2, 2.2, 0, 0, PI2); ctx.stroke(); }
    ctx.restore();
  }
  function label(txt, x, y, col) {
    ctx.font = "bold 10px system-ui, sans-serif"; ctx.textAlign = "center"; const w = ctx.measureText(txt).width + 10;
    ctx.fillStyle = "rgba(13,33,55,.85)"; ctx.fillRect(x - w / 2, y - 10, w, 14); ctx.fillStyle = col || "#fff"; ctx.fillText(txt, x, y);
  }

  function drawVillage(t) {
    const x = VL.x, y = VL.y;
    ctx.fillStyle = "rgba(200,170,110,.55)"; ctx.beginPath(); ctx.ellipse(x, y + 6, 74, 46, 0, 0, PI2); ctx.fill();
    const house = (hx, hy, w, h, roof, body) => { ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(x + hx - w / 2 + 2, y + hy + h - 1, w, 3); ctx.fillStyle = body || "#f1e3c6"; ctx.fillRect(x + hx - w / 2, y + hy, w, h); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x + hx - w / 2 - 3, y + hy); ctx.lineTo(x + hx + w / 2 + 3, y + hy); ctx.lineTo(x + hx, y + hy - h * 0.8); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#7a5230"; ctx.fillRect(x + hx - 2, y + hy + h - 7, 4, 7); };
    house(-34, -24, 26, 16, "#7c3aed", "#f4d7a1");           // schoolhouse
    ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(x - 34, y - 42, 2.5, 0, PI2); ctx.fill();
    house(36, -22, 20, 14, "#0B7A75", "#f8fafc");            // clinic hut
    ctx.fillStyle = "#16a34a"; ctx.fillRect(x + 35, y - 33, 2.4, 8); ctx.fillRect(x + 32.2, y - 30.2, 8, 2.4);
    house(-38, 22, 20, 12, "#e07a5f"); house(-8, 28, 20, 12, "#3d8fd1"); house(28, 26, 22, 13, "#e9b44c"); house(56, 6, 16, 11, "#6aa84f");
    ctx.fillStyle = "#6b4a2b"; ctx.fillRect(x - 60, y + 24, 2, 12); ctx.fillStyle = "#c9a35f"; ctx.fillRect(x - 66, y + 20, 14, 8);  // notice board
    ctx.fillStyle = "#7a5b34"; for (let i = 0; i < 3; i++) ctx.fillRect(x - 14 + i * 12, y - 58, 9, 8);   // garden beds
    ctx.strokeStyle = "#5cb85c"; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x - 12 + i * 12 + j * 3, y - 51); ctx.lineTo(x - 12 + i * 12 + j * 3, y - 56 - Math.sin(t + i + j) * 0.6); ctx.stroke(); }
    F.smoke(ctx, x + 60, y - 4, t, "#d1d5db", 2);
  }

  function drawSpotsAndDebris(t) {
    (model.spots || []).forEach(s => {
      const pulse = s.done ? 0 : (Math.sin(t * 3) + 1) * 2;
      ctx.fillStyle = s.done ? "rgba(255,255,255,.35)" : "rgba(244,168,37,.9)"; ctx.beginPath(); ctx.arc(s.x, s.y, 7 + pulse * 0.3, 0, PI2); ctx.fill();
      ctx.strokeStyle = "#0D2137"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#0D2137"; ctx.fillText(s.icon, s.x, s.y + 3.5);
      if (s.hot) { ctx.strokeStyle = "rgba(244,168,37," + (0.9 - (t * 1.4 % 1) * 0.8) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 9 + (t * 1.4 % 1) * 20, 0, PI2); ctx.stroke(); }
    });
    (model.debris || []).forEach(d => {
      const cols = ["#3fae6a", "#9ca3af", "#cbd5e1"]; ctx.fillStyle = cols[d.type]; ctx.fillRect(d.x - 2.5, d.y - 1.5, 5, 3);
      const g = (Math.sin(t * 4 + d.x) + 1) / 2; ctx.strokeStyle = "rgba(255,255,255," + (0.4 + g * 0.5) + ")"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(d.x - 5, d.y - 5); ctx.lineTo(d.x + 5, d.y + 5); ctx.moveTo(d.x + 5, d.y - 5); ctx.lineTo(d.x - 5, d.y + 5); ctx.stroke();
    });
  }

  function drawNpcs(t) {
    (model.npcs || []).forEach(n => {
      fig(n.x, n.y, 1.9, n.shirt, n.skin, n.hair, Math.sin(t * 2 + n.x) * 0.3, null);
      const near = Math.hypot(n.x - ws.x, n.y - ws.y) < 90 || hoverNpc === n.id;
      if (near) label(n.name, n.x, n.y + 12);
      if (n.bark && Math.hypot(n.x - ws.x, n.y - ws.y) < 70 && !ws.paused) {
        ctx.font = "11px system-ui, sans-serif"; const w = Math.min(230, ctx.measureText(n.bark).width + 14);
        ctx.fillStyle = "#fff"; ctx.fillRect(n.x - w / 2, n.y - 60, w, 20); ctx.strokeStyle = "#0D2137"; ctx.lineWidth = 1; ctx.strokeRect(n.x - w / 2, n.y - 60, w, 20);
        ctx.fillStyle = "#14212e"; ctx.textAlign = "center"; ctx.fillText(n.bark.length > 40 ? n.bark.slice(0, 39) + "…" : n.bark, n.x, n.y - 46);
      }
      if (n.mark) {
        const by = n.y - 34 + Math.sin(t * 4) * 2.5; ctx.fillStyle = "#F4A825"; ctx.beginPath(); ctx.arc(n.x, by, 8, 0, PI2); ctx.fill();
        ctx.strokeStyle = "#0D2137"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = "#0D2137"; ctx.font = n.mark.length > 1 ? "10px sans-serif" : "bold 12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText(n.mark, n.x, by + 4.2);
      }
    });
  }

  function drawPlayer(t) {
    const h = model.hero || { shirt: "#0B7A75", skin: "#e8b48a", hair: "#4a2e1a", name: "" };
    const b = ws.moving ? Math.sin(ws.ph) * 0.9 : 0;
    ctx.save(); ctx.translate(ws.x, ws.y); ctx.scale(ws.dir, 1); fig(0, 0, 2.1, h.shirt, h.skin, h.hair, b, "#F4A825"); ctx.restore();
    if (h.name) label(h.name, ws.x, ws.y + 13, "#F4A825");
    if (ws.near && !ws.paused) { ctx.fillStyle = "#F4A825"; ctx.beginPath(); ctx.moveTo(ws.x - 4, ws.y - 34 + Math.sin(t * 6) * 2); ctx.lineTo(ws.x + 4, ws.y - 34 + Math.sin(t * 6) * 2); ctx.lineTo(ws.x, ws.y - 28 + Math.sin(t * 6) * 2); ctx.fill(); }
  }

  function drawWaypoint(t) {
    const w = model.waypoint; if (!w) return;
    const d = Math.hypot(w.x - ws.x, w.y - ws.y), by = w.y - 46 + Math.sin(t * 4) * 4;
    ctx.strokeStyle = "rgba(244,168,37," + (0.9 - (t * 1.5 % 1) * 0.8) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w.x, w.y, 10 + (t * 1.5 % 1) * 24, 0, PI2); ctx.stroke();
    ctx.fillStyle = "#F4A825"; ctx.beginPath(); ctx.moveTo(w.x - 8, by - 10); ctx.lineTo(w.x + 8, by - 10); ctx.lineTo(w.x, by); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#0D2137"; ctx.lineWidth = 2; ctx.stroke();
    if (d > 70) { const a = Math.atan2(w.y - ws.y, w.x - ws.x); ctx.save(); ctx.translate(ws.x + Math.cos(a) * 34, ws.y - 6 + Math.sin(a) * 34); ctx.rotate(a); ctx.fillStyle = "#F4A825"; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#0D2137"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
  }

  const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase());
  const typing = () => { const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };
  function bindKeys() {
    document.addEventListener("keydown", e => {
      if (typing() || e.ctrlKey || e.metaKey || e.altKey) return; const k = keyName(e);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].indexOf(k) >= 0 || "wasd".indexOf(k) >= 0 && k.length === 1) { ws.keys[k] = true; if (k.indexOf("arrow") === 0 && !ws.paused) e.preventDefault(); }
      if ((k === "e" || k === "enter" || (k === " " && ws.near)) && ws.near && !ws.paused && interactCb) { e.preventDefault(); interactCb(ws.near); }
    });
    document.addEventListener("keyup", e => { delete ws.keys[keyName(e)]; });
    window.addEventListener("blur", () => { ws.keys = {}; ws.v = {}; });
  }

  let last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!model) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016) * slow; last = now;
    const t = (now - t0) / 1000 * slow;
    const sc = model.scale == null ? 1 : model.scale, q = { zq: {}, wq: model.wq, bio: model.bio, fpIdx: model.fpIdx };
    for (const k in model.zq) q.zq[k] = clamp(model.zq[k] * sc, 0, 100);
    q.bio = clamp(model.bio * sc, 0, 100);
    ctx.setTransform(scaleX, 0, 0, scaleX, 0, 0);
    const list = placed();
    drawSea(t, q); drawReef(t, q); drawLand(t, q);
    const gone = model.derelictGone || Object.keys(model.place).some(f => model.place[f] === "p12");
    if (!gone) drawDerelict();
    drawVillage(t);
    drawRoads(list, t);
    const lq = clamp((q.zq.inland * 0.6 + q.zq.watershed * 0.4) / 100, 0, 1);
    trees.forEach(tr => { if (tr.thr < lq * 0.95) drawTree(tr, t, 1.5 + fxVal("storm") * 5); });
    drawMangroves(t, q);
    drawFacilities(list, t, now);
    drawPeople(dt, t);
    if (!model.mapMode) { stepPlayer(dt); drawSpotsAndDebris(t); const ents = (model.npcs || []).length; drawNpcs(t); drawPlayer(t); drawWaypoint(t); }
    drawWildlife(t, q);
    drawOverlays(t, now, list);
    if (model.mapMode) drawMapLayer(t);
  }

  function interact() { if (ws.near && !ws.paused && interactCb) interactCb(ws.near); }
  window.Scene = { init, setModel, fx, setNight, onPlotClick, snapshot,
    onNear: cb => { nearCb = cb; }, onInteract: cb => { interactCb = cb; }, onCollect: cb => { collectCb = cb; },
    setPaused: v => { ws.paused = !!v; if (v) { ws.target = null; ws.keys = {}; } }, interact,
    vkey: (d, on) => { ws.v[d] = on; }, renear: () => { if (nearCb) nearCb(ws.near); }, onWalk: cb => { walkCb = cb; ws.trav = 0; ws.travFired = false; }, resetWalk: () => { ws.trav = 0; ws.travFired = false; }, moveTo: (x, y, id) => { ws.retries = 0; goTo(x, y, id); }, player: () => ({ x: ws.x, y: ws.y }) };
})();
