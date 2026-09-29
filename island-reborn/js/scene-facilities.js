/* Island Reborn: facility sprites drawn on the canvas. Each variant reflects a decision the team made. */
(function () {
  const rect = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  const circ = (c, x, y, r, f) => { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); };
  const ell = (c, x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill(); };
  const tri = (c, x1, y1, x2, y2, x3, y3, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); };
  const line = (c, x1, y1, x2, y2, col, w) => { c.strokeStyle = col; c.lineWidth = w || 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  const has = (sel, g, id) => (sel[g] || []).indexOf(id) >= 0;
  const list = (sel, g) => sel[g] || [];

  function smoke(c, x, y, t, col, n) {
    for (let i = 0; i < (n || 3); i++) {
      const p = ((t * 0.5 + i / (n || 3)) % 1);
      c.globalAlpha = 0.5 * (1 - p); circ(c, x + Math.sin(p * 6 + i) * 3 + p * 8, y - p * 26, 2.5 + p * 4, col);
    }
    c.globalAlpha = 1;
  }

  const slots = [[-22, 6], [16, 8], [-2, -14], [28, -8]];

  function lodging(c, sel, t, d) {
    const v = list(sel, "lodging"); if (!v.length) return;
    v.forEach((id, i) => {
      const ox = v.length > 1 ? (i ? 26 : -26) : 0;
      c.save(); c.translate(ox, 0); if (v.length > 1) c.scale(0.85, 0.85);
      if (id === "cabins") {
        for (let j = 0; j < 3; j++) {
          const x = (j - 1) * 16, y = (j % 2) * 8 - 2;
          line(c, x - 5, y + 6, x - 5, y + 11, "#6b4a2b", 1.5); line(c, x + 5, y + 6, x + 5, y + 11, "#6b4a2b", 1.5);
          rect(c, x - 7, y - 2, 14, 8, "#c99a5b"); tri(c, x - 9, y - 2, x + 9, y - 2, x, y - 10, "#2f855a"); rect(c, x - 2, y + 1, 4, 5, "#7a5230");
        }
      } else if (id === "treehouse") {
        for (let j = 0; j < 2; j++) {
          const x = (j - 0.5) * 24;
          rect(c, x - 2, -4, 4, 16, "#6b4a2b"); circ(c, x, -8, 11, "rgba(47,125,58,.85)");
          rect(c, x - 6, -10, 12, 7, "#c08a4e"); tri(c, x - 8, -10, x + 8, -10, x, -17, "#8b5e34");
        }
      } else if (id === "reuse") {
        rect(c, -22, -6, 44, 15, "#d8d4c8"); rect(c, -22, -9, 44, 4, "#3f9b5b");
        for (let j = 0; j < 6; j++) rect(c, -18 + j * 7, -2, 4, 4, "#5b7c99");
        rect(c, -22, 9, 44, 2, "rgba(0,0,0,.15)");
      } else if (id === "overwater") {
        line(c, 0, 0, d.x * 48, d.y * 48, "#8b6b45", 3);
        for (let j = 0; j < 3; j++) {
          const px = d.x * (14 + j * 15) + -d.y * (j % 2 ? 9 : -9), py = d.y * (14 + j * 15) + d.x * (j % 2 ? 9 : -9);
          rect(c, px - 6, py - 4, 12, 8, "#e7c98a"); tri(c, px - 8, py - 4, px + 8, py - 4, px, py - 11, "#b98b4a");
        }
      }
      c.restore();
    });
  }

  function energy(c, sel, t, d) {
    const v = list(sel, "energy").filter(id => id !== "efficiency");
    v.forEach((id, i) => {
      const s = slots[i % 4]; c.save(); c.translate(s[0], s[1]);
      if (id === "solar") {
        for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) {
          const x = q * 9 - 10, y = r * 7 - 3;
          c.fillStyle = "#1e40af"; c.beginPath(); c.moveTo(x, y + 5); c.lineTo(x + 3, y); c.lineTo(x + 11, y); c.lineTo(x + 8, y + 5); c.closePath(); c.fill();
          line(c, x + 4, y + 5, x + 6, y, "rgba(147,197,253,.8)", 0.8);
        }
      } else if (id === "wind") {
        line(c, 0, 4, 0, -24, "#e5e7eb", 2);
        const a = t * 2.2;
        for (let b = 0; b < 3; b++) line(c, 0, -24, Math.cos(a + b * 2.094) * 13, -24 + Math.sin(a + b * 2.094) * 13, "#f8fafc", 1.8);
        circ(c, 0, -24, 2, "#94a3b8");
      } else if (id === "biomass") {
        rect(c, -5, -14, 10, 18, "#94a3b8"); ell(c, 0, -14, 5, 3, "#64748b"); rect(c, 7, -6, 8, 10, "#a3b18a"); smoke(c, 0, -16, t, "#d1d5db", 3);
      } else if (id === "diesel") {
        rect(c, -9, -4, 18, 10, "#64748b"); rect(c, 4, -14, 4, 12, "#475569"); smoke(c, 6, -14, t, "#374151", 4);
      } else if (id === "tidal") {
        const x = d.x * 60, y = d.y * 60; c.save(); c.translate(-s[0], -s[1]);
        c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 6 + Math.sin(t * 2) * 2, 0, 6.28); c.stroke();
        circ(c, x, y, 4, "#f59e0b"); circ(c, x, y, 1.5, "#fff"); c.restore();
      }
      c.restore();
    });
  }

  function water(c, sel, t, d) {
    const v = list(sel, "water").filter(id => id !== "fixtures");
    v.forEach((id, i) => {
      const s = slots[i % 4]; c.save(); c.translate(s[0], s[1]);
      if (id === "cistern") {
        for (let j = 0; j < 2; j++) { const x = j * 12 - 6; rect(c, x - 5, -8, 10, 12, "#9fb6c9"); ell(c, x, -8, 5, 2.5, "#c3d3e0"); ell(c, x, 4, 5, 2, "#8199ad"); }
      } else if (id === "ro_solar") {
        rect(c, -10, -8, 22, 12, "#f1f5f9"); rect(c, -10, -10, 22, 3, "#0ea5e9");
        line(c, 12, 0, d.x * 58, d.y * 58, "#38bdf8", 2);
        rect(c, -8, 6, 8, 3, "#1e40af");
      } else if (id === "wells") {
        rect(c, -3, -3, 6, 6, "#9ca3af"); line(c, 0, 0, 10, -8, "#dc2626", 2); circ(c, 10, -8, 2, "#dc2626");
      } else if (id === "greywater") {
        ell(c, 0, 0, 13, 7, "#6fbf73"); ell(c, 0, 0, 9, 4, "#94d6a0");
        for (let j = 0; j < 5; j++) line(c, -8 + j * 4, 1, -8 + j * 4 + Math.sin(t + j) * 1.5, -6, "#2f855a", 1);
      }
      c.restore();
    });
  }

  function food(c, sel, t, d) {
    const v = list(sel, "food").filter(id => id !== "foodwaste");
    v.forEach((id, i) => {
      const s = slots[i % 4]; c.save(); c.translate(s[0], s[1]);
      if (id === "agro") {
        c.fillStyle = "#7a5b34"; c.beginPath(); c.moveTo(-14, 6); c.lineTo(-8, -6); c.lineTo(14, -6); c.lineTo(8, 6); c.closePath(); c.fill();
        for (let j = 0; j < 4; j++) line(c, -12 + j * 4.5, 5, -7 + j * 4.5, -5, "#5cb85c", 1.6);
        circ(c, 14, -8, 4, "#3f8f4a"); circ(c, -14, -6, 3.5, "#4a9c4f");
      } else if (id === "aqua") {
        rect(c, -12, -6, 24, 12, "rgba(186,230,253,.85)"); tri(c, -12, -6, 12, -6, 0, -14, "rgba(186,230,253,.9)");
        for (let j = 0; j < 4; j++) line(c, -12 + j * 8, -6, -12 + j * 8, 6, "rgba(255,255,255,.8)", 1);
        rect(c, -8, 0, 16, 2, "#4ade80");
      } else if (id === "mari") {
        const x = d.x * 52, y = d.y * 52; c.save(); c.translate(-s[0], -s[1]);
        for (let j = 0; j < 3; j++) { rect(c, x - 12 + j * 9, y + Math.sin(t + j) * 1.2, 7, 4, "#9a7b4f"); circ(c, x - 9 + j * 9, y + 2, 1.6, "#f97316"); }
        c.restore();
      } else if (id === "coop") {
        ell(c, 0, 4, 9, 3, "#8b5e34"); tri(c, -9, 4, -12, 0, -6, 2, "#8b5e34"); line(c, 2, 4, 2, -8, "#5b3a1f", 1); tri(c, 2, -8, 2, 2, 10, 2, "#f8fafc");
        line(c, 12, -4, 22, -4, "#8b5e34", 1.5); for (let j = 0; j < 3; j++) ell(c, 14 + j * 3, -1, 1.5, 3, "#cbd5e1");
      } else if (id === "import") {
        rect(c, -10, -2, 8, 6, "#b45309"); rect(c, -2, -2, 8, 6, "#0f766e"); rect(c, -6, -8, 8, 6, "#9a3412");
      }
      c.restore();
    });
  }

  function waste(c, sel, t, d) {
    rect(c, -8, -4, 16, 10, "#a0aec0"); tri(c, -10, -4, 10, -4, 0, -11, "#5b6b7a");
    const v = list(sel, "waste").filter(id => id !== "decon");
    v.forEach((id, i) => {
      const s = slots[(i + 1) % 4]; c.save(); c.translate(s[0] + (s[0] < 0 ? -6 : 6), s[1] + 4);
      if (id === "compost") { ell(c, 0, 0, 9, 6, "#a3b18a"); ell(c, 0, -2, 7, 4, "#b7c69b"); line(c, 6, -3, 12, -8, "#64748b", 1.5); }
      else if (id === "recover") { rect(c, -8, -6, 16, 10, "#65a30d"); c.fillStyle = "#fff"; c.font = "11px sans-serif"; c.textAlign = "center"; c.fillText("♻", 0, 3); }
      else if (id === "wetland_sew") { for (let j = 0; j < 3; j++) ell(c, j * 5 - 5, j * 4 - 3, 10 - j, 4, ["#86efac", "#6fbf73", "#a7f3d0"][j]); }
      else if (id === "wte") { rect(c, -7, -4, 14, 9, "#78716c"); rect(c, 2, -18, 4, 15, "#57534e"); smoke(c, 4, -18, t, "#6b7280", 4); }
      else if (id === "ship") { const x = d.x * 44 - s[0], y = d.y * 44 - s[1]; rect(c, x - 12, y, 24, 6, "#57534e"); rect(c, x - 8, y - 5, 6, 5, "#b91c1c"); rect(c, x, y - 5, 6, 5, "#1d4ed8"); }
      else if (id === "landfill") { ell(c, 0, 2, 14, 7, "#7c5a3a"); ell(c, 0, 0, 10, 4, "#96704a"); for (let j = 0; j < 3; j++) circ(c, -6 + j * 6 + Math.sin(t * 2 + j) * 2, -8 + Math.cos(t + j) * 2, 1, "#f8fafc"); }
      c.restore();
    });
  }

  function transport(c, sel, t, d) {
    line(c, 0, 0, d.x * 58, d.y * 58, "#8b6b45", 4);
    rect(c, -8, -6, 16, 10, "#e2e8f0"); tri(c, -10, -6, 10, -6, 0, -12, "#0B7A75");
    const off = list(sel, "transportOff"), on = list(sel, "transportIsland");
    const a = Math.atan2(d.y, d.x);
    off.forEach((id, i) => {
      const f = ((t * (0.05 + i * 0.012) + i * 0.4) % 1), dist = 62 + Math.abs(Math.sin(f * 3.1416)) * 250 * (id === "seaplane" ? 1.2 : 1);
      const x = d.x * dist, y = d.y * dist;
      c.save(); c.translate(x, y); c.rotate(a);
      if (id === "efferry") { rect(c, -12, -4, 24, 8, "#f8fafc"); rect(c, -12, 1, 24, 2, "#22c55e"); tri(c, 12, -4, 12, 4, 18, 0, "#f8fafc"); rect(c, -4, -7, 8, 3, "#cbd5e1"); }
      else if (id === "sailcargo") { rect(c, -10, -2, 20, 5, "#7c5a3a"); line(c, 0, 3, 0, -14, "#5b3a1f", 1.5); tri(c, 1, -14, 1, 1, 10, 1, "#f8fafc"); tri(c, -1, -12, -1, 1, -8, 1, "#e2e8f0"); }
      else if (id === "seaplane") { c.rotate(-a); c.translate(0, -Math.sin(f * 3.1416) * 18); rect(c, -8, -1.5, 16, 3, "#f8fafc"); rect(c, -1, -8, 3, 16, "#e2e8f0"); rect(c, 6, -3, 3, 6, "#0ea5e9"); }
      c.restore();
      if (id === "jet") {
        c.save(); c.translate(-d.y * 0, 0); const p = (t * 0.06) % 1;
        c.globalAlpha = 0.6; line(c, -d.y * 20 + 0, d.x * 0, -d.y * 20 + d.x * 90 * p, d.y * 0 + d.y * 90 * p, "#fff", 1); c.globalAlpha = 1; c.restore();
        rect(c, -d.y * 46 - 3, d.x * 0 - 45, 6, 90, "#6b7280");
        line(c, -d.y * 46, -40, -d.y * 46, 40, "#f8fafc", 1);
      }
    });
    if (has(sel, "transportIsland", "eshuttle") || has(sel, "transportIsland", "carts")) {
      const r = 26, ang = t * 0.6, x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.5 + 14;
      rect(c, x - 5, y - 3, 10, 6, has(sel, "transportIsland", "eshuttle") ? "#22c55e" : "#e11d48"); circ(c, x - 3, y + 3, 1.5, "#111"); circ(c, x + 3, y + 3, 1.5, "#111");
      if (!has(sel, "transportIsland", "eshuttle")) smoke(c, x - 6, y, t, "#6b7280", 2);
    }
    if (has(sel, "transportIsland", "walkways")) { c.setLineDash([3, 3]); line(c, 0, 8, -30, 22, "#e9d3a5", 3); c.setLineDash([]); }
  }

  function housing(c, sel, t) {
    const v = list(sel, "housing");
    v.forEach((id, i) => {
      const ox = v.length > 1 ? (i ? 22 : -22) : 0; c.save(); c.translate(ox, 0);
      if (id === "village") {
        for (let j = 0; j < 4; j++) { const x = (j % 2) * 15 - 8, y = Math.floor(j / 2) * 12 - 6; line(c, x - 4, y + 4, x - 4, y + 8, "#6b4a2b", 1); line(c, x + 4, y + 4, x + 4, y + 8, "#6b4a2b", 1); rect(c, x - 6, y - 2, 12, 6, "#e7d5b3"); tri(c, x - 8, y - 2, x + 8, y - 2, x, y - 8, "#1e40af"); }
      } else if (id === "adaptive") {
        rect(c, -16, -6, 32, 12, "#cbc5b6"); rect(c, -16, -8, 32, 3, "#4f9d69"); for (let j = 0; j < 5; j++) rect(c, -13 + j * 6, -2, 3, 4, "#5b7c99");
      } else if (id === "mainland") {
        c.setLineDash([2, 3]); c.strokeStyle = "rgba(255,255,255,.8)"; c.strokeRect(-14, -8, 28, 14); c.setLineDash([]);
        c.fillStyle = "#fff"; c.font = "8px sans-serif"; c.textAlign = "center"; c.fillText("staff commute", 0, 2);
      } else if (id === "tents") {
        for (let j = 0; j < 3; j++) { const x = (j - 1) * 13; tri(c, x - 7, 5, x + 7, 5, x, -6, ["#d97706", "#ea580c", "#f59e0b"][j]); }
      }
      c.restore();
    });
  }

  function clinic(c, sel, t) {
    rect(c, -12, -6, 24, 14, "#f8fafc"); rect(c, -12, -8, 24, 3, "#0B7A75"); rect(c, -2, -3, 4, 9, "#dc2626"); rect(c, -5, 0, 10, 3, "#dc2626");
    if (has(sel, "health", "clinic")) { line(c, 12, -6, 18, -14, "#94a3b8", 1.4); ell(c, 18, -15, 4, 2, "#cbd5e1"); }
    if (has(sel, "health", "evac")) { circ(c, -22, 8, 8, "#475569"); c.fillStyle = "#fff"; c.font = "bold 9px sans-serif"; c.textAlign = "center"; c.fillText("H", -22, 11); }
    if (has(sel, "health", "rescue")) { circ(c, 22, 10, 3, "#f97316"); }
  }

  function edu(c, sel, t, d, brand) {
    ell(c, 0, 4, 16, 8, "#e8d5a3"); rect(c, -10, -4, 20, 8, "#f4d7a1");
    tri(c, -14, -4, 14, -4, 0, -16, "#8b5e34");
    line(c, 16, 4, 16, -16, "#475569", 1.2); const w = Math.sin(t * 3) * 1.5;
    c.fillStyle = brand || "#0B7A75"; c.beginPath(); c.moveTo(16, -16); c.lineTo(28, -13 + w); c.lineTo(16, -9); c.closePath(); c.fill();
    for (let j = 0; j < 3; j++) rect(c, -12 + j * 9, 6, 6, 2, "#9a7b4f");
  }

  window.SceneFac = {
    draw(c, fid, sel, t, dir, brand) {
      switch (fid) {
        case "lodging": return lodging(c, sel, t, dir);
        case "energy": return energy(c, sel, t, dir);
        case "water": return water(c, sel, t, dir);
        case "food": return food(c, sel, t, dir);
        case "waste": return waste(c, sel, t, dir);
        case "transport": return transport(c, sel, t, dir);
        case "housing": return housing(c, sel, t);
        case "clinic": return clinic(c, sel, t);
        case "edu": return edu(c, sel, t, dir, brand);
      }
    },
    smoke, rect, circ, ell, tri, line
  };
})();
