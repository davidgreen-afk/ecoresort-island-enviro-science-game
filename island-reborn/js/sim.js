/* Island Reborn: ten-year simulation. Your earlier decisions set the odds; your responses set the outcome. */
(function () {
  const D = window.DATA, C = window.ECO_CONFIG, M = window.Model;
  const clamp = M.clamp;
  const KEYS = ["bio", "wq", "comm", "health", "resil", "guest"];

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function start(s) {
    const m = M.compute(s);
    s.sim = {
      year: 0, seed: Math.floor(Math.random() * 1e9), done: false,
      cur: { bio: Math.min(22, m.bio), wq: 45, comm: 35, health: 40, resil: 20, guest: 50 },
      dx: { bio: 0, wq: 0, comm: 0, health: 0, resil: 0, guest: 0 },
      cash: m.budget - m.capex, cumProfit: 0, history: [], pending: null, log: [], fx: null, final: null
    };
    return s.sim;
  }

  function severity(ev, m) {
    let v;
    switch (ev.sevKey) {
      case "permit": v = 1 - m.comm / 110; break;
      case "fuel": v = 0.3 + (1 - m.renewShare) + (m.flags.import ? 0.4 : 0) + (m.flags.diesel ? 0.3 : 0); break;
      case "hurricane": v = 0.5 + m.exposed * 0.16 - m.resil / 200; break;
      case "bleach": v = 0.9 - m.zq.reef / 200 - (m.flags.coralnursery ? 0.15 : 0); break;
      case "outbreak": v = 0.9 - m.health / 130; break;
      case "species": v = 0.9 - (m.viability == null ? 50 : m.viability) / 110; break;
      case "surge": v = 0.4 + m.exposed * 0.18 - m.resil / 180; break;
      case "flat": v = 1; break;
      default: v = 0;
    }
    return ev.sevKey === "none" || ev.sevKey === "flat" ? v : clamp(v, 0.15, 1.5);
  }

  function explain(ev, m) {
    const r = n => Math.round(n);
    switch (ev.sevKey) {
      case "permit": return `Your community score of ${r(m.comm)} shaped the mood in the room.`;
      case "fuel": return `${r(m.renewShare * 100)}% of your power is renewable, which set how exposed you were.`;
      case "hurricane": return `Your resilience is ${r(m.resil)} and ${m.exposed} critical or guest facilities sit on low ground.`;
      case "bleach": return `Your reef quality is ${r(m.zq.reef)}${m.flags.coralnursery ? ", helped by the heat-tolerant coral nursery" : ""}.`;
      case "outbreak": return `Your health score of ${r(m.health)} set how quickly the outbreak was contained.`;
      case "species": return `Your indicator species has a viability of ${m.viability == null ? "unknown" : r(m.viability)}.`;
      case "surge": return `Your resilience is ${r(m.resil)} and ${m.exposed} facilities sit on low ground.`;
      default: return "";
    }
  }

  // Advance to the next year and return the event awaiting a decision.
  function nextYear(s) {
    const sim = s.sim, m = M.compute(s);
    sim.year += 1;
    const y = sim.year, ramp = Math.min(1, 0.35 + 0.13 * y);
    KEYS.forEach(k => {
      sim.dx[k] *= 0.7;
      sim.cur[k] = clamp(sim.cur[k] + (m[k] + sim.dx[k] - sim.cur[k]) * 0.3);
    });
    const p = m.profit * ramp;
    sim.cash += p; sim.cumProfit += p; sim.lastProfit = p;
    const ev = D.events[y - 1];
    sim.pending = { ev, sev: severity(ev, m), why: explain(ev, m) };
    return sim.pending;
  }

  function resolve(s, choiceIdx) {
    const sim = s.sim, pend = sim.pending, ev = pend.ev, ch = ev.choices[choiceIdx];
    const rand = mulberry(sim.seed + sim.year * 101)();
    const diff = C.difficulty[s.difficulty];
    const sev = pend.sev * diff.sev * (0.9 + 0.3 * rand);
    const d = {};
    for (const k in ev.impact) d[k] = ev.impact[k] * sev * (ch.mult == null ? 1 : ch.mult);
    for (const k in ch.extra) d[k] = (d[k] || 0) + ch.extra[k];
    const out = {};
    for (const k in d) {
      const v = Math.round(d[k] * 10) / 10; out[k] = v;
      if (k === "cash") { sim.cash += v; sim.cumProfit += v; }
      else if (KEYS.indexOf(k) >= 0) { sim.dx[k] += v; sim.cur[k] = clamp(sim.cur[k] + v); }
    }
    sim.fx = ev.fx || null;
    const rec = { year: sim.year, event: ev.id, title: ev.title, choice: ch.label, msg: ch.msg, deltas: out, sev: Math.round(sev * 100) / 100 };
    sim.log.push(rec);
    sim.history.push({ year: sim.year, bio: sim.cur.bio, wq: sim.cur.wq, comm: sim.cur.comm, guest: sim.cur.guest, health: sim.cur.health, resil: sim.cur.resil, cash: sim.cash, cumProfit: sim.cumProfit });
    sim.pending = null;
    if (sim.year >= D.events.length) finish(s);
    return rec;
  }

  function grade(x) { return x >= 80 ? "A" : x >= 68 ? "B" : x >= 55 ? "C" : x >= 40 ? "D" : "F"; }

  function finish(s) {
    const sim = s.sim, m = M.compute(s), c = sim.cur;
    const env = 0.4 * c.bio + 0.25 * c.wq + 0.2 * m.fpScore + 0.15 * c.resil;
    const soc = 0.35 * c.comm + 0.25 * c.health + 0.2 * m.empl + 0.2 * m.edu;
    const ratio = m.capex > 0 ? sim.cumProfit / m.capex : 0;
    const econ = clamp(30 + 70 * ratio - m.over * 0.25 + (c.guest - 50) * 0.15);
    const tbl = Math.cbrt(Math.max(0, env) * Math.max(0, soc) * Math.max(0, econ));
    const fin = { bio: c.bio, wq: c.wq, comm: c.comm, health: c.health, resil: c.resil, guest: c.guest, env, soc, econ, tbl, grade: grade(tbl), cumProfit: sim.cumProfit, capex: m.capex, cash: sim.cash };
    fin.achievements = M.ACHIEVEMENTS.filter(a => { try { return a.test(m, s, fin); } catch (e) { return false; } }).map(a => a.id);
    fin.score = Math.round(tbl * 10 + s.kp);
    sim.final = fin; sim.done = true;
    return fin;
  }

  window.Sim = { start, nextYear, resolve, finish, grade };
})();
