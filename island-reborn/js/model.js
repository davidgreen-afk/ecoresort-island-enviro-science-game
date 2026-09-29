/* Island Reborn: state, scoring model, placement rules, validation, achievements. */
(function () {
  const D = window.DATA, C = window.ECO_CONFIG;
  const clamp = (v, a, b) => Math.max(a == null ? 0 : a, Math.min(b == null ? 100 : b, v));

  // ---------- Island geometry shared by the scene and the model ----------
  const Geo = {
    W: 960, H: 600, CX: 480, CY: 318, RX: 330, RY: 195,
    R(a) { return 1 + 0.10 * Math.sin(2 * a + 0.6) + 0.07 * Math.sin(3 * a + 1.9) + 0.05 * Math.sin(5 * a + 0.3); },
    P(a, s) { const r = Geo.R(a) * s; return { x: Geo.CX + Geo.RX * r * Math.cos(a), y: Geo.CY + Geo.RY * r * Math.sin(a) }; }
  };
  D.plots.forEach(p => { const pt = Geo.P(p.a * Math.PI / 180, p.s); p.x = pt.x; p.y = pt.y; });

  const phaseOfGroup = { lodging: "concept", water: "water", food: "food", energy: "energy", waste: "waste" };
  const CATS = {
    lodging: "Lodging and building", recreation: "Recreation", water: "Water", food: "Food", energy: "Energy", waste: "Waste",
    transportIsland: "Transport", transportOff: "Transport", housing: "Staff housing", housingPolicy: "Staff housing", footprint: "Reduction measures"
  };

  function opt(gid, oid) { const g = D.groupById[gid]; return g ? g.options.find(o => o.id === oid) : null; }
  function lock(s, o) {
    const NPC = window.NPCS, tr = s.trust || {};
    if (o.block) { const v = tr[o.block.npc] || 0; if (v <= o.block.max) return { locked: true, kind: "block", why: `${NPC.N[o.block.npc].name} will not work with you until you rebuild trust (now ${v}). Talk with them again or finish a quest for them.` }; }
    if (o.need) {
      if (o.need.trust) { const v = tr[o.need.trust.npc] || 0; if (v < o.need.trust.min) return { locked: true, kind: "need", why: `Earn ${NPC.N[o.need.trust.npc].name}'s trust (${v} of ${o.need.trust.min}) by asking good questions on the island.` }; }
      if (o.need.quest) { const q = s.quests && s.quests[o.need.quest]; if (!q || q.st !== "done") { const qd = NPC.quests.find(x => x.id === o.need.quest); return { locked: true, kind: "need", why: `Unlocked by finishing the side quest "${qd.title}".` }; } }
    }
    return { locked: false };
  }
  function selected(s, gid) { return (s.sel[gid] || []).map(id => opt(gid, id)).filter(o => o && !lock(s, o).locked); }
  function prune(s) {
    const out = [];
    D.groups.forEach(g => { const keep = (s.sel[g.id] || []).filter(id => { const o = opt(g.id, id); const l = o ? lock(s, o) : { locked: true }; if (l.locked && o) out.push(o.name); return !l.locked; }); s.sel[g.id] = keep; });
    return out;
  }
  function has(s, gid, oid) { return (s.sel[gid] || []).indexOf(oid) >= 0; }
  function phaseId(s) { return D.phases[s.phase].id; }

  function newState(diff) {
    const s = {
      v: 1, difficulty: diff || "standard", phase: 0, done: {}, kp: 0,
      team: [0, 1, 2].map(i => ({ name: "", major: ["bio", "biz", "eng"][i], role: D.roles[[0, 1, 2][i]], av: window.Avatars.random() })),
      resortName: "", tagline: "", palette: 0,
      visitors: 40, sel: {}, invest: { watershed: 8, inland: 8, mangrove: 8, reef: 8 },
      species: null, nicheAnswers: {}, pillarAnswers: {}, place: {}, quiz: {}, reflect: {},
      objectives: [5, 5, 5, 5, 5], civic: {}, sim: null, startedAt: Date.now(),
      talked: {}, skipped: {}, trust: {}, tips: {}, found: {}, debris: [], debrisPaid: false, hero: 0,
      quests: {}, reacted: {}, bonus: {}, tut: { on: false, steps: {} }
    };
    D.groups.forEach(g => { s.sel[g.id] = []; });
    return s;
  }

  // ---------- Placement rules ----------
  function evalPlacement(fid, plot, s) {
    const t = plot.t, notes = [], e = { bio: 0, wq: 0, comm: 0, health: 0, guest: 0, resil: 0, empl: 0, cost: 0 }, z = {};
    let exposed = false;
    const say = (tone, text) => notes.push({ tone, text });
    const crit = ["energy", "water", "waste", "housing", "clinic"].indexOf(fid) >= 0;
    if (plot.elev === 0 && (crit || fid === "lodging")) {
      exposed = true;
      if (fid === "housing") { e.empl -= 8; e.resil -= 3; say("bad", "Low-lying staff housing floods first in a surge."); }
      else if (fid === "lodging") { e.resil -= 3; say("warn", "Beachfront lodging is exposed to storm surge."); }
      else { e.resil -= 6; say("bad", "A critical service on low ground is exposed to storm surge."); }
    } else if (plot.elev === 2 && (crit || fid === "lodging")) { e.resil += 2; say("good", "High ground stays dry in storms."); }
    if (fid === "lodging") {
      if (t.indexOf("coast") >= 0) { e.guest += 7; say("good", "Beach access delights guests."); }
      else { e.guest -= 2; say("warn", "No water views, so guests are less thrilled."); }
    }
    if (t.indexOf("brownfield") >= 0) { e.bio += 4; e.comm += 2; e.cost -= 2; say("good", "Reuses land the last developer already cleared."); }
    if (t.indexOf("mangrove") >= 0) {
      if (fid === "edu") { e.comm += 3; say("good", "A live classroom beside the mangroves."); }
      else { z.mangrove = (z.mangrove || 0) - 6; e.bio -= 4; say("bad", "Too close to the mangrove nursery."); }
    }
    if (t.indexOf("pond") >= 0) {
      if (fid === "waste") { e.wq -= 8; say("bad", "Leachate risk to the freshwater pond."); }
      else if (fid === "food") { e.wq -= 3; e.cost -= 1; say("warn", "Easy irrigation, but fertilizer could reach the pond."); }
      else if (fid === "lodging" || fid === "housing") { e.wq -= 3; say("warn", "Wastewater risk near the pond."); }
      else if (fid === "edu") { e.comm += 2; say("good", "The pond makes a fine outdoor classroom."); }
    }
    if (t.indexOf("forest") >= 0 && fid !== "edu") { z.inland = (z.inland || 0) - 5; e.bio -= 4; say("bad", "Clears intact forest habitat."); }
    if (fid === "transport") {
      if (t.indexOf("coast") < 0) { e.guest -= 6; e.cost += 3; say("bad", "No natural harbor. Everything is hauled a long way."); }
      else say("good", "Sheltered water for a dock.");
    }
    if (fid === "water" && has(s, "water", "ro_solar")) {
      if (t.indexOf("coast") >= 0) { e.cost -= 1; say("good", "Short intake and brine pipes."); }
      else { e.cost += 2; say("warn", "A long seawater pipeline is needed."); }
    }
    if (fid === "clinic") {
      if (t.indexOf("interior") >= 0 || plot.elev >= 1) { e.health += 4; say("good", "Central and safe, so care is quick to reach."); }
      else { e.health -= 2; say("warn", "Far from most guests and staff."); }
    }
    if (fid === "energy" && plot.elev >= 1 && t.indexOf("forest") < 0 && t.indexOf("mangrove") < 0) say("good", "Open, sunny, breezy ground suits energy.");
    if (!notes.length) say("ok", "A solid, low-impact site.");
    return { notes, e, z, exposed };
  }

  function placementReport(s) {
    const items = {}, e = { bio: 0, wq: 0, comm: 0, health: 0, guest: 0, resil: 0, empl: 0, cost: 0 }, z = {};
    let exposed = 0, count = 0;
    D.facilities.forEach(f => {
      const pid = s.place[f.id]; if (!pid) return;
      const plot = D.plots.find(p => p.id === pid); if (!plot) return;
      const r = evalPlacement(f.id, plot, s); count++;
      items[f.id] = r;
      for (const k in r.e) e[k] += r.e[k];
      for (const k in r.z) z[k] = (z[k] || 0) + r.z[k];
      if (r.exposed) exposed++;
    });
    return { items, e, z, exposed, complete: count === D.facilities.length };
  }

  function scorePlot(fid, plot, s) {
    const r = evalPlacement(fid, plot, s);
    let sc = r.e.bio + r.e.wq + r.e.comm + r.e.health + r.e.guest + r.e.resil + r.e.empl - r.e.cost * 2;
    for (const k in r.z) sc += r.z[k] * 1.2;
    if (r.exposed) sc -= 3;
    if (fid === "lodging" && has(s, "lodging", "reuse") && plot.t.indexOf("brownfield") >= 0) sc += 6;
    if (fid === "housing" && has(s, "housing", "adaptive") && plot.t.indexOf("brownfield") >= 0) sc += 6;
    return sc;
  }

  function autoPlace(s) {
    const order = ["transport", "lodging", "waste", "energy", "water", "clinic", "housing", "food", "edu"];
    const used = {}, out = {};
    order.forEach(fid => {
      let best = null, bs = -1e9;
      D.plots.forEach(p => { if (used[p.id]) return; const sc = scorePlot(fid, p, s); if (sc > bs) { bs = sc; best = p; } });
      if (best) { used[best.id] = 1; out[fid] = best.id; }
    });
    return out;
  }

  // ---------- Scoring model ----------
  function compute(s) {
    const V = s.visitors, k = V / 40, curPhase = phaseId(s), budget = C.difficulty[s.difficulty].budget;
    const tot = { cost: 0, ops: 0, rev: 0, fp: 0, bio: 0, wq: 0, comm: 0, health: 0, guest: 0, resil: 0, jobs: 0, edu: 0, empl: 0, conn: 0 };
    const z = { watershed: 0, inland: 0, mangrove: 0, reef: 0 };
    const caps = { water: 0, food: 0, energy: 0, waste: 0, lodging: 0 }, dems = { water: 0, food: 0, energy: 0, waste: 0, lodging: 0 };
    const fpBy = {}, flags = {};
    let renewCap = 0, energyCap = 0, localCap = 0, foodCap = 0, lodgeRevNum = 0;
    const mitSum = selected(s, "mitigation").reduce((a, o) => a + (o.mit || 0), 0);
    const mitF = clamp(1 - mitSum, 0.35, 1);

    D.groups.forEach(g => {
      selected(s, g.id).forEach(o => {
        flags[o.id] = true; if (o.flag) flags[o.flag] = true;
        const sk = o.v || [];
        for (const key in o.eff) {
          const raw = o.eff[key];
          if (key === "z") {
            for (const zz in raw) { let val = raw[zz]; if (g.id === "recreation" && val < 0) val *= mitF; z[zz] += val; }
            continue;
          }
          if (key === "cap") { caps[g.id] = (caps[g.id] || 0) + raw; continue; }
          if (key === "dem") { dems[g.id] = (dems[g.id] || 0) + raw; continue; }
          if (key === "rev") {
            if (g.id === "lodging") lodgeRevNum += raw * (o.eff.cap || 0);
            else if (g.id === "recreation") tot.rev += raw * 0.35;
            else tot.rev += raw;
            continue;
          }
          let val = raw * (sk.indexOf(key) >= 0 ? k : 1);
          if (g.id === "recreation" && val < 0 && (key === "bio" || key === "wq")) val *= mitF;
          if (key in tot) tot[key] += val;
          if (key === "fp") { const c = CATS[g.id] || "Other"; fpBy[c] = (fpBy[c] || 0) + val; }
        }
        if (g.id === "energy" && o.eff.cap) { energyCap += o.eff.cap; if (o.renew) renewCap += o.eff.cap; }
        if (g.id === "food" && o.eff.cap) { foodCap += o.eff.cap; if (o.local) localCap += o.eff.cap; }
      });
    });

    for (const bk in (s.bonus || {})) if (bk in tot) tot[bk] += s.bonus[bk];
    if (caps.lodging > 0) tot.rev += lodgeRevNum / caps.lodging;
    // Diminishing returns: piling up positives helps less and less.
    const soft = T => (T > 0 ? 45 * (1 - Math.exp(-T / 45)) : T);
    ["bio", "wq", "comm", "health", "guest", "resil", "empl"].forEach(key => { tot[key] = soft(tot[key]); });

    const applies = g => !!s.done[phaseOfGroup[g]] || curPhase === phaseOfGroup[g];
    const cov = {}, short = {};
    ["water", "food", "energy", "waste", "lodging"].forEach(g => {
      const need = V * (g === "lodging" ? 1 : 1.7) * clamp(dems[g] >= 0 ? 1 - dems[g] : 1, 0.4, 1);
      cov[g] = need > 0 ? caps[g] / need : 0;
      short[g] = clamp(1 - cov[g], 0, 1);
    });

    const operating = !!s.done.concept || s.phase >= D.phases.findIndex(p => p.id === "concept");
    const effV = operating ? V * Math.min(1, cov.lodging) : 0;
    let emergOps = 0, emergFp = 0, guestPen = 0, healthPen = 0;
    ["water", "food", "energy", "waste"].forEach(g => {
      if (!applies(g)) return;
      emergOps += short[g] * V * 0.06; emergFp += short[g] * 10; guestPen += short[g] * 25;
      if (g === "water") healthPen += short[g] * 12;
    });
    tot.fp += emergFp; if (emergFp) fpBy["Emergency imports"] = emergFp;
    const fpBase = 10 + 10 * k; fpBy["Guest stay (baseline)"] = fpBase;

    const includeInvest = !!s.done.habitats || curPhase === "habitats";
    const plc = placementReport(s);
    const pe = plc.complete ? plc.e : { bio: 0, wq: 0, comm: 0, health: 0, guest: 0, resil: 0, empl: 0, cost: 0 };
    const pz = plc.complete ? plc.z : {};

    const zq = {};
    D.zones.forEach(zn => {
      const inv = includeInvest ? s.invest[zn.id] : 0;
      let q = zn.base + (100 - zn.base) * (1 - Math.exp(-inv / zn.k));
      q += z[zn.id] + (pz[zn.id] || 0);
      zq[zn.id] = clamp(q);
    });
    const zv = D.zones.map(zn => zq[zn.id]);
    const zmean = zv.reduce((a, b) => a + b, 0) / zv.length, zmin = Math.min.apply(null, zv);
    const conn = clamp(20 + tot.conn);
    const bio = clamp(0.5 * zmean + 0.3 * zmin + 0.2 * conn + tot.bio + pe.bio);
    const wq = clamp(35 + 0.25 * zq.watershed + 0.15 * zq.mangrove + 0.10 * zq.reef + tot.wq + pe.wq);
    const jobs = operating ? Math.round(effV * 1.4 + tot.jobs) : 0;
    const trustSum = Object.keys(s.trust || {}).reduce((a2, k) => a2 + s.trust[k], 0);
    const trustBonus = clamp(trustSum * 0.25, -8, 10);
    const comm = clamp(30 + tot.comm + Math.min(12, jobs / 15) + pe.comm + trustBonus);
    const health = clamp(35 + tot.health + 0.2 * (wq - 40) + pe.health - healthPen);
    const crowd = Math.max(0, V - 50) * 0.5;
    const guest = clamp(40 + tot.guest + 0.3 * (bio - 40) + 0.15 * (wq - 50) - guestPen - crowd + pe.guest);
    const resil = clamp(20 + tot.resil + 0.2 * zq.mangrove + 0.12 * zq.reef + 0.05 * zq.inland + pe.resil);
    const edu = clamp(tot.edu * 2.2);
    const empl = clamp(45 + tot.empl + pe.empl);
    const fpIdx = clamp(fpBase + tot.fp, 0, 100);
    const fpScore = clamp(100 - fpIdx * 1.6);

    const cfgE = C.economics;
    const revenue = operating ? effV * (cfgE.baseRevenuePerVisit + tot.rev) / 1000 * (0.8 + 0.4 * guest / 100) : 0;
    const capex = cfgE.sitePrepCost + tot.cost + (includeInvest ? Object.keys(s.invest).reduce((a, id) => a + s.invest[id], 0) : 0) + pe.cost;
    const over = Math.max(0, capex - budget), interest = over * cfgE.loanRate;
    const opsCost = operating ? effV * cfgE.baseOpsPerVisit / 1000 + tot.ops + emergOps + interest : 0;
    const profit = revenue - opsCost;
    const payback = profit > 0 ? capex / profit : 99;
    const econCore = !operating ? 0 : profit <= 0 ? 5 : clamp(100 - (payback - 4) * 6);
    const econ = !operating ? 0 : clamp(0.75 * econCore + 0.25 * guest - over * 0.25);
    const env = 0.4 * bio + 0.25 * wq + 0.2 * fpScore + 0.15 * resil;
    const soc = 0.35 * comm + 0.25 * health + 0.2 * empl + 0.2 * edu;
    const tbl = Math.cbrt(Math.max(0, env) * Math.max(0, soc) * Math.max(0, econ));

    let viability = null;
    const sp = D.species.find(x => x.id === s.species);
    if (sp) {
      let w = 0; for (const id in sp.needs) w += sp.needs[id] * zq[id];
      viability = clamp(0.7 * w + 0.3 * conn + 0.25 * (bio - 40));
    }

    return {
      V, effV, operating, tot, zq, conn, bio, wq, comm, health, guest, resil, edu, empl, fpIdx, fpScore, fpBy,
      revenue, opsCost, profit, capex, budget, over, payback, econ, env, soc, tbl,
      caps, cov, short, jobs, flags, viability, plc, trustBonus, trustSum, mitF, exposed: plc.complete ? plc.exposed : 0,
      renewShare: energyCap ? renewCap / energyCap : 0, localShare: foodCap ? localCap / foodCap : 0
    };
  }

  // ---------- Validation ----------
  function validatePhase(s, idx) {
    const ph = D.phases[idx], issues = [];
    const groupIssues = gid => {
      const g = D.groupById[gid], sel = selected(s, gid);
      if (sel.length < g.min) issues.push(`${g.title}: choose at least ${g.min}.`);
      sel.forEach(o => { if (o.violates) issues.push(`Remove "${o.name}". ${o.violates}`); });
    };
    (ph.groups || []).forEach(groupIssues);
    if (ph.consult && !s.talked[ph.id] && !s.skipped[ph.id] && window.NPCS) {
      const n = window.NPCS.N[ph.consult];
      issues.push(`Talk to ${n.name} (${n.role}) at ${n.spot}. Walk there on the island, or skip below.`);
    }
    switch (ph.type) {
      case "team":
        s.team.forEach((m, i) => { if (!m.name.trim()) issues.push(`Give director ${i + 1} a name.`); });
        if (new Set(s.team.map(m => m.role)).size < 3) issues.push("Give each director a different role.");
        break;
      case "name": if (s.resortName.trim().length < 3) issues.push("Give your resort a name of at least 3 letters."); break;
      case "species":
        if (!s.species) issues.push("Choose an indicator species.");
        else if (Object.keys(s.nicheAnswers).filter(k => k.indexOf(s.species + ":") === 0).length < 4) issues.push("Answer all four niche questions.");
        break;
      case "earthcharter":
        if (Object.keys(s.pillarAnswers).length < D.pillarQuiz.length) issues.push("Match every statement to a pillar.");
        break;
      case "map":
        if (D.facilities.some(f => !s.place[f.id])) issues.push("Place all nine facilities on the map.");
        break;
      case "midpoint": case "tbl":
        if ((s.reflect[ph.id] || "").trim().length < 15) issues.push("Write a short reflection (at least a sentence).");
        break;
    }
    return issues;
  }

  // ---------- Achievements ----------
  const ACHIEVEMENTS = [
    { id: "mangrove", icon: "🌱", name: "Mangrove guardian", desc: "Mangrove quality of 75 or more.", test: (m) => m.zq.mangrove >= 75 },
    { id: "reef", icon: "🪸", name: "Reef restorer", desc: "Reef quality of 75 or more.", test: (m) => m.zq.reef >= 75 },
    { id: "sun", icon: "☀️", name: "Sun and wind island", desc: "At least 80% renewable power, fully covered.", test: (m) => m.renewShare >= 0.8 && m.cov.energy >= 1 },
    { id: "loop", icon: "♻️", name: "Closed loop", desc: "Waste covered without shipping or dumping.", test: (m, s) => m.cov.waste >= 1 && !has(s, "waste", "ship") && !has(s, "waste", "landfill") },
    { id: "neighbors", icon: "🤝", name: "Good neighbors", desc: "Community score of 75 or more.", test: (m) => m.comm >= 75 },
    { id: "brown", icon: "🏗️", name: "Brownfield hero", desc: "Reused the old resort site and deconstructed it.", test: (m, s) => s.place && D.plots.find(p => p.id === s.place.lodging || p.id === s.place.housing || p.id === s.place.energy || p.id === s.place.water) && Object.keys(s.place).some(f => s.place[f] === "p12") && !!m.flags.decon },
    { id: "storm", icon: "🌀", name: "Storm ready", desc: "Resilience of 70 or more and no critical services on low ground.", test: (m) => m.resil >= 70 && m.exposed === 0 },
    { id: "team", icon: "🧑‍🤝‍🧑", name: "Team of experts", desc: "Directors with expertise covering at least 70% of phases.", test: (m, s) => teamCoverage(s) >= 0.7 },
    { id: "tbl", icon: "🔵", name: "Triple bottom line", desc: "Environment, people, and profit all at 65 or more.", test: (m, s, fin) => fin && fin.env >= 65 && fin.soc >= 65 && fin.econ >= 65 }
  ];

  function teamCoverage(s) {
    const majors = s.team.map(m => m.major);
    const phases = D.phases.filter(p => p.expert);
    if (!phases.length) return 0;
    return phases.filter(p => p.expert.some(x => majors.indexOf(x) >= 0)).length / phases.length;
  }
  function leadDirector(s, phase, idx) {
    const cands = s.team.filter(m => (phase.expert || []).indexOf(m.major) >= 0);
    return cands.length ? cands[idx % cands.length] : null;
  }
  function rotatingDirector(s, idx) { return s.team[idx % s.team.length]; }

  // ---------- Persistence ----------
  function save(s) { if (!C.features.autosave) return; try { localStorage.setItem(C.storageKey, JSON.stringify(s)); } catch (e) { /* storage unavailable */ } }
  function load() { try { const t = localStorage.getItem(C.storageKey); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(C.storageKey); } catch (e) { /* ignore */ } }

  window.Model = { Geo, clamp, opt, lock, prune, selected, has, phaseId, newState, evalPlacement, placementReport, autoPlace, compute, validatePhase, ACHIEVEMENTS, teamCoverage, leadDirector, rotatingDirector, save, load, clearSave, CATS };
})();
