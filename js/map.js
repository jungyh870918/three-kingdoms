/* =========================================================================
 *  지도 — 절차적 도트 지형(계절별 4종 캐시) + 도시 마커
 *  내부 해상도 640x378, CSS 로 2배 확대(픽셀 유지)
 * ========================================================================= */
const GameMap = (() => {

  const W = 640, H = 378;

  /* 대륙 외곽선(정규화) */
  const MAINLAND = [
    [0.00, 0.00], [0.76, 0.00], [0.800, 0.060], [0.815, 0.115], [0.790, 0.160],
    [0.755, 0.200], [0.775, 0.235], [0.815, 0.260], [0.858, 0.290], [0.872, 0.335],
    [0.828, 0.365], [0.790, 0.378], [0.795, 0.420], [0.830, 0.460], [0.860, 0.500],
    [0.845, 0.545], [0.875, 0.575], [0.860, 0.620], [0.830, 0.660], [0.790, 0.700],
    [0.760, 0.750], [0.720, 0.800], [0.680, 0.860], [0.630, 0.900], [0.570, 0.930],
    [0.500, 0.955], [0.420, 0.965], [0.300, 0.975], [0.150, 0.990], [0.00, 1.00],
  ];
  const LIAODONG = [
    [0.790, 0.000], [1.000, 0.000], [1.000, 0.320], [0.968, 0.325], [0.952, 0.220],
    [0.928, 0.165], [0.888, 0.135], [0.845, 0.075], [0.815, 0.020],
  ];
  const ISLES = [[0.912, 0.700, 0.018, 0.048], [0.652, 0.928, 0.030, 0.022]];   // 대만 · 해남

  const RIVERS = [
    [[0.14, 0.31], [0.20, 0.28], [0.26, 0.255], [0.33, 0.245], [0.395, 0.275],
     [0.455, 0.315], [0.515, 0.305], [0.565, 0.278], [0.625, 0.252], [0.685, 0.243],
     [0.740, 0.252], [0.790, 0.268]],
    [[0.22, 0.455], [0.28, 0.475], [0.34, 0.470], [0.40, 0.490], [0.455, 0.515],
     [0.505, 0.535], [0.555, 0.560], [0.600, 0.575], [0.650, 0.585], [0.700, 0.572],
     [0.755, 0.545], [0.805, 0.522], [0.858, 0.512]],
    [[0.430, 0.400], [0.470, 0.445], [0.515, 0.490], [0.548, 0.528], [0.560, 0.560]],
    [[0.600, 0.700], [0.620, 0.660], [0.630, 0.620], [0.640, 0.588]],
  ];
  const LAKES = [[0.612, 0.640, 0.028, 0.020], [0.700, 0.628, 0.022, 0.016]];

  const MOUNTAINS = [
    [.30,.30],[.26,.35],[.34,.36],[.22,.31],[.18,.36],[.30,.43],[.25,.47],[.33,.50],
    [.27,.55],[.21,.58],[.35,.58],[.30,.64],[.24,.68],[.36,.68],[.20,.74],[.28,.78],
    [.16,.66],[.12,.55],[.42,.42],[.46,.40],[.50,.44],[.54,.48],[.44,.52],[.40,.50],
    [.60,.20],[.58,.26],[.56,.32],[.62,.63],[.66,.69],[.70,.73],[.58,.71],[.54,.77],
    [.62,.81],[.48,.63],[.52,.67],[.44,.73],[.38,.83],[.32,.87],[.72,.61],[.78,.69],
    [.68,.81],[.50,.85],[.14,.42],[.10,.30],[.24,.24],[.36,.24],[.42,.30],[.66,.55],
  ];

  const PAL = {
    0: { land: ['#2c6a24', '#3a8a2c', '#54a83c', '#78c05c'], hi: ['#6a6a3a', '#8a8452', '#a89c6a', '#c4b88a'] },
    1: { land: ['#1e5a1c', '#2c7824', '#409434', '#5cb048'], hi: ['#5c6634', '#7c804c', '#9c9862', '#b8b482'] },
    2: { land: ['#8a6a2a', '#a8843c', '#c29c50', '#d8bc78'], hi: ['#9c7c44', '#b8945c', '#d0b078', '#e4cc98'] },
    3: { land: ['#8c8c94', '#a8a8b0', '#c8c8d0', '#e8e8f0'], hi: ['#88909c', '#a4acb8', '#c4ccd8', '#e8f0f8'] },
  };
  const SEA = { 0: ['#0818a0', '#2040c4', '#4c6ce0'], 1: ['#0818a0', '#2040c4', '#4c6ce0'],
                2: ['#0a1490', '#1c38b4', '#4462d4'], 3: ['#080c68', '#141c8c', '#3448b0'] };

  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  let land = null, elev = null, dist = null, cache = {}, mtnSprites = null;

  /* ── 노이즈 ─────────────────────────────────────────────────────── */
  function h2(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }

  /* ── 마스크 · 고도 · 거리장 ─────────────────────────────────────── */
  function buildMasks() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    [MAINLAND, LIAODONG].forEach(poly => {
      g.beginPath();
      poly.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H));
      g.closePath(); g.fill();
    });
    ISLES.forEach(([x, y, rx, ry]) => {
      g.beginPath(); g.ellipse(x * W, y * H, rx * W, ry * H, 0, 0, 7); g.fill();
    });
    const d = g.getImageData(0, 0, W, H).data;
    land = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) land[i] = d[i * 4] > 128 ? 1 : 0;

    // 고도 (서고동저 + 산맥 클러스터)
    elev = new Float32Array(W * H);
    const mtn = new Float32Array(W * H);
    MOUNTAINS.forEach(([mx, my]) => {
      const px = mx * W, py = my * H, r = 26;
      for (let y = Math.max(0, py - r) | 0; y < Math.min(H, py + r); y++)
        for (let x = Math.max(0, px - r) | 0; x < Math.min(W, px + r); x++) {
          const t = 1 - Math.hypot(x - px, (y - py) * 1.3) / r;
          if (t > 0) { const i = y * W + x; mtn[i] = Math.max(mtn[i], t * t); }
        }
    });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, nx = x / W;
      const n = vnoise(nx * 9, y / H * 6) * 0.5 + vnoise(nx * 20, y / H * 13) * 0.3 + vnoise(nx * 42, y / H * 27) * 0.2;
      const west = Math.max(0, (0.44 - nx)) * 0.9;
      elev[i] = Math.min(1, n * 0.62 + west + mtn[i] * 0.55);
    }

    // 육/해 거리장 (체임퍼 2패스)
    dist = new Int16Array(W * H).fill(9999);
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0;
      let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        const o = (xx < 0 || yy < 0 || xx >= W || yy >= H) ? land[i] : land[yy * W + xx];
        if (o !== land[i]) { edge = true; break; }
      }
      if (edge) dist[i] = 0;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let v = dist[i];
      if (x > 0) v = Math.min(v, dist[i - 1] + 1);
      if (y > 0) v = Math.min(v, dist[i - W] + 1);
      if (x > 0 && y > 0) v = Math.min(v, dist[i - W - 1] + 1);
      dist[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; let v = dist[i];
      if (x < W - 1) v = Math.min(v, dist[i + 1] + 1);
      if (y < H - 1) v = Math.min(v, dist[i + W] + 1);
      if (x < W - 1 && y < H - 1) v = Math.min(v, dist[i + W + 1] + 1);
      dist[i] = v;
    }
  }

  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  /* ── 계절 지형 렌더(캐시) ───────────────────────────────────────── */
  function terrain(season) {
    if (cache[season]) return cache[season];
    if (!land) buildMasks();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const img = g.createImageData(W, H), o = img.data;
    const pal = PAL[season], sea = SEA[season].map(hex);
    const lp = pal.land.map(hex), hp = pal.hi.map(hex);

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, p = i * 4, thr = BAYER[y & 3][x & 3] / 16;
      let col;
      if (land[i]) {
        const e = elev[i];
        const ramp = e > 0.66 ? hp : lp;
        let lv = (e > 0.66 ? (e - 0.66) / 0.34 : e / 0.66) * 3;
        lv = Math.max(0, Math.min(2.999, lv));
        let idx = Math.floor(lv);
        if (lv - idx > thr) idx++;
        col = ramp[Math.min(3, idx)];
        if (dist[i] <= 1) col = ramp[3];
      } else {
        const d = dist[i];
        const n = vnoise(x / 18, y / 14);
        col = d <= 1 ? sea[2] : d < 7 ? (n > 0.5 - thr * 0.4 ? sea[1] : sea[2])
          : (n > 0.62 + thr * 0.2 ? sea[1] : sea[0]);
      }
      o[p] = col[0]; o[p + 1] = col[1]; o[p + 2] = col[2]; o[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);

    /* 강 · 호수 */
    const rc = season === 3 ? '#b8c8e8' : '#4c8ce0';
    const rc2 = season === 3 ? '#8ca0c8' : '#2c5cc0';
    g.lineCap = 'round';
    RIVERS.forEach(r => {
      for (const [w, col] of [[3, rc2], [1.6, rc]]) {
        g.strokeStyle = col; g.lineWidth = w;
        g.beginPath();
        r.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H));
        g.stroke();
      }
    });
    LAKES.forEach(([x, y, rx, ry]) => {
      g.fillStyle = rc2; g.beginPath(); g.ellipse(x * W, y * H, rx * W, ry * H, 0, 0, 7); g.fill();
      g.fillStyle = rc; g.beginPath(); g.ellipse(x * W, y * H, rx * W - 1.5, ry * H - 1.5, 0, 0, 7); g.fill();
    });

    /* 산 스프라이트 — 봉우리를 4~5개씩 묶어 산맥처럼 */
    MOUNTAINS.forEach(([mx, my], k) => {
      const px = Math.round(mx * W), py = Math.round(my * H);
      const n = 3 + (k % 2);
      for (let i = 0; i < n; i++) {
        const ox = px - 8 + i * 7 + ((k + i) % 3), oy = py + ((k * 3 + i * 5) % 6) - 2;
        peak(g, ox, oy, 6 + ((k + i) % 3), season);
      }
    });
    cache[season] = c;
    return c;
  }

  /* (x,y) = 봉우리 밑변 중앙 */
  function peak(g, x, y, h, season) {
    const P = {
      0: ['#123c10', '#2c6420', '#7cb058'], 1: ['#0c300e', '#20501c', '#68a048'],
      2: ['#4c3410', '#7c5c28', '#c8a058'], 3: ['#4c5468', '#98a4bc', '#ffffff'],
    }[season];
    for (let j = 0; j < h; j++) {
      const w = 1 + 2 * j, yy = y - j;
      g.fillStyle = P[0]; g.fillRect(x - j, yy, w, 1);              // 오른쪽 그늘
      g.fillStyle = P[1]; g.fillRect(x - j, yy, Math.max(1, j), 1); // 왼쪽 사면
    }
    g.fillStyle = P[2];                                             // 능선 · 정상
    for (let j = 0; j < Math.min(4, h); j++) g.fillRect(x - j, y - h + 1 + j, 1, 1);
    g.fillStyle = P[0]; g.fillRect(x - h, y + 1, 2 * h + 1, 1);     // 산자락
  }

  /* ── 도시 스프라이트 ────────────────────────────────────────────── */
  function castle(g, x, y) {
    g.fillStyle = '#301000'; g.fillRect(x - 1, y + 6, 13, 2);
    g.fillStyle = '#f8d040'; g.fillRect(x, y + 2, 11, 5);
    g.fillStyle = '#a86800'; g.fillRect(x, y + 6, 11, 1);
    g.fillStyle = '#e04010'; g.fillRect(x - 1, y + 1, 13, 2);
    g.fillStyle = '#f8f0a0'; g.fillRect(x + 1, y + 3, 2, 2); g.fillRect(x + 8, y + 3, 2, 2);
    g.fillStyle = '#602000'; g.fillRect(x + 4, y + 3, 3, 4);
  }

  function label(g, txt, x, y, col) {
    g.font = '11px Galmuri11, Galmuri14, monospace';
    g.textBaseline = 'top';
    g.fillStyle = '#000';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(txt, x + dx, y + dy);
    g.fillStyle = col; g.fillText(txt, x, y);
  }

  /* ── 전체 그리기 ────────────────────────────────────────────────── */
  function draw(canvas, st) {
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(terrain(st.seasonIdx), 0, 0);

    /* 관문 · 항구 */
    PASSES.forEach(p => label(g, String(p.id), Math.round(p.nx * W), Math.round(p.ny * H), '#40a0ff'));

    /* 도시 */
    CITIES.forEach(c => {
      const x = Math.round(c.nx * W), y = Math.round(c.ny * H);
      const city = st.cities[c.id];
      const col = city.clan >= 0 ? st.clans[city.clan].color : '#ffffff';
      castle(g, x - 5, y + 1);
      g.fillStyle = '#000'; g.fillRect(x + 3, y - 10, 11, 11);
      g.fillStyle = col; g.fillRect(x + 4, y - 9, 9, 9);
      if (city.clan >= 0 && st.clans[city.clan].isPlayer) {
        g.fillStyle = '#fff'; g.fillRect(x + 3, y - 10, 11, 1); g.fillRect(x + 3, y, 11, 1);
        g.fillRect(x + 3, y - 10, 1, 11); g.fillRect(x + 13, y - 10, 1, 11);
      }
      label(g, String(c.id), x + 1 - (c.id >= 10 ? 12 : 6), y - 10, '#ffffff');
    });

    /* 선택 커서 */
    if (st.cursorCity) {
      const c = CITIES[st.cursorCity - 1];
      const x = Math.round(c.nx * W), y = Math.round(c.ny * H);
      g.fillStyle = st.blink ? '#ffffff' : '#4060ff';
      for (let i = 0; i < 6; i++) g.fillRect(x + 16 + i, y - 8 + Math.abs(i - 3) - 1, 1, 8 - 2 * Math.abs(i - 3) + 2);
    }

    /* 진군 화살표 */
    if (st.marchArrow) {
      const [a, b] = st.marchArrow;
      const A = CITIES[a - 1], B = CITIES[b - 1];
      g.strokeStyle = '#ff2020'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(A.nx * W, A.ny * H); g.lineTo(B.nx * W, B.ny * H); g.stroke();
      g.fillStyle = '#ff2020';
      g.fillRect(B.nx * W - 3, B.ny * H - 3, 6, 6);
    }
  }

  function at(px, py, tol) {   // 화면(2배) 좌표 → 도시 id (tol 은 스테이지 픽셀 기준 반경)
    const x = px / 2, y = py / 2;
    let best = null, bd = (tol === undefined ? 16 : tol) / 2 * 2;
    CITIES.forEach(c => {
      const d = Math.hypot(c.nx * W - x, c.ny * H - y);
      if (d < bd) { bd = d; best = c.id; }
    });
    return best;
  }

  return { draw, at, W, H, terrain };
})();
