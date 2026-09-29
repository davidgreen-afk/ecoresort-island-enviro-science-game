/* Island Reborn: SVG avatar generator. Bust portraits for directors and advisors. */
(function () {
  const SKIN = ["#f6d6b8", "#ebbb93", "#d09a6a", "#a86f47", "#7c4a2d", "#4f2f1d"];
  const HAIR = ["#1d1511", "#4a2e1a", "#8a5a2b", "#c9a25a", "#b23a2a", "#a3a8ad", "#2d5bd4", "#7a3fbf"];
  const OUTFIT = ["#0B7A75", "#F4A825", "#2b6cb0", "#c0392b", "#6b46c1", "#334155", "#2f855a", "#dd6b20"];
  const STYLES = ["short", "long", "curly", "bun", "buzz", "wavy", "puff"];
  const ACCS = ["none", "glasses", "shades", "sunhat", "headset"];
  const BGS = ["#cfe8e4", "#f6e6c4", "#dbe6f3", "#f3dccf", "#e2dcf3", "#d9eadb"];
  let uid = 0;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function hairBack(style, c) {
    switch (style) {
      case "long": return `<path d="M31 58 C26 20 94 20 89 58 L94 108 L26 108 Z" fill="${c}"/>`;
      case "wavy": return `<path d="M31 58 C26 20 94 20 89 58 C92 72 88 84 84 90 C78 82 42 82 36 90 C32 84 28 72 31 58 Z" fill="${c}"/>`;
      case "puff": return `<circle cx="60" cy="42" r="35" fill="${c}"/>`;
      default: return "";
    }
  }
  function hairFront(style, c) {
    switch (style) {
      case "buzz": return `<path d="M36 48 C36 32 48 27 60 27 C72 27 84 32 84 48 C78 41 70 39 60 39 C50 39 42 41 36 48 Z" fill="${c}" opacity=".85"/>`;
      case "curly": return [[38, 43, 10], [48, 31, 11], [60, 27, 12], [72, 31, 11], [82, 43, 10], [35, 55, 8], [85, 55, 8]]
        .map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${c}"/>`).join("");
      case "bun": return `<circle cx="60" cy="16" r="10" fill="${c}"/><path d="M35 50 C33 28 50 21 60 21 C72 21 87 28 85 50 C80 40 70 36 60 36 C50 36 40 40 35 50 Z" fill="${c}"/>`;
      case "puff": return `<path d="M36 50 C37 34 48 30 60 30 C72 30 83 34 84 50 C78 42 70 39 60 39 C50 39 42 42 36 50 Z" fill="${c}"/>`;
      default: return `<path d="M35 52 C32 26 50 19 60 19 C72 19 88 26 85 52 C80 41 70 36 60 36 C50 36 40 41 35 52 Z" fill="${c}"/>`;
    }
  }
  function accessory(kind) {
    switch (kind) {
      case "glasses": return `<g fill="none" stroke="#1f2933" stroke-width="2"><circle cx="51" cy="56" r="7.5"/><circle cx="69" cy="56" r="7.5"/><path d="M58.5 55 H61.5"/></g>`;
      case "shades": return `<g fill="#111827"><rect x="42" y="50" width="16" height="10" rx="4"/><rect x="62" y="50" width="16" height="10" rx="4"/><rect x="57" y="53" width="6" height="2"/></g>`;
      case "sunhat": return `<ellipse cx="60" cy="36" rx="44" ry="9" fill="#e9c46a"/><path d="M40 36 C40 14 80 14 80 36 Z" fill="#f2d68a"/><rect x="40" y="30" width="40" height="5" fill="#0B7A75"/>`;
      case "headset": return `<path d="M34 56 C32 20 88 20 86 56" fill="none" stroke="#1f2933" stroke-width="4"/><rect x="29" y="52" width="9" height="16" rx="4" fill="#1f2933"/><rect x="82" y="52" width="9" height="16" rx="4" fill="#1f2933"/><path d="M86 66 C86 76 78 80 70 79" fill="none" stroke="#1f2933" stroke-width="2.5"/><circle cx="69" cy="79" r="3" fill="#1f2933"/>`;
      default: return "";
    }
  }

  function svg(a, size, opts) {
    a = a || {}; opts = opts || {};
    const id = "av" + (++uid);
    const skin = SKIN[(a.skin || 0) % SKIN.length];
    const skinD = shade(skin, -22);
    const hair = HAIR[(a.hairColor || 0) % HAIR.length];
    const outfit = OUTFIT[(a.outfit || 0) % OUTFIT.length];
    const bg = a.bg || BGS[0];
    const style = a.hairStyle || "short";
    const smile = a.mood === "worried" ? "M53 73 Q60 70 67 73" : "M52 71 Q60 79 68 71";
    const badge = opts.badge ? `<g><circle cx="98" cy="98" r="14" fill="#0D2137" stroke="#fff" stroke-width="2"/><text x="98" y="104" text-anchor="middle" font-size="16">${opts.badge}</text></g>` : "";
    return `<svg class="avatar" viewBox="0 0 120 120" width="${size || 96}" height="${size || 96}" role="img" aria-label="${(opts.label || "Avatar").replace(/"/g, "")}" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="${id}"><circle cx="60" cy="60" r="58"/></clipPath></defs>
<g clip-path="url(#${id})">
<rect width="120" height="120" fill="${bg}"/>
${hairBack(style, hair)}
<path d="M6 124 C8 96 32 88 60 88 C88 88 112 96 114 124 Z" fill="${outfit}"/>
<path d="M48 89 L60 104 L72 89 Z" fill="${skinD}"/>
<rect x="50" y="68" width="20" height="24" rx="8" fill="${skinD}"/>
<circle cx="35" cy="58" r="5" fill="${skin}"/><circle cx="85" cy="58" r="5" fill="${skin}"/>
<ellipse cx="60" cy="54" rx="25" ry="28" fill="${skin}"/>
${hairFront(style, hair)}
<circle cx="51" cy="56" r="2.6" fill="#1a1a1a"/><circle cx="69" cy="56" r="2.6" fill="#1a1a1a"/>
<path d="M45 48 Q51 45 57 48 M63 48 Q69 45 75 48" stroke="${shade(hair, -10)}" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M60 58 Q57 66 61 66" stroke="${skinD}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="${smile}" stroke="#7a2e2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
${accessory(a.acc)}
</g>
<circle cx="60" cy="60" r="58" fill="none" stroke="#0D2137" stroke-width="3"/>
${badge}
</svg>`;
  }

  function random() {
    const r = n => Math.floor(Math.random() * n);
    return { skin: r(SKIN.length), hairStyle: STYLES[r(STYLES.length)], hairColor: r(HAIR.length), outfit: r(OUTFIT.length), acc: ACCS[r(ACCS.length)], bg: BGS[r(BGS.length)] };
  }

  window.Avatars = { SKIN, HAIR, OUTFIT, STYLES, ACCS, BGS, svg, random, shade };
})();
