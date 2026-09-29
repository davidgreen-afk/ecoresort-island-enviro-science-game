/* Island Reborn: exports. A starter pitch webpage for the team, and CSV/JSON for instructors. */
(function () {
  const D = window.DATA, C = window.ECO_CONFIG, M = window.Model, A = window.Avatars;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PALETTES = [
    { name: "Lagoon", c: "#0B7A75" }, { name: "Sunrise", c: "#F4A825" }, { name: "Coral", c: "#E0736A" }, { name: "Deep sea", c: "#2b6cb0" }
  ];

  function vennSVG(env, soc, econ, tbl) {
    const r = v => 48 + Math.max(0, Math.min(100, v)) * 0.42;
    return `<svg viewBox="0 0 360 330" width="100%" role="img" aria-label="Triple bottom line Venn diagram" xmlns="http://www.w3.org/2000/svg" style="max-width:420px">
<circle cx="132" cy="120" r="${r(env)}" fill="#0B7A75" fill-opacity=".5" stroke="#0B7A75" stroke-width="2"/>
<circle cx="228" cy="120" r="${r(soc)}" fill="#F4A825" fill-opacity=".5" stroke="#c98a12" stroke-width="2"/>
<circle cx="180" cy="200" r="${r(econ)}" fill="#2b6cb0" fill-opacity=".45" stroke="#2b6cb0" stroke-width="2"/>
<g font-family="Georgia,serif" text-anchor="middle" fill="#0D2137">
<text x="92" y="88" font-size="13" font-weight="700">Environmental</text><text x="92" y="103" font-size="13" font-weight="700">responsibility</text><text x="92" y="125" font-size="22">${Math.round(env)}</text>
<text x="268" y="88" font-size="13" font-weight="700">Social</text><text x="268" y="103" font-size="13" font-weight="700">well-being</text><text x="268" y="125" font-size="22">${Math.round(soc)}</text>
<text x="180" y="262" font-size="13" font-weight="700">Economic growth</text><text x="180" y="286" font-size="22">${Math.round(econ)}</text>
<text x="180" y="152" font-size="11" font-weight="700">Sustainable</text><text x="180" y="176" font-size="26" font-weight="700">${Math.round(tbl)}</text></g></svg>`;
  }

  function names(s, gid) { return M.selected(s, gid).map(o => o.name); }
  function ul(arr) { return arr.length ? "<ul>" + arr.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>" : "<p><em>None chosen.</em></p>"; }

  function pitchHTML(s, m, shot) {
    const accent = PALETTES[s.palette || 0].c, fin = s.sim && s.sim.final;
    const note = id => (s.reflect[id] || "").trim() ? `<blockquote>${esc(s.reflect[id])}</blockquote>` : "";
    const sp = D.species.find(x => x.id === s.species);
    const dirs = s.team.map(t => `<div class="dir">${A.svg(t.av, 90, { label: t.name })}<b>${esc(t.name)}</b><span>${esc(t.role)}</span><small>${esc((D.majors.find(x => x.id === t.major) || {}).label || "")}</small></div>`).join("");
    const zones = D.zones.map(z => `<li><b>${esc(z.name)}:</b> habitat quality ${Math.round(m.zq[z.id])} of 100, with $${s.invest[z.id]}M invested. ${esc(z.what)}</li>`).join("");
    const niche = sp ? sp.niche.map(n => `<li><b>${esc(D.zones.find(z => z.id === n.zone).short)}:</b> ${esc(n.opts[n.a])}</li>`).join("") : "";
    const pillars = ["ec1", "ec2", "ec3", "ec4"].map(g => `<li><b>${esc(D.pillarNames[D.groupById[g].pillar])}:</b> ${esc(names(s, g).join(", "))}</li>`).join("");
    const heard = Object.keys(s.tips || {}).reduce((acc, k) => acc.concat((s.tips[k] || []).map(x => x)), []);
    const qd = window.NPCS.quests.filter(q => s.quests && s.quests[q.id] && s.quests[q.id].st === "done").map(q => q.title);
    const voices = (heard.length || qd.length) ? `<section><h2>What we heard from the community</h2><p>Our board walked the island and talked with residents before deciding. Here is what we learned.</p><ul>${heard.map(x => "<li>" + esc(x) + "</li>").join("")}</ul>${qd.length ? "<h3>Commitments we followed through on</h3><ul>" + qd.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : ""}</section>` : "";
    const fp = Object.keys(m.fpBy).map(k => `<li>${esc(k)}: ${Math.round(m.fpBy[k] * 10) / 10}</li>`).join("");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.resortName)}</title><style>
:root{--a:${accent};--navy:#0D2137}*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;color:#14212e;line-height:1.6;background:#f6faf9}
header{background:var(--navy);color:#fff;padding:48px 20px;text-align:center;border-bottom:8px solid var(--a)}header h1{font:700 44px Georgia,serif;margin:0}header p{margin:8px 0 0;font-size:18px;color:#cfe3e0}
main{max-width:880px;margin:0 auto;padding:20px}section{background:#fff;border-radius:14px;padding:18px 22px;margin:18px 0;border-left:6px solid var(--a)}
h2{font-family:Georgia,serif;color:var(--navy);margin:0 0 8px}blockquote{margin:10px 0;padding:8px 14px;background:#f1f6f5;border-left:4px solid var(--a);font-style:italic}
.dirs{display:flex;gap:18px;flex-wrap:wrap;justify-content:center}.dir{display:grid;justify-items:center;text-align:center;gap:2px}img{max-width:100%;border-radius:12px}
.stats{display:flex;gap:12px;flex-wrap:wrap}.stats div{background:#eef6f4;border-radius:10px;padding:8px 14px}.stats b{display:block;font:700 22px Georgia,serif}
footer{text-align:center;color:#5a6b78;padding:20px;font-size:13px}</style></head><body>
<header><h1>${esc(s.resortName)}</h1><p>${esc(s.tagline || "A sustainable island resort on " + C.island.name)}</p></header><main>
<section><h2>Our Board of Directors</h2><div class="dirs">${dirs}</div></section>
${shot ? `<section><h2>Our island, ${esc(C.island.name)}</h2><img src="${shot}" alt="Map of the ecoresort"><p>Facilities and habitats as sited by our board. Each placement balances flood risk, habitat protection, and guest experience.</p>${note("map")}</section>` : ""}
<section><h2>Why guests come</h2><div class="stats"><div><b>${s.visitors},000</b>guests a year</div><div><b>${m.jobs}</b>local jobs</div></div><h3>Where guests stay</h3>${ul(names(s, "lodging"))}<h3>What guests do</h3>${ul(names(s, "recreation"))}<h3>How we limit the damage</h3>${ul(names(s, "mitigation"))}${note("concept")}</section>
<section><h2>Water</h2>${ul(names(s, "water"))}${note("water")}<h2>Food</h2>${ul(names(s, "food"))}${note("food")}<h2>Energy</h2><p>${Math.round(m.renewShare * 100)}% renewable.</p>${ul(names(s, "energy"))}${note("energy")}</section>
<section><h2>Waste</h2>${ul(names(s, "waste"))}${note("waste")}</section>
<section><h2>Transportation</h2><h3>On the island</h3>${ul(names(s, "transportIsland"))}<h3>Between the island and other places</h3>${ul(names(s, "transportOff"))}${note("transport")}</section>
<section><h2>Employee housing</h2>${ul(names(s, "housing").concat(names(s, "housingPolicy")))}${note("housing")}</section>
<section><h2>Public health</h2>${ul(names(s, "health"))}${note("health")}</section>
<section><h2>Wildlife areas and corridors</h2><ul>${zones}</ul><h3>Corridors</h3>${ul(names(s, "corridors"))}${note("habitats")}</section>
${sp ? `<section><h2>Our indicator species: ${esc(sp.name)}</h2><p><i>${esc(sp.sci)}</i>. ${esc(sp.blurb)}</p><ul>${niche}</ul>${note("species")}</section>` : ""}
<section><h2>Climate resilience</h2>${ul(names(s, "climate"))}${note("climate")}</section>
<section><h2>Earth Charter learning module</h2><ul>${pillars}</ul>${note("earthcharter")}</section>
<section><h2>Ecological footprint</h2>${ul(names(s, "footprint"))}<ul>${fp}</ul>${note("footprint")}</section>
${voices}<section><h2>The triple bottom line</h2>${vennSVG(fin ? fin.env : m.env, fin ? fin.soc : m.soc, fin ? fin.econ : m.econ, fin ? fin.tbl : m.tbl)}${note("tbl")}</section>
</main><footer>Built in Island Reborn. This page is a starting point. Add your own words, images, and evidence before submitting.</footer></body></html>`;
  }

  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(s, m) {
    const fin = s.sim && s.sim.final, r = n => Math.round(n * 10) / 10;
    const head = ["resort", "conversations", "community_trust", "side_quests_done", "directors", "difficulty", "knowledge_points", "grade", "environment", "social", "economic", "tbl", "biodiversity", "water_quality", "community", "health", "resilience", "footprint_index", "capital_M", "profit_M"];
    const row = [s.resortName, Object.keys(s.talked || {}).length, Math.round(m.trustSum || 0), Object.keys(s.quests || {}).filter(k => s.quests[k].st === "done").length, s.team.map(t => t.name + " (" + t.major + ")").join("; "), s.difficulty, s.kp, fin ? fin.grade : "", r(fin ? fin.env : m.env), r(fin ? fin.soc : m.soc), r(fin ? fin.econ : m.econ), r(fin ? fin.tbl : m.tbl), r(m.bio), r(m.wq), r(m.comm), r(m.health), r(m.resil), r(m.fpIdx), r(m.capex), r(m.profit)];
    D.groups.forEach(g => { head.push(g.id); row.push(names(s, g.id).join("; ")); });
    head.push("species", "restoration_invest"); row.push(s.species || "", D.zones.map(z => z.short + ":" + s.invest[z.id]).join("; "));
    D.phases.forEach(p => { if (p.reflect) { head.push("reflect_" + p.id); row.push(s.reflect[p.id] || ""); } });
    D.civicQuestions.forEach((q, i) => { head.push("civic_" + (i + 1)); row.push((s.civic || {})[i] || ""); });
    head.push("objective_confidence"); row.push((s.objectives || []).join(","));
    return head.map(csvCell).join(",") + "\n" + row.map(csvCell).join(",");
  }

  function download(name, text, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function slug(s) { return (s.resortName || "ecoresort").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ecoresort"; }

  window.Export = { vennSVG, pitchHTML, csv, download, slug, esc, PALETTES };
})();
