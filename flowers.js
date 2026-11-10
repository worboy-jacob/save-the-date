/* Illustrated flowers to match the couple's bouquets:
   cream / blush / peach garden roses, pink ranunculus, pale-yellow gerbera, chamomile daisies,
   light-blue delphinium, pink & peach snapdragons, pink hydrangea, baby's breath,
   eucalyptus, feathery fern and quaking grass.
   Used by the webpage (posy + envelope lining) and the tools that render the email images.
   Everything returns SVG markup strings. Petals are drawn pointing "up" (−y) from 0,0. */
(function (root) {
  "use strict";

  // tip (light) → middle → base (deeper)
  var C = {
    cream:  ["#fffaf0", "#f6e4c6", "#dcbc8c"],
    blush:  ["#ffe8e8", "#f5b9bc", "#de8890"],
    peach:  ["#ffe6d2", "#f9b98f", "#e98a59"],
    pink:   ["#ffe3ee", "#f3a3bf", "#d96690"],
    yellow: ["#fff2bd", "#fbd456", "#e8a92c"],
    blue:   ["#e3eeff", "#93baee", "#5383d1"],
    white:  ["#ffffff", "#fbf9f3", "#e2dccd"],
    leaf:   ["#a8bb86", "#6e8c50", "#465f35"],
    euc:    ["#d9e0c4", "#a9b98c", "#7c9161"],
    lav:    ["#ece6fa", "#b8abe0", "#8a79c4"],
    stem: "#5f7a45", stemDark: "#475f35", grass: "#d3d69e", grassDark: "#959f62", needle: "#6a8650"
  };

  function f(n) { return Math.round(n * 100) / 100; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(11); // shared jitter source; compositions reseed it so output is stable
  function seed(n) { R = rng(n); }
  function j(a) { return (R() * 2 - 1) * a * 1.4; } // jitter (a bit generous, so nothing looks machine-made)
  function at(x, y, rot) { return '<g transform="translate(' + f(x) + " " + f(y) + ")" + (rot ? " rotate(" + f(rot) + ")" : "") + '">'; }

  function defs() {
    var s = "";
    Object.keys(C).forEach(function (k) {
      var c = C[k];
      if (!Array.isArray(c)) return;
      // along each petal: base (y=1) deeper → tip (y=0) light
      s += '<linearGradient id="fp-' + k + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c[2] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient>';
      s += '<radialGradient id="fr-' + k + '" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".6" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient>';
      s += '<radialGradient id="fh-' + k + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + c[2] + '"/><stop offset=".7" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></radialGradient>';
    });
    s += '<radialGradient id="f-disc" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#ffe07a"/><stop offset=".7" stop-color="#f2b937"/><stop offset="1" stop-color="#d9962a"/></radialGradient>';
    s += '<radialGradient id="f-gdisc" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#b08a3c"/><stop offset=".6" stop-color="#7d5f27"/><stop offset="1" stop-color="#5c461d"/></radialGradient>';
    return "<defs>" + s + "</defs>";
  }

  /* ---------------- petal shapes ---------------- */
  // rounded teardrop petal of length l and half-width w, optional notched/ruffled tip
  function petalPath(l, w, ruffle) {
    if (ruffle) {
      return "M0 0 C" + f(w * 1.05) + " " + f(-l * 0.28) + " " + f(w * 1.0) + " " + f(-l * 0.8) + " " + f(w * 0.55) + " " + f(-l * 0.97) +
        " Q" + f(w * 0.25) + " " + f(-l * 1.03) + " 0 " + f(-l * 0.93) + " Q" + f(-w * 0.25) + " " + f(-l * 1.03) + " " + f(-w * 0.55) + " " + f(-l * 0.97) +
        " C" + f(-w * 1.0) + " " + f(-l * 0.8) + " " + f(-w * 1.05) + " " + f(-l * 0.28) + " 0 0Z";
    }
    return "M0 0 C" + f(w * 1.1) + " " + f(-l * 0.3) + " " + f(w * 0.95) + " " + f(-l * 0.92) + " 0 " + f(-l) +
      " C" + f(-w * 0.95) + " " + f(-l * 0.92) + " " + f(-w * 1.1) + " " + f(-l * 0.3) + " 0 0Z";
  }
  function petal(col, l, w, ang, off, ruffle, edge) {
    l *= 1 + j(0.07); w *= 1 + j(0.12); ang += j(4);
    return '<path d="' + petalPath(l, w, ruffle) + '" transform="rotate(' + f(ang) + ")" + (off ? " translate(0 " + f(-off) + ")" : "") +
      '" fill="url(#fp-' + col + ')" stroke="' + (edge || C[col][2]) + '" stroke-opacity=".3" stroke-width="' + f(Math.max(l * 0.018, 0.2)) + '"/>';
  }

  /* ---------------- blooms ---------------- */
  function rose(x, y, r, col, rot) {     // garden rose seen from the side-ish: open cup, curled front petals
    var c = C[col], g = at(x, y, rot), i;
    // outer petals fanning up behind the cup
    for (i = 0; i < 5; i++) g += petal(col, r * (0.85 + R() * 0.25), r * (0.48 + R() * 0.14), -84 + i * 39 + j(10), r * 0.04, true);
    // inside of the cup
    g += '<ellipse cx="' + f(r * 0.06) + '" cy="' + f(-r * 0.26) + '" rx="' + f(r * 0.48) + '" ry="' + f(r * 0.28) + '" transform="rotate(-8 0 ' + f(-r * 0.26) + ')" fill="url(#fh-' + col + ')"/>';
    for (i = 0; i < 4; i++) {
      var rx = r * (0.42 - i * 0.09), ry = rx * 0.55, cy = -r * (0.24 + i * 0.015);
      g += '<path d="M' + f(-rx) + " " + f(cy) + " A" + f(rx) + " " + f(ry) + " 0 0 1 " + f(rx * 0.85) + " " + f(cy - ry * 0.4) + '" fill="none" stroke="' + c[2] + '" stroke-opacity="' + f(0.5 + i * 0.1) + '" stroke-width="' + f(r * 0.035) + '" stroke-linecap="round" transform="rotate(' + f(i * 50 + j(10)) + " 0 " + f(cy) + ')"/>';
    }
    // inner petals along the back rim of the cup
    for (i = 0; i < 3; i++) g += petal(col, r * (0.36 + R() * 0.12), r * 0.3, -50 + i * 48 + j(8), r * 0.12, false);
    // big front petals curling towards us
    g += at(0, -r * 0.18);
    var fr = [-46 + j(6), -2 + j(6), 36 + j(6)];
    for (i = 0; i < 3; i++) g += petal(col, r * (0.74 + R() * 0.2), r * (0.54 + R() * 0.12), 180 + fr[i], 0, true);
    g += "</g>";
    g += '<path d="M' + f(-r * 0.52) + " " + f(-r * 0.12) + " Q" + f(-r * 0.1) + " " + f(r * 0.1) + " " + f(r * 0.5) + " " + f(-r * 0.14) + '" fill="none" stroke="' + c[0] + '" stroke-width="' + f(r * 0.06) + '" stroke-linecap="round" opacity=".85"/>';
    return g + "</g>";
  }
  function ranunculus(x, y, r, col, rot) {
    var g = at(x, y, rot), ring, i;
    for (ring = 0; ring < 4; ring++) {
      var n = 10 - ring, l = r * (1 - ring * 0.22), a0 = ring * 17 + R() * 20;
      for (i = 0; i < n; i++) g += petal(col, l, l * 0.36, a0 + i * 360 / n + j(5), 0, false);
    }
    g += '<circle r="' + f(r * 0.14) + '" fill="#9fb27e"/><circle r="' + f(r * 0.07) + '" fill="#7d935f"/>';
    return g + "</g>";
  }
  function carnPetal(l, w) {
    var d = "M0 0 C" + f(w * 0.9) + " " + f(-l * 0.3) + " " + f(w * 1.05) + " " + f(-l * 0.72) + " " + f(w * 0.9) + " " + f(-l * 0.9), n = 7, i;
    for (i = 1; i <= n; i++) {           // zig-zag frilled edge across the top
      var x = w * 0.9 - (1.8 * w) * i / n, y = -l * (i % 2 ? 1.0 : 0.9);
      d += " L" + f(x) + " " + f(y);
    }
    return d + " C" + f(-w * 1.05) + " " + f(-l * 0.72) + " " + f(-w * 0.9) + " " + f(-l * 0.3) + " 0 0Z";
  }
  function carnation(x, y, r, col, rot) {
    var c = C[col], g = at(x, y, rot), ring, i;
    for (ring = 0; ring < 4; ring++) {
      var n = 9 - ring, l = r * (1 - ring * 0.2), a0 = ring * 23 + R() * 30;
      for (i = 0; i < n; i++) {
        g += '<path d="' + carnPetal(l, l * 0.42) + '" transform="rotate(' + f(a0 + i * 360 / n + j(8)) + ')" fill="url(#fp-' + col + ')" stroke="' + c[2] + '" stroke-opacity=".45" stroke-width="' + f(l * 0.02) + '"/>';
      }
    }
    g += '<circle r="' + f(r * 0.16) + '" fill="url(#fh-' + col + ')"/>';
    return g + "</g>";
  }
  function gardenia(x, y, r, rot) {        // creamy gardenia: broad petals overlapping in a loose pinwheel, glossy leaves behind
    var g = at(x, y, rot), i, ring;
    g += leaf(r * 0.2, r * 0.1, r * 1.5, 128, "leaf") + leaf(-r * 0.2, r * 0.05, r * 1.35, -122, "leaf");
    for (ring = 0; ring < 3; ring++) {
      var n = 6 - ring, l = r * (1 - ring * 0.27), a0 = ring * 26 + R() * 12;
      for (i = 0; i < n; i++) {
        g += '<path d="' + petalPath(l, l * 0.62, false) + '" transform="rotate(' + f(a0 + i * 360 / n + j(5)) + ')" fill="url(#fp-white)" stroke="#d8cfbd" stroke-opacity=".7" stroke-width="' + f(l * 0.025) + '"/>';
      }
    }
    g += '<path d="M' + f(-r * 0.14) + " 0 A" + f(r * 0.14) + " " + f(r * 0.12) + " 0 1 1 " + f(r * 0.1) + " " + f(r * 0.06) + '" fill="none" stroke="#d8cfbd" stroke-width="' + f(r * 0.04) + '" stroke-linecap="round"/>';
    return g + "</g>";
  }
  function anemone(x, y, r, col, rot) {    // wild anemone: broad, softly cupped petals around a dark navy centre
    var g = at(x, y, rot), i, a0 = R() * 30;
    for (i = 0; i < 6; i++) g += petal(col, r * (0.95 + R() * 0.1), r * (0.58 + R() * 0.08), a0 + i * 60 + j(6), r * 0.04, false, "#d8d0c2");
    for (i = 0; i < 5; i++) g += petal(col, r * 0.62, r * 0.45, a0 + 30 + i * 72 + j(8), r * 0.05, false, "#d8d0c2");
    g += '<circle r="' + f(r * 0.3) + '" fill="#e9e3f2" opacity=".5"/>';
    for (i = 0; i < 22; i++) {
      var a = i * 2 * Math.PI / 22 + j(0.05), d = r * (0.27 + R() * 0.06);
      g += '<circle cx="' + f(Math.cos(a) * d) + '" cy="' + f(Math.sin(a) * d) + '" r="' + f(r * 0.03) + '" fill="#2d3550"/>';
    }
    g += '<circle r="' + f(r * 0.2) + '" fill="#2d3550"/><circle cx="' + f(-r * 0.05) + '" cy="' + f(-r * 0.06) + '" r="' + f(r * 0.06) + '" fill="#56607e"/>';
    return g + "</g>";
  }
  /* ---- side-view flowers (they point up, rather than facing the camera) ---- */
  function sidePetal(col, d, edge) {
    return '<path d="' + d + '" fill="url(#fp-' + col + ')" stroke="' + (edge || C[col][2]) + '" stroke-opacity=".55" stroke-width=".8" vector-effect="non-scaling-stroke"/>';
  }
  function tulip(x, y, r, col, rot) {      // white tulip in profile: three pointed, cupped petals
    var g = at(x, y + r * 0.35, rot);
    g += sidePetal(col, "M" + f(-r * 0.05) + " " + f(r * 0.1) + " C" + f(-r * 0.6) + " " + f(-r * 0.1) + " " + f(-r * 0.62) + " " + f(-r * 0.8) + " " + f(-r * 0.18) + " " + f(-r * 1.15) +
      " C" + f(-r * 0.05) + " " + f(-r * 0.8) + " " + f(r * 0.1) + " " + f(-r * 0.5) + " " + f(r * 0.1) + " " + f(-r * 0.2) + "Z");
    g += sidePetal(col, "M" + f(r * 0.05) + " " + f(r * 0.1) + " C" + f(r * 0.62) + " " + f(-r * 0.12) + " " + f(r * 0.66) + " " + f(-r * 0.78) + " " + f(r * 0.24) + " " + f(-r * 1.1) +
      " C" + f(r * 0.1) + " " + f(-r * 0.78) + " " + f(-r * 0.08) + " " + f(-r * 0.5) + " " + f(-r * 0.08) + " " + f(-r * 0.2) + "Z");
    g += sidePetal(col, "M0 " + f(r * 0.14) + " C" + f(-r * 0.46) + " " + f(-r * 0.02) + " " + f(-r * 0.4) + " " + f(-r * 0.7) + " " + f(r * 0.04) + " " + f(-r * 1.02) +
      " C" + f(r * 0.44) + " " + f(-r * 0.68) + " " + f(r * 0.48) + " " + f(-r * 0.02) + " 0 " + f(r * 0.14) + "Z");
    g += '<path d="M' + f(r * 0.02) + " " + f(r * 0.08) + " Q" + f(r * 0.05) + " " + f(-r * 0.5) + " " + f(r * 0.03) + " " + f(-r * 0.92) + '" fill="none" stroke="' + C[col][2] + '" stroke-opacity=".5" stroke-width="' + f(r * 0.025) + '"/>';
    g += '<path d="M' + f(-r * 0.16) + " " + f(r * 0.12) + " Q0 " + f(r * 0.24) + " " + f(r * 0.16) + " " + f(r * 0.12) + " L0 " + f(r * 0.3) + 'Z" fill="' + C.stem + '"/>';
    return g + "</g>";
  }
  function cupAnemone(x, y, r, col, rot) { // anemone seen from the side: petals fan up into a cup, dark centre peeking over the rim
    var g = at(x, y + r * 0.3, rot), i, ang = [-64, -34, -6, 24, 54];
    for (i = 0; i < 5; i++) g += petal(col, r * (0.9 + R() * 0.12), r * (0.5 + R() * 0.08), ang[i] + j(5), 0, false, "#d8d0c2");
    g += '<ellipse cx="0" cy="' + f(-r * 0.5) + '" rx="' + f(r * 0.34) + '" ry="' + f(r * 0.1) + '" fill="#2d3550"/>';
    for (i = 0; i < 9; i++) g += '<circle cx="' + f(-r * 0.3 + i * r * 0.075) + '" cy="' + f(-r * 0.58 - Math.sin(i / 8 * Math.PI) * r * 0.06) + '" r="' + f(r * 0.028) + '" fill="#2d3550"/>';
    var fr = [-28, 2, 30];
    for (i = 0; i < 3; i++) g += petal(col, r * (0.68 + R() * 0.08), r * (0.42 + R() * 0.06), fr[i] + j(4), 0, false, "#d8d0c2");
    g += '<path d="M' + f(-r * 0.12) + " " + f(-r * 0.02) + " Q0 " + f(r * 0.12) + " " + f(r * 0.12) + " " + f(-r * 0.02) + " L0 " + f(r * 0.2) + 'Z" fill="' + C.stem + '"/>';
    return g + "</g>";
  }
  function lisianthus(x, y, r, col, rot) { // lisianthus: a softly ruffled cup opening upward
    var g = at(x, y + r * 0.35, rot), i, ang = [-48, -22, 4, 28, 52];
    for (i = 0; i < 5; i++) g += petal(col, r * (0.95 + R() * 0.1), r * 0.5, ang[i] + j(4), 0, true, "#d8d0c2");
    g += '<ellipse cx="0" cy="' + f(-r * 0.62) + '" rx="' + f(r * 0.3) + '" ry="' + f(r * 0.09) + '" fill="' + C[col][2] + '" opacity=".6"/>';
    var fr = [-24, 6, 32];
    for (i = 0; i < 3; i++) g += petal(col, r * (0.72 + R() * 0.08), r * 0.48, fr[i] + j(4), 0, true, "#d8d0c2");
    g += '<path d="M' + f(-r * 0.12) + " 0 Q0 " + f(r * 0.14) + " " + f(r * 0.12) + " 0 L0 " + f(r * 0.22) + 'Z" fill="' + C.stem + '"/>';
    return g + "</g>";
  }
  function poppySide(x, y, r, col, rot) { // Iceland poppy from the side: broad papery petals in a loose cup, green seed knob
    var g = at(x, y + r * 0.3, rot), i, c = C[col];
    var back = [-38, 36];
    for (i = 0; i < 2; i++) g += petal(col, r * (0.95 + R() * 0.08), r * 0.78, back[i] + j(4), 0, true);
    g += '<ellipse cx="0" cy="' + f(-r * 0.62) + '" rx="' + f(r * 0.16) + '" ry="' + f(r * 0.12) + '" fill="#9fb27e"/>';
    g += '<path d="M' + f(-r * 0.12) + " " + f(-r * 0.66) + " L" + f(r * 0.12) + " " + f(-r * 0.66) + '" stroke="#6f8550" stroke-width="' + f(r * 0.03) + '"/>';
    var front = [-16, 18];
    for (i = 0; i < 2; i++) g += petal(col, r * (0.8 + R() * 0.08), r * 0.74, front[i] + j(4), 0, true);
    for (i = 0; i < 5; i++) {                      // fine veins on the front petals
      var a = (-30 + i * 15) * Math.PI / 180;
      g += '<path d="M0 ' + f(-r * 0.05) + " Q" + f(Math.sin(a) * r * 0.3) + " " + f(-r * 0.4) + " " + f(Math.sin(a) * r * 0.55) + " " + f(-Math.cos(a) * r * 0.72) + '" fill="none" stroke="' + c[2] + '" stroke-opacity=".45" stroke-width="' + f(r * 0.018) + '"/>';
    }
    g += '<path d="M' + f(-r * 0.1) + " " + f(-r * 0.02) + " Q0 " + f(r * 0.1) + " " + f(r * 0.1) + " " + f(-r * 0.02) + " L0 " + f(r * 0.18) + 'Z" fill="' + C.stem + '"/>';
    return g + "</g>";
  }
  function mallow(x, y, r, col, rot) {     // musk mallow: five broad notched petals, fine veins, pale centre
    var g = at(x, y, rot), i, k, c = C[col], a0 = R() * 20;
    for (i = 0; i < 5; i++) {
      var a = a0 + i * 72 + j(5);
      g += petal(col, r * (0.95 + R() * 0.08), r * 0.62, a, 0, true);
      for (k = -1; k <= 1; k++) {
        g += '<path d="M0 0 Q' + f(k * r * 0.12) + " " + f(-r * 0.45) + " " + f(k * r * 0.22) + " " + f(-r * 0.82) + '" transform="rotate(' + f(a) + ')" fill="none" stroke="' + c[2] + '" stroke-opacity=".55" stroke-width="' + f(r * 0.022) + '"/>';
      }
    }
    g += '<circle r="' + f(r * 0.22) + '" fill="#fff6f8" opacity=".9"/>';
    g += '<circle r="' + f(r * 0.1) + '" fill="#f3e9c4"/>';
    for (i = 0; i < 9; i++) { var b = i * 40 * Math.PI / 180; g += '<circle cx="' + f(Math.cos(b) * r * 0.08) + '" cy="' + f(Math.sin(b) * r * 0.08) + '" r="' + f(r * 0.03) + '" fill="#e8d48a"/>'; }
    return g + "</g>";
  }
  function scabiosa(x, y, r, col, rot) {   // pincushion flower: frilly outer petals, domed centre of tiny florets
    var g = at(x, y, rot), i, c = C[col];
    for (i = 0; i < 12; i++) g += petal(col, r * (0.88 + R() * 0.12), r * 0.32, i * 30 + j(6), r * 0.25, true);
    g += '<circle r="' + f(r * 0.42) + '" fill="' + c[1] + '"/>';
    for (i = 0; i < 26; i++) {
      var a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.36;
      g += '<circle cx="' + f(Math.cos(a) * d) + '" cy="' + f(Math.sin(a) * d) + '" r="' + f(r * 0.05) + '" fill="' + (i % 3 ? c[2] : "#ffffff") + '" opacity=".9"/>';
    }
    return g + "</g>";
  }
  function accentFlower(x, y, r) {         // the flower filling the gap left of the sunflower (Flowers.ACCENT)
    var a = root.Flowers && root.Flowers.ACCENT || "scabiosa";
    if (a === "mallow") return tilt(x, y - r * 0.2, 0.85, 30, mallow(x, y - r * 0.2, r * 0.68, "pink", 15));
    if (a === "scabiosa") return tilt(x, y - r * 0.2, 0.85, 30, scabiosa(x, y - r * 0.2, r * 0.66, "pink", 0));
    if (a === "cosmos") return cosmos(x, y - r * 0.2, r * 0.66, "pink", 25);
    if (a === "tulip") return tulip(x, y, r * 0.95, "blush", 18);
    return poppySide(x, y, r, "yellow", 18);
  }
  function centreFlower(x, y, r) {          // which flower sits in the middle of the posy (set Flowers.CENTRE)
    var c = root.Flowers && root.Flowers.CENTRE || "lisianthus";
    if (c === "cup") return cupAnemone(x, y, r, "white", -6);
    if (c === "lisianthus") return lisianthus(x, y, r, "white", 5);
    return tulip(x, y, r, "white", -4);
  }
  function cosmos(x, y, r, col, rot) {     // cosmos: eight broad, notched petals and a small golden centre
    var g = at(x, y, rot), i;
    for (i = 0; i < 8; i++) g += petal(col, r * (0.95 + R() * 0.1), r * 0.36, i * 45 + j(5), r * 0.08, true);
    g += '<circle r="' + f(r * 0.2) + '" fill="url(#f-disc)"/>';
    for (i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      g += '<circle cx="' + f(Math.cos(a) * r * 0.12) + '" cy="' + f(Math.sin(a) * r * 0.12) + '" r="' + f(r * 0.025) + '" fill="#c98a22" opacity=".7"/>';
    }
    return g + "</g>";
  }
  function daisy(x, y, r, rot) {
    var g = at(x, y, rot), n = 20, i;
    for (i = 0; i < n; i++) g += petal("white", r * (0.66 + j(0.06)), r * 0.12, i * 360 / n + j(4), r * 0.2, false, "#d9d2c2");
    g += '<circle r="' + f(r * 0.28) + '" fill="url(#f-disc)"/>';
    for (i = 0; i < 10; i++) {
      var a = i * 36 * Math.PI / 180;
      g += '<circle cx="' + f(Math.cos(a) * r * 0.17) + '" cy="' + f(Math.sin(a) * r * 0.17) + '" r="' + f(r * 0.025) + '" fill="#c98a22" opacity=".6"/>';
    }
    return g + "</g>";
  }
  function gerbera(x, y, r, col, rot) {
    var g = at(x, y, rot), i, n = 26;
    for (i = 0; i < n; i++) g += petal(col, r * (0.72 + j(0.04)), r * 0.11, i * 360 / n + 7 + j(3), r * 0.26, true);
    for (i = 0; i < 20; i++) g += petal(col, r * 0.42, r * 0.08, i * 18 + j(4), r * 0.2, false);
    g += '<circle r="' + f(r * 0.28) + '" fill="url(#f-gdisc)"/>';
    g += '<circle r="' + f(r * 0.2) + '" fill="none" stroke="#e8c45c" stroke-width="' + f(r * 0.04) + '" stroke-dasharray="' + f(r * 0.03) + " " + f(r * 0.04) + '"/>';
    return g + "</g>";
  }
  function floret(x, y, s, col, rot, n) {
    var g = at(x, y, rot), i;
    n = n || 4;
    for (i = 0; i < n; i++) g += petal(col, s * 0.55, s * 0.32, i * 360 / n + j(6), 0, false);
    return g + '<circle r="' + f(s * 0.08) + '" fill="' + C[col][2] + '"/></g>';
  }
  function hydrangea(x, y, r, col) {
    var g = at(x, y), pts = [], i;
    for (i = 0; i < 18; i++) {
      var a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.72;
      pts.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    pts.sort(function (p, q) { return p[1] - q[1]; });
    pts.forEach(function (p, k) { g += floret(p[0], p[1], r * (0.42 + j(0.06)), k % 3 === 0 ? "blush" : col, R() * 90); });
    return g + "</g>";
  }
  function babies(x, y, r) {
    var g = at(x, y), i;
    for (i = 0; i < 7; i++) {
      var a = R() * Math.PI * 2, d = R() * r;
      var px = Math.cos(a) * d, py = Math.sin(a) * d;
      g += '<path d="M0 ' + f(r * 0.6) + " L" + f(px) + " " + f(py) + '" stroke="' + C.stem + '" stroke-width="' + f(r * 0.03) + '" opacity=".7"/>';
      g += floret(px, py, r * (0.32 + R() * 0.1), "white", R() * 72, 5);
    }
    return g + "</g>";
  }

  /* ---------------- stems, spikes & greenery (grow up from 0,0) ---------------- */
  function stem(len, bend, col, w) {
    return '<path d="M0 0 Q' + f(bend) + " " + f(-len * 0.5) + " " + f(bend * 0.4) + " " + f(-len) + '" fill="none" stroke="' + col + '" stroke-width="' + f(w) + '" stroke-linecap="round"/>';
  }
  function stemX(len, bend, t) { var u = 1 - t; return 2 * u * t * bend + t * t * bend * 0.4; } // x on the stem curve at t
  function delphinium(x, y, len, ang) {
    var bend = len * 0.08, g = at(x, y, ang) + stem(len, bend, C.stem, len * 0.018), n = 10, i;
    for (i = n - 1; i >= 0; i--) {
      var t = 0.3 + (i / (n - 1)) * 0.7, s = len * 0.15 * (1 - t * 0.55), sx = stemX(len, bend, t) + (i % 2 ? 1 : -1) * s * 0.3, sy = -len * t;
      if (t > 0.88) { g += at(sx, sy) + petal("blue", s * 0.6, s * 0.22, (i % 2 ? 15 : -15), 0, false) + "</g>"; continue; }
      g += floret(sx, sy, s, "blue", i * 31, 5);
      g += '<circle cx="' + f(sx) + '" cy="' + f(sy) + '" r="' + f(s * 0.1) + '" fill="#ffffff" opacity=".9"/>';
    }
    return g + "</g>";
  }
  function snapdragon(x, y, len, ang, col) {
    var bend = -len * 0.07, g = at(x, y, ang) + stem(len, bend, C.stem, len * 0.02), n = 9, i;
    for (i = n - 1; i >= 0; i--) {
      var t = 0.3 + (i / (n - 1)) * 0.7, s = len * 0.13 * (1 - t * 0.5), side = i % 2 ? 1 : -1, sx = stemX(len, bend, t), sy = -len * t;
      if (t > 0.85) { g += '<ellipse cx="' + f(sx) + '" cy="' + f(sy) + '" rx="' + f(s * 0.22) + '" ry="' + f(s * 0.4) + '" fill="' + C.grass + '" stroke="' + C.grassDark + '" stroke-width="' + f(s * 0.04) + '"/>'; continue; }
      var fg = at(sx, sy, side * 55);
      fg += petal(col, s * 0.9, s * 0.42, -22, 0, true) + petal(col, s * 0.9, s * 0.42, 22, 0, true) + petal(col, s * 0.6, s * 0.38, 180, 0, true);
      g += fg + "</g>";
    }
    return g + "</g>";
  }
  function leafPath(l, w, bend) {
    return "M0 0 C" + f(w * 1.2) + " " + f(-l * 0.22) + " " + f(w * 0.9 + bend) + " " + f(-l * 0.72) + " " + f(bend) + " " + f(-l) +
      " C" + f(-w * 0.55 + bend) + " " + f(-l * 0.75) + " " + f(-w * 1.05) + " " + f(-l * 0.3) + " 0 0Z";
  }
  function leaf(x, y, l, ang, kind) {
    var w = l * 0.24, b = l * 0.1;
    return at(x, y, ang) + '<path d="' + leafPath(l, w, b) + '" fill="url(#fp-' + (kind || "leaf") + ')" stroke="' + C.stemDark + '" stroke-opacity=".25" stroke-width="' + f(l * 0.012) + '"/>' +
      '<path d="M0 ' + f(-l * 0.04) + " Q" + f(b * 0.2) + " " + f(-l * 0.5) + " " + f(b * 0.9) + " " + f(-l * 0.92) + '" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="' + f(l * 0.018) + '"/></g>';
  }
  function eucalyptus(x, y, len, ang) {
    var bend = len * 0.1, g = at(x, y, ang) + stem(len, bend, C.euc[2], len * 0.016), n = 10, i;
    for (i = 0; i < n; i++) {
      var t = 0.1 + i / n * 0.9, r = len * 0.07 * (1 - t * 0.45), side = i % 2 ? 1 : -1, sx = stemX(len, bend, t) + side * r * 0.85, sy = -len * t;
      g += '<ellipse cx="' + f(sx) + '" cy="' + f(sy) + '" rx="' + f(r) + '" ry="' + f(r * (0.82 + j(0.08))) + '" transform="rotate(' + f(side * 20 + j(15)) + " " + f(sx) + " " + f(sy) + ')" fill="url(#fr-euc)" stroke="' + C.euc[2] + '" stroke-opacity=".45" stroke-width="' + f(r * 0.06) + '"/>';
    }
    return g + "</g>";
  }
  function fern(x, y, len, ang) {   // feathery asparagus-fern
    var bend = -len * 0.08, g = at(x, y, ang) + stem(len, bend, C.stemDark, len * 0.01), n = 14, i, k;
    for (i = 0; i < n; i++) {
      var t = 0.12 + i / n * 0.86, sx = stemX(len, bend, t), sy = -len * t, l = len * 0.1 * (1 - t * 0.6);
      for (k = -2; k <= 2; k++) {
        if (!k) continue;
        var a = (k < 0 ? -1 : 1) * (35 + Math.abs(k) * 18) * Math.PI / 180;
        g += '<path d="M' + f(sx) + " " + f(sy) + " l" + f(Math.sin(a) * l) + " " + f(-Math.cos(a) * l) + '" stroke="' + C.needle + '" stroke-width="' + f(len * 0.006) + '" stroke-linecap="round"/>';
      }
    }
    return g + "</g>";
  }
  function grass(x, y, len, ang) {   // quaking grass
    var bend = len * 0.18, g = at(x, y, ang) + stem(len, bend, C.grassDark, len * 0.008), i;
    for (i = 0; i < 4; i++) {
      var t = 0.68 + i * 0.09, sx = stemX(len, bend, t), sy = -len * t, side = i % 2 ? 1 : -1;
      var hx = sx + side * len * 0.05, hy = sy + len * 0.03;
      g += '<path d="M' + f(sx) + " " + f(sy) + " Q" + f(hx) + " " + f(sy - len * 0.02) + " " + f(hx) + " " + f(hy) + '" fill="none" stroke="' + C.grassDark + '" stroke-width="' + f(len * 0.006) + '"/>';
      g += '<path d="' + petalPath(len * 0.08, len * 0.028, false) + '" transform="translate(' + f(hx) + " " + f(hy + len * 0.075) + ') rotate(180)" fill="' + C.grass + '" stroke="' + C.grassDark + '" stroke-width="' + f(len * 0.005) + '"/>';
    }
    return g + "</g>";
  }

  /* ---------------- wildflower extras ---------------- */
  function curvyStem(len, bend, w, col) {   // S-curved, thinner stem
    return '<path d="M0 0 C' + f(bend) + " " + f(-len * 0.35) + " " + f(-bend * 0.6) + " " + f(-len * 0.7) + " " + f(bend * 0.3) + " " + f(-len) +
      '" fill="none" stroke="' + (col || C.stem) + '" stroke-width="' + f(w) + '" stroke-linecap="round"/>';
  }
  function blade(x, y, len, ang, bend) {    // long thin grass blade
    var w = len * 0.035;
    return at(x, y, ang) + '<path d="M' + f(-w) + " 0 C" + f(-w + bend * 0.3) + " " + f(-len * 0.4) + " " + f(bend * 0.8) + " " + f(-len * 0.75) + " " + f(bend) + " " + f(-len) +
      " C" + f(bend * 0.8 + w * 0.6) + " " + f(-len * 0.72) + " " + f(w + bend * 0.25) + " " + f(-len * 0.4) + " " + f(w) + ' 0Z" fill="url(#fp-leaf)"/></g>';
  }
  function queenAnne(x, y, len, ang) {      // Queen Anne's lace: a lacy white umbel on a tall stem
    var bend = len * 0.06, g = at(x, y, ang) + curvyStem(len, bend, len * 0.012), tx = bend * 0.3, ty = -len, i, k;
    var rays = 9, r = len * 0.2;
    for (i = 0; i < rays; i++) {
      var a = (-70 + i * 140 / (rays - 1) + j(5)) * Math.PI / 180, d = r * (0.75 + R() * 0.3);
      var ex = tx + Math.sin(a) * d, ey = ty - Math.cos(a) * d * 0.45 - r * 0.15;
      g += '<path d="M' + f(tx) + " " + f(ty + r * 0.25) + " L" + f(ex) + " " + f(ey) + '" stroke="' + C.stem + '" stroke-width="' + f(len * 0.004) + '"/>';
      for (k = 0; k < 7; k++) {
        var aa = R() * Math.PI * 2, dd = R() * r * 0.16;
        g += '<circle cx="' + f(ex + Math.cos(aa) * dd) + '" cy="' + f(ey + Math.sin(aa) * dd * 0.6) + '" r="' + f(len * (0.011 + R() * 0.006)) + '" fill="#ffffff" stroke="#e3dccb" stroke-width="' + f(len * 0.002) + '"/>';
      }
    }
    return g + "</g>";
  }
  function lavender(x, y, len, ang) {        // lavender / mint spike
    var bend = len * 0.1, g = at(x, y, ang) + curvyStem(len, bend, len * 0.012, C.stemDark), i, n = 16;
    for (i = 0; i < n; i++) {
      var t = 0.55 + i / n * 0.45, sx = bend * 0.3 * t + j(len * 0.012), sy = -len * t, s = len * 0.045 * (1 - (t - 0.55) * 0.9);
      g += '<ellipse cx="' + f(sx + (i % 2 ? s * 0.5 : -s * 0.5)) + '" cy="' + f(sy) + '" rx="' + f(s * 0.55) + '" ry="' + f(s * 0.8) + '" transform="rotate(' + (i % 2 ? 25 : -25) + " " + f(sx) + " " + f(sy) + ')" fill="url(#fr-lav)"/>';
    }
    return g + "</g>";
  }
  function chamomile(x, y, len, ang, flip) { // branching stem of little daisies and buds
    var bend = len * 0.08 * (flip ? -1 : 1), g = at(x, y, ang) + curvyStem(len, bend, len * 0.011), tips = [[bend * 0.3, -len, 0.075]], i;
    var br = [[0.55, 1, 0.42, 0.06], [0.7, -1, 0.3, 0.05], [0.4, -1, 0.35, 0.04]];
    br.forEach(function (b) {
      var sx = bend * 0.2, sy = -len * b[0], ex = sx + b[1] * len * b[2] * 0.6, ey = sy - len * b[2] * 0.8;
      g += '<path d="M' + f(sx) + " " + f(sy) + " Q" + f(sx + b[1] * len * 0.05) + " " + f(ey + len * 0.08) + " " + f(ex) + " " + f(ey) + '" fill="none" stroke="' + C.stem + '" stroke-width="' + f(len * 0.008) + '"/>';
      tips.push([ex, ey, b[3]]);
    });
    tips.forEach(function (tp, k) {
      if (k === 3) g += '<circle cx="' + f(tp[0]) + '" cy="' + f(tp[1]) + '" r="' + f(len * 0.022) + '" fill="url(#f-disc)"/>';   // a bud
      else g += tilt(tp[0], tp[1], 0.45 + R() * 0.4, R() * 180, daisy(tp[0], tp[1], len * tp[2] * 1.6, R() * 60));
    });
    return g + "</g>";
  }
  function wheat(x, y, len, ang) {           // wispy seed head
    var bend = len * 0.12, g = at(x, y, ang) + curvyStem(len, bend, len * 0.007, C.grassDark), i;
    for (i = 0; i < 9; i++) {
      var t = 0.74 + i * 0.03, sx = bend * 0.3 * t, sy = -len * t;
      g += '<ellipse cx="' + f(sx + (i % 2 ? 1 : -1) * len * 0.012) + '" cy="' + f(sy) + '" rx="' + f(len * 0.011) + '" ry="' + f(len * 0.026) + '" transform="rotate(' + (i % 2 ? 22 : -22) + " " + f(sx) + " " + f(sy) + ')" fill="' + C.grass + '" stroke="' + C.grassDark + '" stroke-width="' + f(len * 0.003) + '"/>';
    }
    return g + "</g>";
  }

  /* view a bloom at an angle: squash it to k along the axis at angle a (about its own centre) */
  function tilt(x, y, k, a, inner) {
    return '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + f(a) + ") scale(1 " + f(k) + ") rotate(" + f(-a) + ") translate(" + f(-x) + " " + f(-y) + ')">' + inner + "</g>";
  }

  /* ---------------- motion wrappers ----------------
     fl-sway: rotates about the posy's tie point (0,0) — the whole stem bending.
     fl-nod:  rotates a flower head about its own centre — the bloom bobbing.  */
  function sway(inner, amp, ph) { return '<g class="fl-sway" data-a="' + amp + '" data-p="' + f(ph) + '">' + inner + "</g>"; }
  function nod(x, y, inner, amp, ph) { return '<g class="fl-nod" data-x="' + f(x) + '" data-y="' + f(y) + '" data-a="' + amp + '" data-p="' + f(ph) + '">' + inner + "</g>"; }
  function bloomStem(x, y, w) { return '<path d="M0 0 Q' + f(x * 0.3) + " " + f(y * 0.6) + " " + f(x) + " " + f(y) + '" fill="none" stroke="' + C.stem + '" stroke-width="' + f(w) + '" stroke-linecap="round"/>'; }

  /* A loose, hand-gathered wildflower posy; stems meet at (0,0) where the wax seal sits.
     Deliberately lopsided: it leans right, stems are all different lengths, nothing is mirrored. */
  function posy(S) {
    seed(17);
    var s = "", k = 0;
    function piece(inner, amp) { k++; return sway(inner, amp, (k * 0.37) % 1); }
    function bloom(fn, x, y, amp) { // a flower on its own little stem, with a nodding head
      return piece(bloomStem(x, y, S * 0.01) + nod(x, y, fn(x, y), 3, (k * 0.29) % 1), amp);
    }
    // wispy back layer
    s += piece(blade(0, 0, S * 0.89, -38, S * 0.12), 3.4) + piece(blade(0, 0, S * 1.10, 16, -S * 0.1), 3.8);
    s += piece(blade(0, 0, S * 0.68, 58, S * 0.14), 3.2) + piece(blade(0, 0, S * 0.59, -70, -S * 0.08), 2.8);
    s += piece(grass(0, 0, S * 1.15, 36), 4.4) + piece(wheat(0, 0, S * 0.98, -24), 4.2) + piece(wheat(0, 0, S * 0.81, 66), 3.8);
    s += piece(queenAnne(0, 0, S * 1.00, 24), 2.8) + piece(queenAnne(0, 0, S * 0.70, -58), 2.6);
    s += piece(lavender(0, 0, S * 0.92, -30), 2.8) + piece(lavender(0, 0, S * 0.73, 44), 3);
    s += piece(delphinium(0, 0, S * 1.19, 6), 2.4) + piece(delphinium(0, 0, S * 0.66, -50), 2.6);
    s += piece(snapdragon(0, 0, S * 0.85, -16, "pink"), 2.4) + piece(snapdragon(0, 0, S * 0.68, 70, "peach"), 2.6);
    s += piece(fern(0, 0, S * 0.68, -78), 3.2);
    s += piece(chamomile(0, 0, S * 0.85, -44, false), 3) + piece(chamomile(0, 0, S * 0.94, 50, true), 3.2) + piece(chamomile(0, 0, S * 0.59, 80, false), 2.8);
    // tied stems below the seal
    var st = "";
    for (var i = 0; i < 11; i++) st += '<path d="M' + f(-S * 0.05 + i * S * 0.01) + " " + f(S * 0.05) + " Q" + f(S * (0.0 + i * 0.012)) + " " + f(S * 0.3) + " " + f(S * (-0.06 + i * 0.03 + j(0.01))) + " " + f(S * (0.48 + (i % 4) * 0.035)) + '" fill="none" stroke="' + (i % 3 ? C.stem : C.stemDark) + '" stroke-width="' + f(S * 0.016) + '" stroke-linecap="round"/>';
    s += sway(st + leaf(0, S * 0.04, S * 0.32, 148) + blade(0, S * 0.04, S * 0.4, -150, S * 0.05), 0.6, 0.1);
    // blooms, loosely clustered and off-centre
    s += bloom(function (x, y) { return tilt(x, y, 0.8, 20, hydrangea(x, y, S * 0.15, "pink")); }, -S * 0.40, -S * 0.42, 1.4);
    s += bloom(function (x, y) { return tilt(x, y, 0.5, 35, gerbera(x, y, S * 0.14, "yellow", 25)); }, S * 0.49, -S * 0.51, 1.8);
    s += bloom(function (x, y) { return tilt(x, y, 0.55, -30, daisy(x, y, S * 0.1, 10)); }, -S * 0.58, -S * 0.14, 2.2);
    s += bloom(function (x, y) { return tilt(x, y, 0.7, 60, daisy(x, y, S * 0.085, 40)); }, S * 0.16, -S * 0.77, 2.4);
    s += bloom(function (x, y) { return tilt(x, y, 0.45, -70, daisy(x, y, S * 0.085, 0)); }, S * 0.62, -S * 0.19, 2.2);
    s += piece(babies(S * 0.36, -S * 0.78, S * 0.12) + babies(-S * 0.3, -S * 0.72, S * 0.1) + babies(-S * 0.62, -S * 0.42, S * 0.08), 2.6);
    s += bloom(function (x, y) { return cosmos(x, y, S * 0.1, "pink", 10); }, -S * 0.09, -S * 0.68, 1.6);
    s += bloom(function (x, y) { return hydrangea(x, y, S * 0.16, "blue"); }, -S * 0.27, -S * 0.27, 1);
    s += bloom(function (x, y) { return gardenia(x, y, S * 0.14, 20); }, S * 0.4, -S * 0.27, 1.1);
    s += bloom(function (x, y) { return tilt(x, y, 0.62, -60, daisy(x, y, S * 0.085, 15)); }, -S * 0.5, -S * 0.66, 2.2);
    s += bloom(function (x, y) { return cosmos(x, y, S * 0.09, "peach", 25); }, S * 0.56, -S * 0.2, 1.6);
    // a few extra small blooms to fill the gaps
    s += bloom(function (x, y) { return tilt(x, y, 0.7, 30, daisy(x, y, S * 0.075, 20)); }, S * 0.27, -S * 0.64, 2.2);
    s += bloom(function (x, y) { return hydrangea(x, y, S * 0.1, "blue"); }, -S * 0.47, -S * 0.25, 1.4);
    s += bloom(function (x, y) { return cosmos(x, y, S * 0.07, "peach", -10); }, S * 0.48, -S * 0.07, 1.8);
    s += piece(babies(S * 0.12, -S * 0.78, S * 0.08), 2.4);
    // a soft side-on accent flower in the gap just left of the sunflower
    s += bloom(function (x, y) { return accentFlower(x, y, S * 0.17); }, S * 0.32, -S * 0.6, 1.2);
    // the centre flower: side-on and pointing up (see centreFlower)
    s += bloom(function (x, y) { return centreFlower(x, y, S * 0.22); }, S * 0.0, -S * 0.52, 0.9);
    return s;
  }
  function posySVG(S, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + f(-1.3 * S) + " " + f(-1.45 * S) + " " + f(2.6 * S) + " " + f(2.15 * S) + '" ' + (extra || "") + ">" + defs() + posy(S) + "</svg>";
  }

  /* A low, loose horizontal spray for the email: wild bits trailing out unevenly to each side. */
  function spray(S, opts) {
    seed(opts && opts.seed || 5);
    var s = "";
    s += blade(0, 0, S * 0.77, -78, S * 0.1) + blade(0, 0, S * 0.63, 84, -S * 0.12) + blade(0, 0, S * 0.49, -104, -S * 0.08);
    s += grass(0, 0, S * 0.70, 70) + wheat(0, 0, S * 0.66, -66) + wheat(0, 0, S * 0.49, 98);
    s += queenAnne(0, 0, S * 0.59, -58) + queenAnne(0, 0, S * 0.49, 62);
    s += lavender(0, 0, S * 0.63, -84) + lavender(0, 0, S * 0.52, 76);
    s += delphinium(0, 0, S * 0.73, 80) + delphinium(0, 0, S * 0.52, -96);
    s += snapdragon(0, S * 0.03, S * 0.52, -112, "pink") + snapdragon(0, S * 0.03, S * 0.42, 108, "peach");
    s += chamomile(0, 0, S * 0.56, -70, false) + chamomile(0, 0, S * 0.59, 64, true);
    s += fern(0, 0, S * 0.49, 96) + fern(0, 0, S * 0.52, -92);
    s += tilt(-S * 0.3, -S * 0.02, 0.8, 20, hydrangea(-S * 0.3, -S * 0.02, S * 0.12, "pink")) + tilt(S * 0.36, -S * 0.06, 0.5, 40, gerbera(S * 0.36, -S * 0.06, S * 0.11, "yellow", 10));
    s += tilt(-S * 0.5, S * 0.04, 0.5, -30, daisy(-S * 0.5, S * 0.04, S * 0.065, 0)) + tilt(S * 0.52, S * 0.02, 0.6, 60, daisy(S * 0.52, S * 0.02, S * 0.06, 20)) + tilt(-S * 0.1, -S * 0.2, 0.45, -70, daisy(-S * 0.1, -S * 0.2, S * 0.055, 0));
    s += babies(S * 0.18, -S * 0.17, S * 0.08) + babies(-S * 0.42, -S * 0.12, S * 0.07);
    // extra blooms packed into the middle (denser, shorter spray)
    s += tilt(-S * 0.34, -S * 0.14, 0.55, -40, daisy(-S * 0.34, -S * 0.14, S * 0.06, 10)) + tilt(S * 0.3, -S * 0.17, 0.6, 50, daisy(S * 0.3, -S * 0.17, S * 0.06, 30));
    s += tilt(S * 0.44, S * 0.06, 0.5, -20, daisy(S * 0.44, S * 0.06, S * 0.055, 0)) + tilt(-S * 0.44, S * 0.08, 0.6, 70, daisy(-S * 0.44, S * 0.08, S * 0.055, 0));
    s += tilt(-S * 0.24, -S * 0.08, 0.7, 20, rose(-S * 0.24, -S * 0.08, S * 0.08, "blush", -40)) + tilt(S * 0.12, -S * 0.12, 0.6, -30, ranunculus(S * 0.12, -S * 0.12, S * 0.07, "pink", 0));
    s += tilt(S * 0.26, S * 0.08, 0.7, 30, rose(S * 0.26, S * 0.08, S * 0.08, "peach", 35)) + babies(-S * 0.05, -S * 0.15, S * 0.06) + babies(S * 0.36, -S * 0.08, S * 0.06);
    s += tilt(-S * 0.17, S * 0.04, 0.62, 30, ranunculus(-S * 0.17, S * 0.04, S * 0.11, "pink", -20)) + tilt(S * 0.2, S * 0.05, 0.7, -35, carnation(S * 0.2, S * 0.05, S * 0.1, "peach", 30)) + rose(0, -S * 0.03, S * 0.14, "cream", -6);
    return s;
  }

  /* A sheer chiffon ribbon bow (loops + tails + knot), drawn around (0,0). u = size unit. */
  /* Sheer chiffon bow around (0,0); u = size unit. Styles (Flowers.BOW):
     "round"   - the earlier full, rounded loops
     "classic" - tapered loops pinched at the knot, long slender tails
     "slim"    - narrower loops lifting slightly upward, extra-long fine tails
     "soft"    - fuller tapered loops, shorter tails */
  function bowSVG(u, id) {
    var style = root.Flowers && root.Flowers.BOW || "ribbon";
    var g = '<g class="bow">';
    var fill = 'fill="url(#' + id + ')" stroke="#ffffff" stroke-opacity=".9" stroke-width="' + f(u * 0.035) + '"';
    var fold = 'fill="none" stroke="#e6e0d4" stroke-opacity=".85" stroke-width="' + f(u * 0.035) + '" stroke-linecap="round"';
    function P(x, y) { return f(x * u) + " " + f(y * u); }

    if (style === "round") {
      g += '<path class="loop-l" ' + fill + ' d="M0 ' + f(-u * 0.25) + ' C' + P(-1.0, -1.95) + " " + P(-2.85, -1.75) + " " + P(-2.6, -0.05) + " C" + P(-2.4, 1.35) + " " + P(-0.9, 0.95) + " " + P(0, 0.25) + 'Z"/>';
      g += '<path class="loop-r" ' + fill + ' d="M0 ' + f(-u * 0.25) + ' C' + P(1.05, -2.0) + " " + P(2.95, -1.7) + " " + P(2.7, 0.02) + " C" + P(2.45, 1.4) + " " + P(0.95, 1.0) + " " + P(0, 0.25) + 'Z"/>';
      g += '<path ' + fold + ' d="M' + P(-0.35, -0.2) + " Q" + P(-1.5, -1.1) + " " + P(-2.35, -0.4) + '"/><path ' + fold + ' d="M' + P(0.35, -0.2) + " Q" + P(1.6, -1.15) + " " + P(2.45, -0.35) + '"/>';
      g += tailPath("tail-l", -1, 3.5, 1.0, 30, 0) + tailPath("tail-r", 1, 3.7, 1.0, 30, 0);
      g += '<ellipse rx="' + f(u * 0.55) + '" ry="' + f(u * 0.5) + '" fill="url(#' + id + ')" stroke="#ffffff" stroke-width="' + f(u * 0.05) + '"/>';
      return g + "</g>";
    }

    if (style === "ribbon") return ribbonBow();

    var cfg = {
      classic: { L: 3.3, W: 0.95, lift: 0.4,  tl: 3.7, tw: 0.68, ta: 22, bend: 0.35 },
      slim:    { L: 3.6, W: 0.72, lift: 0.7,  tl: 4.0, tw: 0.55, ta: 18, bend: 0.45 },
      soft:    { L: 3.1, W: 1.2,  lift: 0.25, tl: 3.6, tw: 0.8,  ta: 26, bend: 0.25 }
    }[style] || {};
    // loop: a teardrop pinched into the knot, rounded at its outer end
    function loop(cls, side) {
      var L = cfg.L * (side > 0 ? 1.04 : 1), W = cfg.W, lift = cfg.lift, k = 0.16;
      var d = "M" + P(0, -k) +
        " C" + P(side * L * 0.32, -k - W * 1.05) + " " + P(side * L * 0.92, -lift - W * 0.95) + " " + P(side * L, -lift) +
        " C" + P(side * L * 1.06, -lift + W * 0.55) + " " + P(side * L * 0.4, k + W * 0.5) + " " + P(0, k) + "Z";
      var inner = "M" + P(side * 0.25, -k * 0.4) +
        " C" + P(side * L * 0.4, -W * 0.55) + " " + P(side * L * 0.8, -lift - W * 0.45) + " " + P(side * L * 0.86, -lift + W * 0.05) +
        " C" + P(side * L * 0.6, -lift * 0.3 + W * 0.15) + " " + P(side * L * 0.3, W * 0.12) + " " + P(side * 0.25, k * 0.4) + "Z";
      return '<g class="' + cls + '"><path ' + fill + ' d="' + d + '"/>' +
        '<path d="' + inner + '" fill="#efe9de" fill-opacity=".55"/>' +
        '<path ' + fold + ' d="M' + P(side * 0.3, -k) + " Q" + P(side * L * 0.55, -W * 0.85 - lift * 0.4) + " " + P(side * L * 0.93, -lift - W * 0.35) + '"/></g>';
    }
    g += loop("loop-l", -1) + loop("loop-r", 1);
    g += tailPath("tail-l", -1, cfg.tl, cfg.tw, cfg.ta, cfg.bend) + tailPath("tail-r", 1, cfg.tl * 1.08, cfg.tw, cfg.ta - 6, cfg.bend);
    // slim knot with a crease
    g += '<ellipse rx="' + f(u * 0.36) + '" ry="' + f(u * 0.46) + '" fill="url(#' + id + ')" stroke="#ffffff" stroke-width="' + f(u * 0.04) + '"/>';
    g += '<path ' + fold + ' d="M' + P(-0.12, -0.32) + " Q" + P(0.06, 0) + " " + P(-0.08, 0.32) + '"/>';
    return g + "</g>";

    /* A real tied ribbon bow: each loop is a band of ribbon folded at its outer end, so you see its top
       surface, the fold, and the darker inside of the loop through the opening; a small gathered knot;
       flat tails with a slight twist and notched ends. Drawn for the left side, mirrored for the right. */
    function ribbonBow() {
      var back = 'fill="#ece4d6" fill-opacity=".85" stroke="#ffffff" stroke-opacity=".7" stroke-width="' + f(u * 0.03) + '"';
      var shade = 'fill="#e2d9c8" fill-opacity=".6"';
      function M(side, pts) {                                  // mirror an [x,y,...] list and format as path coords
        var out = [];
        for (var i = 0; i < pts.length; i += 2) out.push(P(pts[i] * side, pts[i + 1]));
        return out;
      }
      function loopB(cls, side, k) {                            // k: per-side size tweak
        var q = function (a) { return a.map(function (v, i) { return i % 2 ? v * (0.96 + (k - 1) * 0.5) : v * k; }); };
        var whole = M(side, q([-0.3, -0.28, -1.0, -1.05, -2.0, -1.5, -2.72, -1.28, -3.08, -1.05, -3.18, 0.05, -2.9, 0.42, -2.2, 0.78, -1.0, 0.58, -0.3, 0.3]));
        var top = M(side, q([-0.3, -0.28, -1.0, -1.05, -2.0, -1.5, -2.72, -1.28, -2.98, -1.12, -3.08, -0.72, -2.96, -0.36, -2.2, -0.48, -1.0, -0.26, -0.3, 0.06]));
        var bot = M(side, q([-0.3, 0.12, -1.0, 0.14, -2.1, 0.04, -2.86, -0.04, -3.08, 0.12, -3.02, 0.34, -2.9, 0.42, -2.2, 0.78, -1.0, 0.58, -0.3, 0.3]));
        var g2 = '<g class="' + cls + '"><g transform="rotate(' + (side * 9) + ') scale(1 0.9)">';
        g2 += '<path ' + back + ' d="M' + whole[0] + " C" + whole[1] + " " + whole[2] + " " + whole[3] + " C" + whole[4] + " " + whole[5] + " " + whole[6] + " C" + whole[7] + " " + whole[8] + " " + whole[9] + 'Z"/>';
        g2 += '<path ' + fill + ' d="M' + bot[0] + " C" + bot[1] + " " + bot[2] + " " + bot[3] + " C" + bot[4] + " " + bot[5] + " " + bot[6] + " C" + bot[7] + " " + bot[8] + " " + bot[9] + 'Z"/>';
        g2 += '<path ' + fill + ' d="M' + top[0] + " C" + top[1] + " " + top[2] + " " + top[3] + " C" + top[4] + " " + top[5] + " " + top[6] + " C" + top[7] + " " + top[8] + " " + top[9] + 'Z"/>';
        // fold at the outer end and soft gathers running into the knot
        var fl = M(side, q([-2.74, -1.2, -3.02, -0.95, -2.98, -0.42]));
        g2 += '<path ' + fold + ' d="M' + fl[0] + " Q" + fl[1] + " " + fl[2] + '"/>';
        var g1 = M(side, q([-0.4, -0.12, -1.3, -0.6, -2.3, -0.82])), g3 = M(side, q([-0.4, 0.0, -1.3, -0.35, -2.4, -0.55])), g4 = M(side, q([-0.4, 0.4, -1.2, 0.5, -2.2, 0.55]));
        g2 += '<path ' + fold + ' d="M' + g1[0] + " Q" + g1[1] + " " + g1[2] + '"/><path ' + fold + ' d="M' + g3[0] + " Q" + g3[1] + " " + g3[2] + '"/><path ' + fold + ' d="M' + g4[0] + " Q" + g4[1] + " " + g4[2] + '"/>';
        return g2 + "</g></g>";
      }
      function tailB(cls, side, len, angDeg) {                   // flat ribbon tail, gentle curve, twist, notched end
        var a = angDeg * Math.PI / 180, w = 0.74;
        var c = [[0.05 * side, 0.3], [side * (Math.sin(a) * len * 0.3 + 0.15), Math.cos(a) * len * 0.33],
                 [side * (Math.sin(a) * len * 0.62 - 0.1), Math.cos(a) * len * 0.66], [side * Math.sin(a) * len, Math.cos(a) * len]];
        function bez(t) {
          var m = 1 - t;
          return [m * m * m * c[0][0] + 3 * m * m * t * c[1][0] + 3 * m * t * t * c[2][0] + t * t * t * c[3][0],
                  m * m * m * c[0][1] + 3 * m * m * t * c[1][1] + 3 * m * t * t * c[2][1] + t * t * t * c[3][1]];
        }
        var L = [], Rr = [], n = 14, i;
        for (i = 0; i <= n; i++) {
          var t = i / n, p0 = bez(Math.max(0, t - 0.01)), p1 = bez(Math.min(1, t + 0.01));
          var tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
          var hw = w / 2 * (0.55 + 0.45 * Math.min(1, t / 0.3)) * (1 - 0.25 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.45) / 0.2))));  // gathered at the knot, narrows at the twist
          var pc = bez(t);
          L.push([pc[0] + nx * hw, pc[1] + ny * hw]); Rr.push([pc[0] - nx * hw, pc[1] - ny * hw]);
        }
        var end = bez(1), pre = bez(0.97), ex = end[0] - pre[0], ey = end[1] - pre[1], el = Math.hypot(ex, ey) || 1;
        var notch = [end[0] - ex / el * 0.4, end[1] - ey / el * 0.4];
        var d = "M" + P(L[0][0], L[0][1]);
        for (i = 1; i <= n; i++) d += " L" + P(L[i][0], L[i][1]);
        d += " L" + P(notch[0], notch[1]);
        for (i = n; i >= 0; i--) d += " L" + P(Rr[i][0], Rr[i][1]);
        var tw = "M" + P(L[7][0], L[7][1]) + " L" + P(L[9][0], L[9][1]) + " L" + P(Rr[9][0], Rr[9][1]) + " L" + P(Rr[7][0], Rr[7][1]) + "Z";
        return '<g class="' + cls + '"><path ' + fill + ' stroke-linejoin="round" d="' + d + 'Z"/></g>';
      }
      var out = '<g class="bow">';
      out += tailB("tail-l", -1, 3.5, 24) + tailB("tail-r", 1, 3.9, 17);
      out += loopB("loop-l", -1, 1) + loopB("loop-r", 1, 1.05);
      // gathered knot
      out += '<rect x="' + f(-u * 0.36) + '" y="' + f(-u * 0.46) + '" width="' + f(u * 0.72) + '" height="' + f(u * 0.92) + '" rx="' + f(u * 0.2) + '" fill="url(#' + id + ')" stroke="#ffffff" stroke-width="' + f(u * 0.04) + '"/>';
      out += '<path ' + fold + ' d="M' + P(-0.14, -0.38) + " Q" + P(-0.04, 0) + " " + P(-0.14, 0.38) + " M" + P(0.13, -0.38) + " Q" + P(0.2, 0) + " " + P(0.12, 0.38) + '"/>';
      return out + "</g>";
    }

    // tail hanging from the knot: gentle S-curve, angled notched cut at the end
    function tailPath(cls, side, len, w, angDeg, bend) {
      var a = angDeg * Math.PI / 180, dx = side * Math.sin(a), dy = Math.cos(a), nx = dy, ny = -dx;
      var ex = dx * len, ey = dy * len, h0 = w * 0.3, h1 = w / 2;
      function pt(t, off) {                       // point along the S-curved centre line, offset across it
        var sx = Math.sin(t * Math.PI) * bend * side * -1;
        return [dx * len * t + nx * (off + sx), dy * len * t + ny * (off + sx)];
      }
      var A = pt(0, -h0), B = pt(0.4, -h1 * 0.85), C = pt(0.75, -h1), D = pt(1, -h1);
      var E = [ex + nx * 0 - dx * 0.35, ey + ny * 0 - dy * 0.35];
      var F = pt(1, h1 * 0.6), G = pt(0.75, h1), H = pt(0.4, h1 * 0.85), I = pt(0, h0);
      F[0] += dx * 0.3; F[1] += dy * 0.3;        // angled cut: one side longer
      return '<path class="' + cls + '" ' + fill + ' d="M' + P(A[0], A[1]) + " C" + P(B[0], B[1]) + " " + P(C[0], C[1]) + " " + P(D[0], D[1]) +
        " L" + P(E[0], E[1]) + " L" + P(F[0], F[1]) + " C" + P(G[0], G[1]) + " " + P(H[0], H[1]) + " " + P(I[0], I[1]) + 'Z"/>';
    }
  }
  function sheerDefs(id) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".92"/>' +
      '<stop offset=".5" stop-color="#ffffff" stop-opacity=".62"/><stop offset="1" stop-color="#f4f0e8" stop-opacity=".9"/></linearGradient>';
  }

  /* The sheer ribbon wrapped across the envelope and tied under the seal (viewBox matches the envelope, 100 × 68). */
  function ribbonSVG() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 68" overflow="visible"><defs>' + sheerDefs("sheer") + "</defs>";
    s += '<g class="band"><path d="M0 37.1 C25 36.6 40 37.4 50 37.0 C62 36.7 78 37.4 100 36.8 L100 42.2 C78 42.7 62 41.9 50 42.3 C40 42.6 25 41.9 0 42.5Z" fill="url(#sheer)" stroke="#ffffff" stroke-opacity=".95" stroke-width=".22"/>';
    s += '<path d="M0 38.6 C30 38.2 70 39.0 100 38.3" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width=".3"/>' +
      '<path d="M0 37.1 L1.2 37.05 L1.2 42.45 L0 42.5Z M100 36.8 L98.8 36.85 L98.8 42.15 L100 42.2Z" fill="#d9d1c2" fill-opacity=".55"/></g>';
    s += '<g transform="translate(50 39.6)">' + bowSVG(6.4, "sheer") + "</g></svg>";
    return s;
  }

  /* A small, full, hand-tied wildflower bouquet (for the bottom of the email): a rounded dome of blooms,
     a few spikes peeking above, stems gathered below and tied with a sheer bow. Tie point at (0,0). */
  function bouquet(S) {
    seed(31);
    var s = "", b = [];
    // greenery tucked behind the dome
    s += fern(0, 0, S * 0.62, -66) + fern(0, 0, S * 0.58, 62) + blade(0, 0, S * 0.66, -22, S * 0.05) + blade(0, 0, S * 0.62, 26, -S * 0.05);
    s += leaf(0, 0, S * 0.32, -50) + leaf(0, 0, S * 0.3, 52) + leaf(0, 0, S * 0.26, -86) + leaf(0, 0, S * 0.25, 88);
    // spikes and wisps peeking above the blooms
    s += delphinium(0, 0, S * 0.98, -4) + lavender(0, 0, S * 0.84, -26) + lavender(0, 0, S * 0.8, 24);
    s += snapdragon(0, 0, S * 0.8, 38, "pink") + snapdragon(0, 0, S * 0.76, -42, "peach") + queenAnne(0, 0, S * 0.86, 12) + wheat(0, 0, S * 0.84, -14);
    // the dome
    function at2(x, y) { return [x * S, y * S]; }
    var blooms = [
      [function (x, y) { return tilt(x, y, 0.8, 20, hydrangea(x, y, S * 0.14, "pink")); }, -0.4, -0.38],
      [function (x, y) { return tilt(x, y, 0.62, 30, gerbera(x, y, S * 0.11, "yellow", 20)); }, 0.44, -0.42],
      [function (x, y) { return tilt(x, y, 0.6, -40, daisy(x, y, S * 0.08, 10)); }, -0.52, -0.18],
      [function (x, y) { return tilt(x, y, 0.65, 50, daisy(x, y, S * 0.075, 30)); }, 0.54, -0.2],
      [function (x, y) { return tilt(x, y, 0.7, -70, daisy(x, y, S * 0.075, 0)); }, -0.24, -0.66],
      [function (x, y) { return tilt(x, y, 0.6, 60, daisy(x, y, S * 0.07, 20)); }, 0.26, -0.68],
      [function (x, y) { return tilt(x, y, 0.75, 10, daisy(x, y, S * 0.07, 40)); }, 0.04, -0.74],
      [function (x, y) { return babies(x, y, S * 0.08); }, -0.08, -0.58],
      [function (x, y) { return babies(x, y, S * 0.08); }, 0.36, -0.58],
      [function (x, y) { return babies(x, y, S * 0.07); }, -0.42, -0.58],
      [function (x, y) { return rose(x, y, S * 0.08, "peach", 20); }, -0.4, -0.12],
      [function (x, y) { return tilt(x, y, 0.75, 30, ranunculus(x, y, S * 0.09, "pink", 0)); }, 0.42, -0.14],
      [function (x, y) { return rose(x, y, S * 0.13, "blush", -12); }, -0.22, -0.36],
      [function (x, y) { return tilt(x, y, 0.82, -20, carnation(x, y, S * 0.12, "peach", 20)); }, 0.24, -0.36],
      [function (x, y) { return rose(x, y, S * 0.06, "blush", 0); }, 0.12, -0.6],
      [function (x, y) { return tilt(x, y, 0.8, 0, hydrangea(x, y, S * 0.1, "blue")); }, 0.3, -0.52],
      [function (x, y) { return tilt(x, y, 0.8, 0, hydrangea(x, y, S * 0.09, "blue")); }, -0.56, -0.38],
      [function (x, y) { return tilt(x, y, 0.65, -30, daisy(x, y, S * 0.065, 0)); }, -0.12, -0.2],
      [function (x, y) { return tilt(x, y, 0.6, 40, daisy(x, y, S * 0.065, 20)); }, 0.14, -0.2],
      [function (x, y) { return rose(x, y, S * 0.07, "pink", 15); }, -0.36, -0.56],
      [function (x, y) { return tilt(x, y, 0.7, 20, daisy(x, y, S * 0.07, 10)); }, 0.58, -0.4],
      [function (x, y) { return tilt(x, y, 0.7, -20, ranunculus(x, y, S * 0.07, "peach", 0)); }, -0.6, -0.06],
      [function (x, y) { return tilt(x, y, 0.7, 20, ranunculus(x, y, S * 0.065, "blush", 0)); }, 0.6, -0.04],
      [function (x, y) { return rose(x, y, S * 0.15, "cream", -6); }, 0.0, -0.44]
    ];
    var stems = "", heads = "";
    blooms.forEach(function (bl) {
      var p = at2(bl[1], bl[2]);
      stems += '<path d="M0 0 Q' + f(p[0] * 0.3) + " " + f(p[1] * 0.55) + " " + f(p[0]) + " " + f(p[1]) + '" fill="none" stroke="' + C.stem + '" stroke-width="' + f(S * 0.012) + '"/>';
      heads += bl[0](p[0], p[1]);
    });
    s += stems + heads;
    // gathered stems below the tie, then the bow
    var st = "";
    for (var i = 0; i < 13; i++) st += '<path d="M' + f(-S * 0.05 + i * S * 0.008) + " " + f(-S * 0.02) + " Q" + f(S * (-0.02 + i * 0.006)) + " " + f(S * 0.25) + " " + f(S * (-0.09 + i * 0.015)) + " " + f(S * (0.34 + (i % 3) * 0.025)) + '" fill="none" stroke="' + (i % 3 ? C.stem : C.stemDark) + '" stroke-width="' + f(S * 0.016) + '" stroke-linecap="round"/>';
    s += st;
    s += '<path d="M' + f(-S * 0.075) + " " + f(S * 0.05) + " Q0 " + f(S * 0.09) + " " + f(S * 0.075) + " " + f(S * 0.05) + " L" + f(S * 0.075) + " " + f(S * 0.11) + " Q0 " + f(S * 0.15) + " " + f(-S * 0.075) + " " + f(S * 0.11) + 'Z" fill="url(#sheer)" stroke="#ffffff" stroke-width="' + f(S * 0.004) + '"/>';
    s += '<g transform="translate(0 ' + f(S * 0.08) + ')">' + bowSVG(S * 0.07, "sheer") + "</g>";
    return '<defs>' + sheerDefs("sheer") + "</defs>" + s;
  }

  /* A low, horizontal arrangement for the bottom of the email (like a table centrepiece):
     focal flowers in the centre, smaller blooms stepping down each side, greenery and spires tapering
     to the tips. Balanced left/right, nothing sticking up. Centre at (0,0). */
  function arrangement(S) {
    /* A low, horizontal meadow arrangement (like a long table piece): a dense, low bed of greenery
       running left to right, with flowers rising out of it on upright stems at many different heights,
       and airy wild sprays reaching higher. Uses the envelope's flowers. Base line at y = 0. */
    seed(73);
    var s = "", i;
    function X(v) { return v * S; }
    function stemTo(x0, x1, y1) { return '<path d="M' + f(X(x0)) + " " + f(X(0.02)) + " Q" + f(X((x0 + x1) / 2 + j(0.02))) + " " + f(X(y1 * 0.5)) + " " + f(X(x1)) + " " + f(X(y1)) + '" fill="none" stroke="' + C.stem + '" stroke-width="' + f(S * 0.007) + '"/>'; }
    // 1. airy wild sprays reaching up from the bed (behind everything)
    var wild = [[queenAnne, -0.56, 0.6, -8], [queenAnne, 0.34, 0.5, 10], [grass, -0.2, 0.66, -4], [grass, 0.72, 0.46, 14],
                [delphinium, -0.36, 0.64, -6], [delphinium, 0.14, 0.56, 6], [lavender, 0.52, 0.48, 10], [lavender, -0.76, 0.42, -16],
                [wheat, 0.86, 0.34, 22], [wheat, -0.9, 0.3, -24], [snapdragon, -0.02, 0.5, 2]];
    wild.forEach(function (w) { s += w[0] === snapdragon ? snapdragon(X(w[1]), 0, X(w[2]), w[3], "pink") : w[0](X(w[1]), 0, X(w[2]), w[3]); });
    s += chamomile(X(-0.06), 0, X(0.6), -6, false) + chamomile(X(0.62), 0, X(0.44), 12, true) + chamomile(X(-0.86), 0, X(0.34), -18, false) + chamomile(X(0.3), 0, X(0.4), 4, true);
    // 2. the bed of greenery: layered feathery fern, leaves and grass blades
    for (i = 0; i < 30; i++) {                       // back layer of fern, taller in the middle
      var bx = -0.96 + i * 0.066 + j(0.015), bh = 0.14 + 0.12 * (1 - Math.abs(bx));
      s += fern(X(bx), X(0.03), X(bh * (0.8 + R() * 0.4)), (R() * 2 - 1) * 55 + bx * 25);
    }
    for (i = 0; i < 46; i++) {                       // leaves through the middle of the bed
      var x = -0.97 + i * 0.043 + j(0.012), edge = 1 - Math.abs(x) * 0.5;
      s += leaf(X(x), X(0.04), X((0.1 + R() * 0.09) * edge), (R() * 2 - 1) * 75 + (x < 0 ? -10 : 10));
    }
    for (i = 0; i < 18; i++) {                       // grass blades
      var gx = -0.9 + i * 0.105 + j(0.03);
      s += blade(X(gx), X(0.03), X(0.14 + R() * 0.1), (R() * 2 - 1) * 35, X((R() * 2 - 1) * 0.03));
    }
    s += fern(X(-0.6), X(0.02), X(0.42), -78) + fern(X(0.62), X(0.02), X(0.42), 80) + fern(X(-0.2), X(0.02), X(0.3), -40) + fern(X(0.25), X(0.02), X(0.3), 45);
    s += blade(X(-0.4), X(0.02), X(0.3), -20, X(0.03)) + blade(X(0.45), X(0.02), X(0.28), 25, -X(0.03)) + blade(X(0.05), X(0.02), X(0.32), 8, X(0.02));
    // 3. flowers on their own stems, at different heights
    var blooms = [
      [-0.24, -0.26, -0.44, function (x, y) { return lisianthus(x, y, X(0.1), "white", -6); }],
      [0.22, 0.2, -0.32, function (x, y) { return tilt(x, y, 0.85, 30, scabiosa(x, y, X(0.075), "pink", 0)); }],
      [-0.5, -0.52, -0.36, function (x, y) { return cosmos(x, y, X(0.065), "pink", 20); }],
      [0.44, 0.46, -0.4, function (x, y) { return cosmos(x, y, X(0.062), "peach", -15); }],
      [0.78, 0.8, -0.24, function (x, y) { return cosmos(x, y, X(0.052), "pink", 10); }],
      [0.04, 0.06, -0.26, function (x, y) { return tilt(x, y, 0.62, 30, gerbera(x, y, X(0.072), "yellow", 20)); }],
      [0.58, 0.6, -0.15, function (x, y) { return lisianthus(x, y, X(0.075), "white", 10); }],
      [-0.7, -0.7, -0.2, function (x, y) { return tilt(x, y, 0.85, -30, scabiosa(x, y, X(0.06), "pink", 0)); }],
      [-0.42, -0.4, -0.58, function (x, y) { return tilt(x, y, 0.65, -30, daisy(x, y, X(0.05), 0)); }],
      [-0.02, 0.0, -0.52, function (x, y) { return tilt(x, y, 0.7, 20, daisy(x, y, X(0.048), 20)); }],
      [0.28, 0.27, -0.5, function (x, y) { return tilt(x, y, 0.6, -40, daisy(x, y, X(0.046), 10)); }],
      [0.64, 0.66, -0.34, function (x, y) { return tilt(x, y, 0.7, 40, daisy(x, y, X(0.045), 0)); }],
      [-0.66, -0.68, -0.34, function (x, y) { return tilt(x, y, 0.65, -20, daisy(x, y, X(0.045), 30)); }],
      [0.9, 0.92, -0.14, function (x, y) { return tilt(x, y, 0.7, 30, daisy(x, y, X(0.04), 0)); }],
      [-0.9, -0.92, -0.12, function (x, y) { return tilt(x, y, 0.7, -30, daisy(x, y, X(0.04), 0)); }],
      [-0.14, -0.14, -0.3, function (x, y) { return tilt(x, y, 0.62, 30, ranunculus(x, y, X(0.06), "blush", 0)); }],
      [0.36, 0.38, -0.26, function (x, y) { return tilt(x, y, 0.7, -20, daisy(x, y, X(0.045), 0)); }],
      [-0.32, -0.33, -0.2, function (x, y) { return cosmos(x, y, X(0.05), "peach", 30); }],
      [0.7, 0.71, -0.1, function (x, y) { return tilt(x, y, 0.85, 20, scabiosa(x, y, X(0.05), "pink", 0)); }],
      [-0.8, -0.81, -0.24, function (x, y) { return cosmos(x, y, X(0.048), "pink", -10); }]
    ];
    var stems = "", heads = "";
    blooms.forEach(function (b) { stems += stemTo(b[0], b[1], b[2]); heads += b[3](X(b[1]), X(b[2])); });
    s += stems;
    s += babies(X(-0.32), X(-0.24), X(0.06)) + babies(X(0.36), X(-0.22), X(0.06)) + babies(X(-0.78), X(-0.1), X(0.05)) + babies(X(0.12), X(-0.42), X(0.05));
    s += heads;
    // 3b. front layer: short fern and leaves covering the stem ends
    for (i = 0; i < 24; i++) {
      var fx = -0.95 + i * 0.083 + j(0.02);
      s += fern(X(fx), X(0.05), X(0.08 + R() * 0.06), (R() * 2 - 1) * 70);
    }
    for (i = 0; i < 34; i++) {
      var lx = -0.95 + i * 0.058 + j(0.012);
      s += leaf(X(lx), X(0.05), X(0.06 + R() * 0.06), (R() * 2 - 1) * 65 + (lx < 0 ? -12 : 12));
    }
    // 4. low, nestled blooms sitting in the greenery
    s += hydrangea(X(-0.08), X(-0.06), X(0.09), "blue") + hydrangea(X(0.5), X(-0.04), X(0.08), "pink") + hydrangea(X(-0.58), X(-0.05), X(0.075), "blue");
    s += gardenia(X(0.3), X(-0.08), X(0.07), 15) + gardenia(X(-0.38), X(-0.07), X(0.06), -20);
    s += tilt(X(0.12), X(-0.06), 0.8, 20, cosmos(X(0.12), X(-0.06), X(0.05), "pink", 0));
    return s;
  }





  /* Blue toile lining: white line-drawn hydrangea clusters, leafy sprigs and a little bird on dusty blue. */
  function toileTile(size) {
    seed(57);
    var u = size / 200, items = "", i, k;
    var line = 'fill="none" stroke="#ffffff" stroke-opacity=".88" stroke-width="' + f(0.9 * u) + '" stroke-linecap="round" stroke-linejoin="round"';
    var soft = 'fill="#ffffff" fill-opacity=".22" stroke="#ffffff" stroke-opacity=".9" stroke-width="' + f(0.8 * u) + '"';
    function T(x, y, rot, inner) { return '<g transform="translate(' + f(x * u) + " " + f(y * u) + ") rotate(" + f(rot) + ')">' + inner + "</g>"; }
    function floret(x, y, r) {
      var g = "", a0 = R() * 90;
      for (var q = 0; q < 4; q++) g += '<path ' + soft + ' transform="translate(' + f(x * u) + " " + f(y * u) + ") rotate(" + f(a0 + q * 90) + ')" d="' + petalPath(r * u, r * 0.62 * u, false) + '"/>';
      return g + '<circle cx="' + f(x * u) + '" cy="' + f(y * u) + '" r="' + f(r * 0.18 * u) + '" fill="#ffffff"/>';
    }
    function cluster(cx, cy, R0) {                  // hydrangea head: a dome of four-petal florets
      var g = "";
      for (k = 0; k < 11; k++) {
        var a = R() * Math.PI * 2, d = Math.sqrt(R()) * R0;
        g += floret(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, R0 * (0.24 + R() * 0.08));
      }
      return g;
    }
    function leafL(x, y, len, rot) {               // outlined leaf with a centre vein and side veins
      var w = len * 0.3, d = "M0 0 C" + f(w * u) + " " + f(-len * 0.3 * u) + " " + f(w * 0.8 * u) + " " + f(-len * 0.75 * u) + " 0 " + f(-len * u) + " C" + f(-w * 0.8 * u) + " " + f(-len * 0.75 * u) + " " + f(-w * u) + " " + f(-len * 0.3 * u) + " 0 0Z";
      var v = '<path d="M0 0 L0 ' + f(-len * 0.9 * u) + '"/>';
      for (k = 1; k <= 3; k++) v += '<path d="M0 ' + f(-len * k * 0.22 * u) + " l" + f(w * 0.6 * u) + " " + f(-len * 0.12 * u) + " M0 " + f(-len * k * 0.22 * u) + " l" + f(-w * 0.6 * u) + " " + f(-len * 0.12 * u) + '"/>';
      return T(x, y, rot, '<path ' + soft + ' d="' + d + '"/><g ' + line + ' opacity=".7">' + v + "</g>");
    }
    function stemL(x1, y1, x2, y2, bend) {
      return '<path ' + line + ' d="M' + f(x1 * u) + " " + f(y1 * u) + " Q" + f(((x1 + x2) / 2 + bend) * u) + " " + f(((y1 + y2) / 2) * u) + " " + f(x2 * u) + " " + f(y2 * u) + '"/>';
    }
    function bird(x, y, rot, sc) {                  // small songbird perched, in outline
      var b = '<g ' + line + '>' +
        '<path d="M-9 1 C-6 -6 4 -7 8 -3 C10 -1 10 2 7 4 C2 7 -5 6 -9 1Z" fill="#ffffff" fill-opacity=".25"/>' +
        '<circle cx="7.5" cy="-4" r="3.2" fill="#ffffff" fill-opacity=".25"/><path d="M10.5 -4.5 L13 -3.6 L10.6 -3"/>' +
        '<path d="M-8 1 L-15 -2 L-14 2 Z"/><path d="M-4 -1 C-1 -4 3 -4 5 -2"/><path d="M-1 5 L-2 9 M2 5 L2 9"/></g>' +
        '<circle cx="8.3" cy="-4.6" r=".7" fill="#ffffff"/>';
      return '<g transform="translate(' + f(x * u) + " " + f(y * u) + ") rotate(" + f(rot) + ") scale(" + f(sc * u) + ')">' + b + "</g>";
    }
    // one motif: an arching branch with rounded hydrangea heads, small open blossoms and leaves along the curve
    function blossom(x, y, r) {                      // a small open five-petal flower in outline
      var g = "", a0 = R() * 72;
      for (var q = 0; q < 5; q++) g += '<path ' + soft + ' transform="translate(' + f(x * u) + " " + f(y * u) + ") rotate(" + f(a0 + q * 72) + ')" d="' + petalPath(r * u, r * 0.55 * u, true) + '"/>';
      return g + '<circle cx="' + f(x * u) + '" cy="' + f(y * u) + '" r="' + f(r * 0.22 * u) + '" fill="#ffffff"/>';
    }
    function curve(pts) {                            // smooth curve through points (in tile units)
      var d = "M" + f(pts[0][0] * u) + " " + f(pts[0][1] * u);
      for (var q = 1; q < pts.length - 1; q++) {
        var mx = (pts[q][0] + pts[q + 1][0]) / 2, my = (pts[q][1] + pts[q + 1][1]) / 2;
        d += " Q" + f(pts[q][0] * u) + " " + f(pts[q][1] * u) + " " + f(mx * u) + " " + f(my * u);
      }
      var L = pts[pts.length - 1];
      return '<path ' + line + ' d="' + d + " L" + f(L[0] * u) + " " + f(L[1] * u) + '"/>';
    }
    function motif(ox, oy, mirror, withBird) {
      var g = "", sx = mirror ? -1 : 1;
      function P(x, y) { return [ox + sx * x, oy + y]; }
      // main stem: a gently bowed diagonal, with short side stems alternating along it
      g += curve([P(-34, 34), P(-6, 4), P(30, -34)]);
      var sides = [[-22, 20, -36, 10], [-14, 12, -6, -2], [-2, 0, -18, -14], [8, -10, 20, -6], [16, -18, 6, -30]];
      sides.forEach(function (sd) { g += curve([P(sd[0], sd[1]), P((sd[0] + sd[2]) / 2 + 2, (sd[1] + sd[3]) / 2 - 2), P(sd[2], sd[3])]); });
      // leaves along the stem
      g += leafL(P(-28, 27)[0], oy + 27, 12, sx * -70) + leafL(P(-18, 16)[0], oy + 16, 11, sx * 60) + leafL(P(-8, 6)[0], oy + 6, 10, sx * -55);
      g += leafL(P(4, -6)[0], oy - 6, 10, sx * 70) + leafL(P(12, -14)[0], oy - 14, 9, sx * -45);
      // flower heads: hydrangea at the tip and on side stems, open blossoms in between
      g += cluster(P(30, -36)[0], oy - 38, 11) + cluster(P(-36, 10)[0], oy + 8, 8) + cluster(P(-18, -14)[0], oy - 16, 9);
      g += blossom(P(20, -6)[0], oy - 6, 4.6) + blossom(P(6, -30)[0], oy - 31, 4.8) + blossom(P(-6, -2)[0], oy - 3, 4) + blossom(P(38, -22)[0], oy - 22, 3.8);
      g += floret(P(-26, -2)[0], oy - 2, 2.4) + floret(P(24, -46)[0], oy - 46, 2.2);
      if (withBird) g += bird(P(-30, -16)[0], oy - 14, mirror ? 8 : -8, 0.85 * sx);
      return g;
    }
    var spots = [[56, 62, false, true], [150, 158, true, false]];
    spots.forEach(function (sp, n) {
      var id = "tm" + n;
      items += '<g id="' + id + '">' + motif(sp[0], sp[1], sp[2], sp[3]) + "</g>";
      var m = '<use href="#' + id + '" xlink:href="#' + id + '"/>';
      var need = function (v, d) { return d === 0 || (d === -1 && v + 52 > 200) || (d === 1 && v - 52 < 0); };
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
        if (!need(sp[0], dx) || !need(sp[1], dy)) continue;
        if (dx || dy) items += '<g transform="translate(' + f(dx * size) + " " + f(dy * size) + ')">' + m + "</g>";
      }
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<rect width="100%" height="100%" fill="#b4c7d6"/>' + items + "</svg>";
  }

  /* Blue lace lining: a white damask medallion repeat (mirrored scrolls, a centre flower, leaves) over fine net. */
  function damaskTile(size) {
    var u = size / 200, s = "", i;
    var line = 'fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="' + f(1 * u) + '" stroke-linecap="round"';
    var soft = 'fill="#ffffff" fill-opacity=".2" stroke="#ffffff" stroke-opacity=".85" stroke-width="' + f(0.9 * u) + '"';
    s += '<g fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="' + f(0.5 * u) + '">';
    for (i = -10; i <= 210; i += 7) s += '<path d="M' + f(i * u) + " 0 L" + f((i + 200) * u) + " " + f(200 * u) + '"/><path d="M' + f(i * u) + " " + f(200 * u) + " L" + f((i + 200) * u) + ' 0"/>';
    s += "</g>";
    function P(x, y) { return f(x * u) + " " + f(y * u); }
    function half() {                               // right half of the medallion; mirrored for the left
      var g = "";
      g += '<path ' + line + ' d="M0 -46 C10 -40 22 -34 26 -20 C30 -6 20 2 12 -4 C6 -9 12 -16 18 -12"/>'.replace(/(-?\d+(\.\d+)?) (-?\d+(\.\d+)?)/g, function (_, a, __, b) { return P(+a, +b); });
      g += '<path ' + line + ' d="M0 46 C12 40 26 30 28 14 C30 2 20 -2 14 4 C10 9 16 14 20 10"/>'.replace(/(-?\d+(\.\d+)?) (-?\d+(\.\d+)?)/g, function (_, a, __, b) { return P(+a, +b); });
      g += '<path ' + soft + ' d="M6 -30 C14 -34 20 -28 16 -22 C12 -18 6 -22 6 -30Z M8 28 C16 30 20 24 15 19 C11 16 6 21 8 28Z M24 -2 C34 -6 38 2 32 7 C28 10 22 6 24 -2Z"/>'.replace(/(-?\d+(\.\d+)?) (-?\d+(\.\d+)?)/g, function (_, a, __, b) { return P(+a, +b); });
      for (var k = 0; k < 4; k++) g += '<circle cx="' + f((30 + k * 3) * u) + '" cy="' + f((-30 + k * 7) * u) + '" r="' + f(1.2 * u) + '" fill="#ffffff" fill-opacity=".8"/>';
      return g;
    }
    function medallion(cx, cy, sc) {
      var g = '<g transform="translate(' + f(cx * u) + " " + f(cy * u) + ") scale(" + sc + ')">' + half() + '<g transform="scale(-1 1)">' + half() + "</g>";
      for (i = 0; i < 6; i++) g += '<path ' + soft + ' transform="rotate(' + (i * 60) + ')" d="' + petalPath(11 * u, 5 * u, true) + '"/>';
      g += '<circle r="' + f(3 * u) + '" fill="#ffffff" fill-opacity=".8"/>';
      for (i = 0; i < 3; i++) g += '<circle cx="0" cy="' + f((-51 - i * 4.5) * u) + '" r="' + f((1.6 - i * 0.4) * u) + '" fill="#ffffff" fill-opacity=".85"/>';
      return g + "</g>";
    }
    [[100, 100, 1], [0, 0, 1], [200, 0, 1], [0, 200, 1], [200, 200, 1]].forEach(function (m) { s += medallion(m[0], m[1], m[2]); });
    [[100, 0], [100, 200], [0, 100], [200, 100]].forEach(function (m) {
      var g = '<g transform="translate(' + f(m[0] * u) + " " + f(m[1] * u) + ')">';
      for (i = 0; i < 4; i++) g += '<path ' + soft + ' transform="rotate(' + (i * 90 + 45) + ')" d="' + petalPath(9 * u, 3.5 * u, false) + '"/>';
      s += g + '<circle r="' + f(1.8 * u) + '" fill="#ffffff"/></g>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<rect width="100%" height="100%" fill="#a4b8cc"/>' + s + "</svg>";
  }

  /* Seamless tile for the envelope lining: dusty blue with fine white lace. */
  function linerTile(size, bg) {
    var style = root.Flowers && root.Flowers.LINER || "toile";
    if (style === "toile") return toileTile(size);
    if (style === "damask") return damaskTile(size);
    var u = size / 200, s = "", W = 'stroke="#ffffff" fill="none"', i, a;
    // fine net
    s += '<g ' + W + ' stroke-opacity=".28" stroke-width="' + f(0.6 * u) + '">';
    for (i = -10; i <= 210; i += 12.5) {
      s += '<path d="M' + f(i * u) + " 0 L" + f((i + 200) * u) + " " + f(200 * u) + '"/><path d="M' + f(i * u) + " " + f(200 * u) + " L" + f((i + 200) * u) + ' 0"/>';
    }
    s += "</g>";
    function rosette(cx, cy, r) {
      var g = '<g transform="translate(' + f(cx * u) + " " + f(cy * u) + ')" ' + W + ' stroke-opacity=".85" stroke-width="' + f(1.1 * u) + '">';
      for (i = 0; i < 16; i++) { a = i * Math.PI / 8; g += '<circle cx="' + f(Math.cos(a) * r * u) + '" cy="' + f(Math.sin(a) * r * u) + '" r="' + f(r * 0.2 * u) + '"/>'; }   // scalloped ring
      g += '<circle r="' + f(r * 0.8 * u) + '" stroke-opacity=".6"/>';
      for (i = 0; i < 8; i++) g += '<path transform="rotate(' + (i * 45) + ')" d="' + petalPath(r * 0.68 * u, r * 0.17 * u, false) + '"/>';                     // petal outlines
      for (i = 0; i < 8; i++) { a = (i * 45 + 22.5) * Math.PI / 180; g += '<circle cx="' + f(Math.cos(a) * r * 0.5 * u) + '" cy="' + f(Math.sin(a) * r * 0.5 * u) + '" r="' + f(1.2 * u) + '" fill="#ffffff"/>'; }
      g += '<circle r="' + f(r * 0.14 * u) + '" fill="#ffffff" fill-opacity=".7"/>';
      return g + "</g>";
    }
    function sprig(cx, cy, r) {
      var g = '<g transform="translate(' + f(cx * u) + " " + f(cy * u) + ')" ' + W + ' stroke-opacity=".75" stroke-width="' + f(1 * u) + '">';
      for (i = 0; i < 4; i++) g += '<path transform="rotate(' + (i * 90 + 45) + ')" d="' + petalPath(r * u, r * 0.35 * u, false) + '"/>';
      for (i = 0; i < 4; i++) { a = i * Math.PI / 2; g += '<circle cx="' + f(Math.cos(a) * r * 0.9 * u) + '" cy="' + f(Math.sin(a) * r * 0.9 * u) + '" r="' + f(1.3 * u) + '" fill="#ffffff"/>'; }
      return g + "</g>";
    }
    [[0, 0], [200, 0], [0, 200], [200, 200], [100, 100]].forEach(function (p) { s += rosette(p[0], p[1], 34); });
    [[100, 0], [100, 200], [0, 100], [200, 100]].forEach(function (p) { s += sprig(p[0], p[1], 15); });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<rect width="100%" height="100%" fill="' + (bg || "#b3c9e0") + '"/>' + s + "</svg>";
  }

  /* Rustle: each stem is a damped spring hinged at the tie point (0,0).
     - When the envelope shakes, its angular acceleration kicks the springs, so the flowers lag,
       overshoot and settle (soft greenery and spikes swing more than the stiffer blooms).
     - On top of that a gentle breeze sways every stem a little, out of step with its neighbours.
     - Flower heads (fl-nod) follow their stem with extra give, plus a small nod of their own.
     step(dt, envDeg) advances the physics; pose(time) writes the transforms.
     period = breeze loop in seconds (whole-number cycles, so a GIF loop repeats cleanly).
     bundle (0..1) draws the stems in together, for when the posy falls. */
  function Rustle(svgEl, period) {
    this.period = period || 5;
    this.prev = null; this.prev2 = null; this.bundle = 0;
    this.pieces = Array.prototype.map.call(svgEl.querySelectorAll(".fl-sway"), function (g) {
      var a = +g.getAttribute("data-a"), p = +g.getAttribute("data-p");
      var hz = Math.max(1.0, 2.5 - a * 0.33), w = 2 * Math.PI * hz;
      var bb = g.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
      return { g: g, a: a, p: p, k: w * w, c: 2 * 0.16 * w, gain: 0.5 + a * 0.28, rel: 0, vel: 0,
               fan: Math.atan2(cx, -cy) * 180 / Math.PI,
               nods: Array.prototype.map.call(g.querySelectorAll(".fl-nod"), function (n) {
                 return { n: n, x: n.getAttribute("data-x"), y: n.getAttribute("data-y"), a: +n.getAttribute("data-a"), p: +n.getAttribute("data-p") };
               }) };
    });
  }
  Rustle.prototype.step = function (dt, envDeg) {
    var sub = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / sub, i, k, start = this.prev == null ? envDeg : this.prev;
    for (k = 0; k < sub; k++) {
      var env = start + (envDeg - start) * ((k + 1) / sub), acc = 0;
      if (this.prev != null && this.prev2 != null) acc = (env - 2 * this.prev + this.prev2) / (h * h);
      this.prev2 = this.prev == null ? env : this.prev;
      this.prev = env;
      for (i = 0; i < this.pieces.length; i++) {
        var q = this.pieces[i];
        q.vel += (-q.k * q.rel - q.c * q.vel - q.gain * acc) * h;
        q.rel += q.vel * h;
      }
    }
  };
  Rustle.prototype.pose = function (time) {
    var TAU = Math.PI * 2, u = time / this.period, i, m;
    for (i = 0; i < this.pieces.length; i++) {
      var q = this.pieces[i];
      var breeze = q.a * 0.55 * (0.75 * Math.sin(TAU * (u + q.p)) + 0.25 * Math.sin(TAU * (2 * u + q.p * 1.7)));
      var ang = q.rel + breeze - this.bundle * q.fan * 0.32;
      q.g.setAttribute("transform", "rotate(" + f(ang) + ")");
      for (m = 0; m < q.nods.length; m++) {
        var nd = q.nods[m];
        nd.n.setAttribute("transform", "rotate(" + f(q.rel * 1.6 + nd.a * 0.6 * Math.sin(TAU * (2 * u + nd.p))) + " " + nd.x + " " + nd.y + ")");
      }
    }
  };

  root.Flowers = {
    C: C, defs: defs, rose: rose, ranunculus: ranunculus, daisy: daisy, gerbera: gerbera, hydrangea: hydrangea,
    delphinium: delphinium, snapdragon: snapdragon, leaf: leaf, eucalyptus: eucalyptus, fern: fern, grass: grass,
    babies: babies, floret: floret, rng: rng, seed: seed, posy: posy, posySVG: posySVG, spray: spray,
    linerTile: linerTile, Rustle: Rustle, ribbonSVG: ribbonSVG, bouquet: bouquet, arrangement: arrangement, gardenia: gardenia, cosmos: cosmos, anemone: anemone, tulip: tulip, cupAnemone: cupAnemone, lisianthus: lisianthus, CENTRE: "lisianthus", BOW: "ribbon", ACCENT: "scabiosa", LINER: "toile", carnation: carnation, tilt: tilt, at: at
  };
})(window);
