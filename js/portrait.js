/* =========================================================================
 *  절차적 도트 초상화 —  이름을 해시해서 언제나 같은 얼굴이 나온다.
 *  원작 아트는 쓰지 않고 90년대 VGA 초상화의 문법만 오마주한다.
 *    · 3/4 로 돌린 얼굴 — 코의 옆선이 실루엣에 걸린다
 *    · 빛은 왼쪽 위에서 — 광대와 콧등은 밝고 반대쪽 뺨·턱밑은 어둡다
 *    · 관 13종 · 눈 8종 · 코 4종 · 입 4종 · 수염 8종 · 어깨 6종 · 배경 6종 · 윤곽 5종
 *  js/faces.js 에 적힌 인물은 그 특징대로,  js/art.js 에 그림이 있으면 그 그림을 쓴다.
 * ========================================================================= */
const Portrait = (() => {

  /* ── 팔레트 ─────────────────────────────────────────────────────── */
  const SKINS = ['#e8b48c', '#dca878', '#c89060', '#f0cca4', '#b8845c', '#d0a070'];
  const HAIRS = ['#181818', '#241810', '#3c2414', '#4a3628'];
  const OLD_HAIRS = ['#8c8c94', '#c4c4c8', '#dcdcdc'];
  const BGS = [
    ['#123c4c', '#2c8c90'], ['#1c2c68', '#4c68c8'], ['#3c1c50', '#8858a8'],
    ['#0e4028', '#38a060'], ['#54240c', '#b06828'], ['#4c1424', '#b04858'],
    ['#243448', '#6c8ca8'], ['#442c10', '#c09040'], ['#101c30', '#4878a0'],
  ];
  const ROBES = [
    ['#a02020', '#e05050'], ['#1c3c88', '#4874d0'], ['#1c6838', '#3ca060'],
    ['#6c4890', '#a884c8'], ['#a88418', '#e8c850'], ['#2c2c3c', '#585870'],
    ['#8c4c18', '#cc8038'], ['#0e5c58', '#2c9490'], ['#78141c', '#c04048'],
  ];
  const METALS = [
    ['#8890a4', '#c8d0e0'], ['#7c7468', '#c0b8a4'], ['#6c7c8c', '#b4c4d4'], ['#8c7444', '#d8b868'],
  ];

  const SKIN_MAP = { red: '#cc6a4c', dark: '#9c7048', pale: '#f2d2b2', tan: '#e0ac84',
                     bronze: '#c08858', sallow: '#d8c088' };
  const HAIR_MAP = { black: '#181818', brown: '#3c2414', gray: '#8c8c94', white: '#dcdcdc' };
  const COL_MAP = {
    green: ['#1c6c34', '#38a058'], red: ['#a82020', '#e04848'], crimson: ['#8c1828', '#c83c50'],
    blue: ['#204090', '#4070d0'], teal: ['#186858', '#2c9078'], purple: ['#583060', '#8050a0'],
    gold: ['#b08820', '#e8c850'], yellow: ['#c8a818', '#f0e060'], white: ['#c8c8c0', '#f0f0e8'],
    black: ['#1c1c28', '#3c3c50'], brown: ['#6c4420', '#a06c38'], silver: ['#9c9cae', '#d8d8e8'],
    iron: ['#78788c', '#b0b0c4'],
  };
  const HAT_NAME = { topknot: 0, gwan: 1, helm: 2, silk: 3, warcloth: 4, crown: 5, daoist: 6,
                     feather: 7, phoenixhelm: 8, wrap: 9, fur: 10, facehelm: 11, bare: 12 };
  const BEARD_NAME = { none: 0, mustache: 1, goatee: 2, full: 3, long: 4, bushy: 5,
                       whitelong: 6, whisker: 7 };
  const EYES = ['normal', 'fierce', 'phoenix', 'ring', 'narrow', 'droop', 'small', 'sleepy'];

  /* ── 잡동사니 ───────────────────────────────────────────────────── */
  function hash(str) {
    const s = String(str == null ? '?' : str);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngOf(seed) {
    let s = seed || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function shade(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, v + d)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const clampi = (v, a, b) => Math.max(a, Math.min(b, v));
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  /* 0~1 밝기를 램프에서 골라 준다. 경계는 베이어로 흩뿌린다 */
  function tone(ramp, v, x, y) {
    const n = ramp.length - 1;
    const u = clampi(v, 0, 0.999) * n;
    const i = Math.floor(u);
    const f = u - i;
    return ramp[f > BAYER[y & 3][x & 3] / 16 ? Math.min(n, i + 1) : i];
  }

  function roundBox(g, x, y, w, h, r) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.fillRect(x + r, y, w - 2 * r, h);
    g.fillRect(x, y + r, w, h - 2 * r);
    for (let i = 0; i < r; i++) {
      const o = Math.round(r - Math.sqrt(Math.max(0, r * r - (r - i - 1) * (r - i - 1))));
      g.fillRect(x + o, y + i, w - 2 * o, 1);
      g.fillRect(x + o, y + h - 1 - i, w - 2 * o, 1);
    }
  }

  /* 금색 액자 */
  function frame(g, W, H) {
    const G0 = '#f8e088', G1 = '#d8a020', G2 = '#8c5c10', D = '#100800';
    g.fillStyle = D; g.fillRect(0, 0, W, H);
    g.fillStyle = G1; g.fillRect(1, 1, W - 2, H - 2);
    g.fillStyle = G0; g.fillRect(1, 1, W - 2, 1); g.fillRect(1, 1, 1, H - 2);
    g.fillStyle = G2; g.fillRect(1, H - 2, W - 2, 1); g.fillRect(W - 2, 1, 1, H - 2);
    g.fillStyle = D; g.fillRect(6, 6, W - 12, H - 12);
    g.fillStyle = G0;
    for (let x = 8; x < W - 8; x += 4) { g.fillRect(x, 3, 2, 1); g.fillRect(x, H - 4, 2, 1); }
    g.fillStyle = G2;
    for (let y = 10; y < H - 10; y += 6) { g.fillRect(2, y, 2, 2); g.fillRect(W - 4, y, 2, 2); }
    g.fillStyle = G0;
    [[2, 2], [W - 5, 2], [2, H - 5], [W - 5, H - 5]].forEach(([x, y]) => {
      g.fillRect(x, y, 3, 3); g.fillStyle = G2; g.fillRect(x + 1, y + 1, 2, 2); g.fillStyle = G0;
    });
  }

  /* ── 외부 삽화(js/art.js) ───────────────────────────────────────── */
  const artCache = {};
  function preload() {
    if (typeof ART === 'undefined' || !ART) return Promise.resolve(0);
    return Promise.all(Object.keys(ART).map(n => new Promise(res => {
      const im = new Image();
      im.onload = () => { artCache[n] = im; res(); };
      im.onerror = () => res();
      im.src = ART[n];
    }))).then(() => Object.keys(artCache).length);
  }
  const hasArt = n => !!artCache[n];

  /* ═════════════════════════════════════════════════════════════════
   *  특징 결정 — 이름 해시 + 능력치 + faces.js
   * ════════════════════════════════════════════════════════════════ */
  function traitsOf(name) {
    const h = hash(name);
    const bit = (sh, m) => (h >>> sh) % m;
    const gen = (typeof GENERALS !== 'undefined' && GENERALS[name]) || [50, 50, 50, 50, 50, 50, 5, 1];
    const war = gen[0], int = gen[1], pol = gen[2], cha = gen[3];
    const T = (typeof FACES !== 'undefined' && FACES[name]) || null;
    const old = (T && (T.hair === 'white' || T.hair === 'gray')) ||
      (!T && ((pol >= 86 && war < 46) || bit(2, 7) === 0));

    const t = {
      yaw: [0, -2, 2, -4, 4, -3, 3, -1, 1, -4, 4, -2][bit(26, 12)],
      faceIdx: bit(18, 5),
      headW: 48 + bit(19, 6),
      headH: 52 + bit(21, 4) * 2,
      jaw: bit(22, 3),
      skin: SKINS[bit(0, SKINS.length)],
      hair: old ? OLD_HAIRS[bit(1, OLD_HAIRS.length)] : HAIRS[bit(4, HAIRS.length)],
      bg: BGS[bit(3, BGS.length)],
      robe: ROBES[bit(6, ROBES.length)],
      metal: METALS[bit(7, METALS.length)],
      bgStyle: bit(8, 6),
      eye: war >= 88 ? (bit(9, 2) ? 'fierce' : 'ring')
        : int >= 90 ? 'narrow'
        : old ? (bit(9, 2) ? 'droop' : 'sleepy')
        : EYES[bit(9, EYES.length)],
      eyeW: 9 + bit(10, 5),
      eyeGap: 4 + bit(11, 4),
      browThick: 2 + bit(12, 3),
      browAngle: bit(13, 5) - 2,
      browBushy: war >= 78 && bit(14, 2) === 0,
      noseK: bit(15, 4),
      noseLen: 11 + bit(16, 6),
      mouthK: bit(17, 4),
      mouthW: 9 + bit(23, 7),
      beard: old ? (bit(24, 3) ? 6 : 4)
        : [0, 1, 2, 3, 4, 5, 7, 2, 3, 1][bit(24, 10)],
      beardLen: 12 + bit(25, 16),
      hat: war >= 84 ? [2, 2, 8, 4, 11, 2][bit(27, 6)]
        : (pol >= 80 || int >= 88) ? [1, 1, 3, 9, 6, 1][bit(27, 6)]
        : [0, 1, 3, 4, 9, 10, 2, 12][bit(27, 8)],
      shoulder: war >= 80 ? [1, 1, 3, 2][bit(28, 4)]
        : pol >= 78 ? [0, 5, 0, 4][bit(28, 4)]
        : bit(28, 6),
      hatCol: null,
      jewel: bit(29, 4) === 0,
      earring: bit(30, 7) === 0,
      scar: war >= 85 && bit(31, 4) === 0,
      patch: false, ear: 0, fan: 0, old, ruler: false,
    };

    if (T) {
      if (T.skin) t.skin = SKIN_MAP[T.skin] || t.skin;
      if (T.hair) t.hair = HAIR_MAP[T.hair] || t.hair;
      if (T.bg) t.bg = COL_MAP[T.bg] || t.bg;
      if (T.robe) t.robe = COL_MAP[T.robe] || t.robe;
      if (T.color) t.hatCol = COL_MAP[T.color] || null;
      if (T.hat !== undefined && HAT_NAME[T.hat] !== undefined) t.hat = HAT_NAME[T.hat];
      if (T.eye) { if (T.eye === 'patch') { t.patch = true; t.eye = 'fierce'; } else t.eye = T.eye; }
      if (T.beard && BEARD_NAME[T.beard] !== undefined) t.beard = BEARD_NAME[T.beard];
      if (T.beardLen) t.beardLen = T.beardLen;
      if (T.face !== undefined) t.faceIdx = clampi(T.face, 0, 4);
      if (T.yaw !== undefined) t.yaw = T.yaw;
      if (T.shoulder !== undefined) t.shoulder = T.shoulder;
      if (T.jaw !== undefined) t.jaw = T.jaw;
      if (T.young) { t.headW = 48; if (t.beard === 4 || t.beard === 6) t.beard = 1; }
      if (T.fat) { t.headW = 55; t.faceIdx = 0; t.jaw = 0; }
      if (T.ear) t.ear = 1;
      if (T.fan) t.fan = 1;
    }
    if (t.hat === 2 || t.hat === 8 || t.hat === 11) { if (t.shoulder === 0 || t.shoulder === 5) t.shoulder = 1; }
    return t;
  }

  /* ── 배경 ───────────────────────────────────────────────────────── */
  function backdrop(g, x, y, w, h, pal, style) {
    const [a, b] = pal;
    const ramp = [shade(a, -22), a, shade(a, 26), mix(a, b, 0.55), b, shade(b, 20)];
    const cxx = w / 2, cyy = h * 0.38;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let u;
      if (style === 0) u = 1 - j / h;
      else if (style === 1) u = j / h;
      else if (style === 2) u = 1.05 - Math.hypot((i - cxx) / cxx, (j - cyy) / cyy) * 0.9;
      else if (style === 3) u = 1 - (i + j) / (w + h);
      else if (style === 4) u = 0.25 + (((j / 8) | 0) % 2) * 0.5;
      else u = 1 - i / w;
      g.fillStyle = tone(ramp, u, x + i, y + j);
      g.fillRect(x + i, y + j, 1, 1);
    }
  }
  function mix(c1, c2, t) {
    const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const a = p(c1), b = p(c2);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  /* ═════════════════════════════════════════════════════════════════
   *  본체
   * ════════════════════════════════════════════════════════════════ */
  function draw(canvas, name, opt) {
    opt = opt || {};
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    if (artCache[name]) { g.drawImage(artCache[name], 0, 0, W, H); return canvas; }
    frame(g, W, H);

    const IX = 6, IY = 6, IW = W - 12, IH = H - 12;
    const t = traitsOf(name);
    t.ruler = !!opt.ruler;
    const rnd = rngOf((hash(name) ^ 0x9e3779b9) >>> 0);

    g.save();
    g.beginPath(); g.rect(IX, IY, IW, IH); g.clip();
    backdrop(g, IX, IY, IW, IH, t.bg, t.bgStyle);

    const yaw = t.yaw;
    const cx = IX + (IW >> 1) - yaw;
    const headW = t.headW, headH = t.headH;
    const hy = IY + 24, chin = hy + headH;
    const lightL = yaw <= 0;
    const skin = t.skin;
    const sL = shade(skin, 22), sD = shade(skin, -30), sD2 = shade(skin, -48), sE = shade(skin, -66);

    /* 윤곽 프로필 */
    const FACE = [
      [.80, .94, 1.00, 1.00, .96, .88, .74, .54],
      [.72, .88, .97, 1.00, .95, .86, .70, .46],
      [.84, .97, 1.00, .99, .92, .80, .64, .48],
      [.76, .90, .99, 1.00, .99, .94, .84, .62],
      [.70, .86, .96, 1.00, .92, .80, .62, .38],
    ][clampi(t.faceIdx, 0, 4)];
    const rowW = j => {
      const u = clampi(j, 0, headH - 1) / headH * (FACE.length - 1);
      const i = Math.min(FACE.length - 2, Math.floor(u)), f = u - i;
      let w = headW * (FACE[i] * (1 - f) + FACE[i + 1] * f);
      if (t.jaw === 1 && j > headH * 0.7) w += 2;
      if (t.jaw === 2 && j > headH * 0.7) w -= 2;
      return Math.max(6, Math.round(w));
    };
    const rowC = j => cx + Math.round(yaw * 0.35 * (1 - Math.abs(clampi(j, 0, headH) / headH - 0.42) * 1.2));
    const FSH = Math.round(yaw * 1.5);        // 이목구비를 미는 양 (얼굴이 돌아 보이는 핵심)

    const eyY = hy + Math.round(headH * 0.46);
    const nY = eyY + 2;
    const noseBot = Math.min(chin - 13, nY + t.noseLen);
    const shY = chin + 3;

    /* ── 어깨 ── */
    paintShoulder(g, t, IX, IY, IW, IH, cx, shY, yaw);

    /* ── 목 ── */
    const neckW = 14 + Math.round((headW - 42) * 0.6);
    g.fillStyle = sD2; g.fillRect(cx - (neckW >> 1) + yaw, chin - 8, neckW, 13);
    g.fillStyle = sD; g.fillRect(cx - (neckW >> 1) + yaw + 1, chin - 8, neckW - 3, 11);
    g.fillStyle = sE; g.fillRect(cx - (neckW >> 1) + yaw, chin - 8, neckW, 3);

    /* ── 얼굴 ── */
    const RAMP = [sE, sD2, sD, skin, sL, shade(skin, 42)];
    const eyeU = 0.46, browU = 0.40;
    for (let j = -1; j <= headH; j++) {                 // 윤곽선
      const jj = clampi(j, 0, headH - 1);
      const w = rowW(jj) + 2, c = rowC(jj);
      g.fillStyle = sE; g.fillRect(c - (w >> 1), hy + j, w, 1);
    }
    for (let j = 0; j < headH; j++) {
      const w = rowW(j), c = rowC(j), l = c - (w >> 1), r = l + w;
      const ny = j / headH;
      for (let x = l; x < r; x++) {
        const nx = (x - c) / Math.max(1, w / 2);
        const sph = Math.sqrt(Math.max(0, 1 - nx * nx * 0.88));      // 얼굴을 둥글게
        let v = 0.26 + sph * 0.46 - (lightL ? nx : -nx) * 0.30;
        v -= Math.max(0, ny - 0.74) * 1.10;                          // 턱 아래
        v -= Math.max(0, 0.12 - ny) * 1.30;                          // 이마 위(관 그림자)
        if (ny > browU && ny < eyeU + 0.03) v -= 0.13;               // 눈두덩
        if (ny > 0.56 && ny < 0.72) v += 0.10 * (1 - Math.abs(nx + (lightL ? 0.45 : -0.45)) * 2); // 광대
        if (ny > 0.80) v -= 0.06;
        if (yaw !== 0) v -= (yaw > 0 ? -nx : nx) * 0.16;      // 돌아본 쪽 반대편이 어둡다
        g.fillStyle = tone(RAMP, v, x, hy + j);
        g.fillRect(x, hy + j, 1, 1);
      }
    }

    /* 3/4 얼굴의 코 옆선 */
    if (yaw !== 0) {
      const dir = yaw > 0 ? 1 : -1;
      for (let j = nY - 2; j < noseBot + 3; j++) {
        const u = (j - (nY - 2)) / Math.max(1, noseBot + 3 - (nY - 2));
        const bump = Math.round(Math.sin(u * Math.PI) * (2 + Math.abs(yaw)));
        if (bump <= 0) continue;
        const jj = j - hy, w = rowW(jj), c = rowC(jj);
        const x = dir > 0 ? c + (w >> 1) : c - (w >> 1) - bump;
        g.fillStyle = sE; g.fillRect(x, j, bump + 1, 1);
        g.fillStyle = u < 0.55 ? sL : sD;
        g.fillRect(x + (dir > 0 ? 0 : 1), j, bump, 1);
      }
    }
    /* 이마 주름 */
    if (t.old) {
      g.fillStyle = sD2;
      for (let k = 0; k < 3; k++) {
        const jj = 8 + k * 3, w = rowW(jj) - 14;
        if (w > 4) g.fillRect(rowC(jj) - (w >> 1), hy + jj, w, 1);
      }
    }

    /* ── 귀 ── */
    const earJ = Math.round(headH * 0.45);
    const earY = hy + earJ - 2, earH = t.ear ? 17 : 11;
    const ew = rowW(earJ) >> 1;
    const drawEar = side => {
      const x = side < 0 ? rowC(earJ) - ew - 3 : rowC(earJ) + ew - 1;
      g.fillStyle = sD; g.fillRect(x, earY, 4, earH);
      g.fillStyle = sE; g.fillRect(x + 1, earY + 3, 2, earH - 6);
      if (t.earring) { g.fillStyle = '#f0d040'; g.fillRect(x + 1, earY + earH, 2, 2); }
    };
    if (yaw <= 0) drawEar(1);
    if (yaw >= 0) drawEar(-1);

    /* ── 눈썹 · 눈 ── */
    const ec = rowC(headH * 0.46);
    const eW = t.eyeW, gap = t.eyeGap;
    const nearRight = yaw < 0;
    const eyes = [
      { x: ec - gap - eW + FSH, w: Math.max(5, eW - (nearRight ? 4 : 0)), side: -1 },
      { x: ec + gap + FSH, w: Math.max(5, eW - (nearRight ? 0 : 4)), side: 1 },
    ];
    eyes.forEach(e => { drawBrow(g, t, e, eyY); drawEye(g, t, e, eyY, sE); });
    if (t.patch) drawPatch(g, t, eyes[1], eyY, rowC(headH * 0.4), rowW(headH * 0.4));

    /* ── 코 ── */
    drawNose(g, t, ec + FSH + Math.round(yaw * 0.3), nY, noseBot, yaw, sD, sD2, sE, sL);

    /* ── 입 ── */
    const mY = chin - 14;
    const mc = rowC(headH * 0.82) + Math.round(FSH * 0.85);
    drawMouth(g, t, mc, mY, sE);

    /* ── 수염 ── */
    drawBeard(g, t, mc, mY, hy, headH, rowW, rowC);

    /* ── 흉터 ── */
    if (t.scar) {
      g.fillStyle = shade(skin, -78);
      const jj = Math.round(headH * 0.32);
      const sx = rowC(jj) + (lightL ? 1 : -1) * (rowW(jj) >> 2);
      for (let k = 0; k < 13; k++) g.fillRect(sx + ((k / 5) | 0), hy + jj + k - 4, 1, 1);
    }

    /* ── 머리 · 관 ── */
    paintHead(g, t, cx, hy, headH, rowW, rowC, yaw);

    /* ── 백우선 ── */
    if (t.fan) {
      const fx = IX + IW - 20, fy = IY + IH - 38;
      g.fillStyle = '#6c4420'; g.fillRect(fx + 7, fy + 16, 3, 22);
      g.fillStyle = '#f4f4ec';
      for (let j = 0; j < 17; j++) {
        const w = 19 - Math.abs(8 - j);
        g.fillRect(fx + 9 - (w >> 1), fy + j, w, 1);
      }
      g.fillStyle = '#c4c4bc';
      for (let i = 0; i < 5; i++) g.fillRect(fx + 1 + i * 4, fy + 3, 1, 12);
    }

    g.restore();
    return canvas;
  }

  /* ── 눈썹 ───────────────────────────────────────────────────────── */
  function drawBrow(g, t, e, eyY) {
    const th = t.browThick, side = e.side;
    const y0 = eyY - 9 + t.browAngle * (side < 0 ? -1 : 1) * 0.5;
    g.fillStyle = t.hair;
    for (let i = 0; i < e.w; i++) {
      const u = i / Math.max(1, e.w - 1);
      const outer = side < 0 ? u : 1 - u;              // 바깥쪽 끝
      let dy = 0;
      if (t.eye === 'fierce' || t.eye === 'ring') dy = -Math.round(outer * 3);
      else if (t.eye === 'droop' || t.eye === 'sleepy') dy = Math.round(outer * 2);
      else dy = -Math.round(Math.sin(u * Math.PI) * 1.2);
      const h = th - (outer > 0.75 ? 1 : 0);
      g.fillRect(e.x + i, Math.round(y0 + dy), 1, Math.max(1, h));
    }
    if (t.browBushy) {
      g.fillStyle = shade(t.hair, 16);
      for (let i = 0; i < e.w; i += 2) g.fillRect(e.x + i, Math.round(y0) - 2, 1, 2);
    }
  }

  /* ── 눈 ─────────────────────────────────────────────────────────── */
  function drawEye(g, t, e, eyY, sE) {
    const k = t.eye, w = e.w, x = e.x, side = e.side;
    if (k === 'narrow' || k === 'phoenix' || k === 'small' || k === 'sleepy') {
      const h = k === 'small' ? 2 : 3;
      g.fillStyle = '#141420'; g.fillRect(x, eyY, w, 1);
      g.fillStyle = '#efe8e0'; g.fillRect(x + 1, eyY + 1, w - 2, h - 1);
      g.fillStyle = '#141420'; g.fillRect(x + (w >> 1) - 1, eyY + 1, 3, h - 1);
      g.fillStyle = sE; g.fillRect(x, eyY + h, w, 1);
      if (k === 'phoenix') { g.fillStyle = '#141420'; g.fillRect(side < 0 ? x + w - 2 : x, eyY - 1, 2, 1); }
      if (k === 'sleepy') { g.fillStyle = sE; g.fillRect(x, eyY - 1, w, 1); }
      return;
    }
    if (k === 'ring') {
      g.fillStyle = '#141420'; g.fillRect(x, eyY - 1, w, 1); g.fillRect(x, eyY + 5, w, 1);
      g.fillStyle = '#efe8e0'; g.fillRect(x, eyY, w, 5);
      g.fillStyle = '#141420'; g.fillRect(x + (w >> 1) - 2, eyY, 5, 5);
      g.fillStyle = '#f8f8f8'; g.fillRect(x + (w >> 1) - 1, eyY + 1, 1, 1);
      g.fillStyle = sE; g.fillRect(x, eyY + 6, w, 1);
      return;
    }
    const h = k === 'fierce' ? 5 : 4;
    g.fillStyle = '#141420'; g.fillRect(x + 1, eyY, w - 2, 1);
    g.fillStyle = '#efe8e0'; g.fillRect(x + 1, eyY + 1, w - 2, h - 2);
    g.fillStyle = '#141420'; g.fillRect(x + (w >> 1) - 2, eyY + 1, 4, h - 2);
    g.fillStyle = '#f8f8f8'; g.fillRect(x + (w >> 1) - 1, eyY + 1, 1, 1);
    g.fillStyle = sE; g.fillRect(x + 1, eyY + h - 1, w - 2, 1);
    if (k === 'droop') { g.fillStyle = sE; g.fillRect(side < 0 ? x : x + w - 2, eyY + h, 2, 1); }
  }

  function drawPatch(g, t, e, eyY, faceC, faceW) {
    g.fillStyle = '#181820';
    for (let j = 0; j < 30; j++) {
      const x = faceC - (faceW >> 1) - 2 + j;
      g.fillRect(x, eyY - 8 + Math.round(j * 0.36), 1, 3);
    }
    g.fillStyle = '#101018'; roundBox(g, e.x - 3, eyY - 4, e.w + 6, 11, 3);
    g.fillStyle = '#2c2c3c'; g.fillRect(e.x - 1, eyY - 3, e.w + 2, 2);
  }

  /* ── 코 ─────────────────────────────────────────────────────────── */
  function drawNose(g, t, x, nY, noseBot, yaw, sD, sD2, sE, sL) {
    const dir = yaw >= 0 ? 1 : -1;
    const wid = t.noseK === 2 ? 7 : 5;
    for (let j = nY; j < noseBot; j++) {
      const u = (j - nY) / Math.max(1, noseBot - nY);
      let w = Math.round(wid * (0.45 + u * 0.55));
      if (t.noseK === 1 && u > 0.55) w += 1;
      if (t.noseK === 3) w = Math.max(3, w - 1);
      g.fillStyle = sD2; g.fillRect(x - (w >> 1), j, w, 1);
      g.fillStyle = sL; g.fillRect(x - (w >> 1) + (dir > 0 ? 0 : Math.max(0, w - 1)), j, 1, 1);
    }
    g.fillStyle = sE; g.fillRect(x - (wid >> 1) - 1, noseBot - 1, wid + 2, 2);
    g.fillStyle = shade(sE, -16);
    g.fillRect(x - (wid >> 1), noseBot - 1, 1, 1);
    g.fillRect(x + (wid >> 1), noseBot - 1, 1, 1);
  }

  /* ── 입 ─────────────────────────────────────────────────────────── */
  function drawMouth(g, t, mc, mY, sE) {
    const w = t.mouthW, x = mc - (w >> 1), lip = '#94443c';
    if (t.mouthK === 0) { g.fillStyle = lip; g.fillRect(x, mY, w, 2); }
    else if (t.mouthK === 1) {
      g.fillStyle = shade(lip, -22); g.fillRect(x, mY, w, 1);
      g.fillStyle = lip; g.fillRect(x + 1, mY + 1, w - 2, 1);
    } else if (t.mouthK === 2) {
      g.fillStyle = lip; g.fillRect(x + 1, mY, w - 2, 2);
      g.fillStyle = sE; g.fillRect(x, mY + 1, 2, 1); g.fillRect(x + w - 2, mY + 1, 2, 1);
    } else {
      g.fillStyle = shade(lip, -32); g.fillRect(x + 1, mY, w - 2, 3);
      g.fillStyle = '#e8d8c8'; g.fillRect(x + 2, mY + 1, w - 4, 1);
    }
    g.fillStyle = sE; g.fillRect(x, mY + 3, w, 1);
  }

  /* ── 수염 ───────────────────────────────────────────────────────── */
  function drawBeard(g, t, mc, mY, hy, headH, rowW, rowC) {
    const k = t.beard;
    if (k === 0) return;
    const hair = k === 6 ? '#dcdcdc' : t.hair;
    const hi = shade(hair, 26), lo = shade(hair, -24);
    const mw = t.mouthW;
    const sideburn = () => {
      const jj = Math.round(headH * 0.62), sw = rowW(jj) >> 1, c = rowC(jj);
      g.fillStyle = hair;
      g.fillRect(c - sw - 1, hy + Math.round(headH * 0.46), 3, 13);
      g.fillRect(c + sw - 2, hy + Math.round(headH * 0.46), 3, 13);
    };
    g.fillStyle = hair;
    if (k !== 7) {                                   // 콧수염 : 인중을 비운다
      const half = Math.max(5, (mw >> 1) + 3);
      g.fillRect(mc - half - 3, mY - 4, half, 3);
      g.fillRect(mc + 3, mY - 4, half, 3);
      g.fillRect(mc - half - 5, mY - 3, 3, 2);
      g.fillRect(mc + half + 2, mY - 3, 3, 2);
    }
    if (k === 1) return;
    if (k === 2) {                                   // 염소턱 : 아랫입술 아래에서 시작
      g.fillStyle = hair; g.fillRect(mc - 3, mY + 6, 7, 7);
      g.fillStyle = hi; g.fillRect(mc - 1, mY + 7, 2, 4);
      return;
    }
    if (k === 3) {                                   // 턱수염
      for (let j = 0; j < 11; j++) {
        const w = 15 - Math.abs(4 - j);
        g.fillStyle = hair; g.fillRect(mc - (w >> 1), mY + 5 + j, w, 1);
      }
      g.fillStyle = hi; g.fillRect(mc - 3, mY + 7, 2, 5);
      sideburn();
      return;
    }
    if (k === 5) {                                   // 범수염
      for (let j = 0; j < 10; j++) {
        const w = 17 - Math.abs(4 - j);
        g.fillStyle = hair; g.fillRect(mc - (w >> 1), mY + 5 + j, w, 1);
      }
      g.fillStyle = lo;
      for (let j = 0; j < 9; j++) {
        g.fillRect(mc - 17 - (j & 1) * 3, mY - 3 + j, 6, 1);
        g.fillRect(mc + 12 + (j & 1) * 3, mY - 3 + j, 6, 1);
      }
      g.fillStyle = hi; g.fillRect(mc - 5, mY + 5, 2, 6);
      sideburn();
      return;
    }
    if (k === 7) { sideburn(); return; }
    /* 4 · 6 : 장수염 */
    const len = t.beardLen;
    for (let j = 0; j < len; j++) {
      const u = j / len;
      const w = Math.max(4, Math.round(13 - u * 9));
      const sway = Math.round(Math.sin(j / 5) * 1.6) + Math.round(t.yaw * u * 1.4);
      g.fillStyle = hair; g.fillRect(mc - (w >> 1) + sway, mY + 5 + j, w, 1);
      if (j % 5 === 2) { g.fillStyle = lo; g.fillRect(mc - (w >> 1) + sway + 1, mY + 5 + j, 2, 1); }
      if (j % 7 === 3) { g.fillStyle = hi; g.fillRect(mc + sway, mY + 5 + j, 2, 1); }
    }
    sideburn();
  }

  /* ── 어깨 ───────────────────────────────────────────────────────── */
  function paintShoulder(g, t, IX, IY, IW, IH, cx, shY, yaw) {
    const r0 = t.robe[0], r1 = t.robe[1], m0 = t.metal[0], m1 = t.metal[1];
    const bot = IY + IH, hgt = bot - shY;
    g.fillStyle = r0; g.fillRect(IX, shY, IW, hgt);
    g.fillStyle = shade(r0, -42); g.fillRect(IX, shY, IW, 2);
    g.fillStyle = shade(r0, -26);
    for (let j = 0; j < hgt; j++) {
      const w = Math.max(0, 14 - j);
      g.fillRect(IX, shY + j, w, 1);
      g.fillRect(IX + IW - w, shY + j, w, 1);
    }
    g.fillStyle = r1;
    for (let j = 0; j < hgt; j++) g.fillRect(IX + 3, shY + 2 + j, Math.max(0, 11 - j), 1);

    if (t.shoulder === 1 || t.shoulder === 3) {
      g.fillStyle = m0; g.fillRect(IX, shY, IW, 15);
      g.fillStyle = m1;
      for (let j = 0; j < 15; j += 4) for (let i = ((j / 4) & 1) * 4; i < IW; i += 8) g.fillRect(IX + i, shY + j, 5, 3);
      g.fillStyle = shade(m0, -44); g.fillRect(IX, shY + 14, IW, 2);
      if (t.shoulder === 3) {
        g.fillStyle = m1; g.fillRect(IX, shY - 2, 21, 7); g.fillRect(IX + IW - 21, shY - 2, 21, 7);
        g.fillStyle = shade(m0, -40); g.fillRect(IX, shY + 4, 21, 1); g.fillRect(IX + IW - 21, shY + 4, 21, 1);
        g.fillStyle = '#d8a020'; g.fillRect(IX + 5, shY, 5, 3); g.fillRect(IX + IW - 10, shY, 5, 3);
      }
    } else if (t.shoulder === 2) {
      g.fillStyle = m0; g.fillRect(IX, shY, IW, 17);
      g.fillStyle = shade(m1, -12);
      for (let j = 0; j < 17; j += 2) for (let i = ((j / 2) & 1) * 2; i < IW; i += 4) g.fillRect(IX + i, shY + j, 2, 1);
    } else if (t.shoulder === 4) {
      for (let i = 0; i < IW; i += 3) {
        g.fillStyle = ((i / 3) & 1) ? '#8c7458' : '#5c4c3c';
        g.fillRect(IX + i, shY - 3, 3, 9 + ((i / 3) % 3) * 2);
      }
    } else if (t.shoulder === 5) {
      g.fillStyle = shade(r0, -36); g.fillRect(cx - 14, shY + 6, 28, 17);
      g.fillStyle = '#d8a020'; g.fillRect(cx - 12, shY + 8, 24, 13);
      g.fillStyle = shade(r0, -52); g.fillRect(cx - 8, shY + 11, 16, 7);
      g.fillStyle = '#f0d860'; g.fillRect(cx - 5, shY + 13, 10, 3);
    }
    const cw = (t.shoulder === 1 || t.shoulder === 3 || t.shoulder === 2) ? '#d8d8c8' : '#e8e0cc';
    g.fillStyle = cw;
    for (let j = 0; j < 9; j++) {
      g.fillRect(cx - 8 - j + yaw, shY + j, 3, 1);
      g.fillRect(cx + 5 + j + yaw, shY + j, 3, 1);
    }
    g.fillStyle = shade(r0, -54);
    for (let j = 0; j < 9; j++) {
      g.fillRect(cx - 5 - j + yaw, shY + j, 2, 1);
      g.fillRect(cx + 3 + j + yaw, shY + j, 2, 1);
    }
  }

  /* ── 머리카락 · 관 ──────────────────────────────────────────────── */
  function paintHead(g, t, cx, hy, headH, rowW, rowC, yaw) {
    const hw = rowW(3), hx = rowC(3) - (hw >> 1);
    const HC = t.hatCol, m0 = t.metal[0], m1 = t.metal[1];
    const gold0 = '#b08820', gold1 = '#f0d860';
    const hat = t.hat;

    if (hat !== 5 && hat !== 11) {
      g.fillStyle = t.hair; g.fillRect(hx + 1, hy - 2, hw - 2, 7);
      g.fillStyle = shade(t.hair, 18); g.fillRect(hx + 3, hy - 1, Math.max(2, hw - 15), 2);
    }

    if (hat === 12) {
      g.fillStyle = t.hair; g.fillRect(hx + 1, hy - 7, hw - 2, 9);
      g.fillRect(cx - 4, hy - 13, 8, 7);
      g.fillStyle = shade(t.hair, 22); g.fillRect(cx - 2, hy - 12, 3, 5);
    } else if (hat === 0) {
      const c = HC ? HC[0] : t.robe[0];
      g.fillStyle = t.hair; g.fillRect(hx + 3, hy - 11, hw - 6, 13);
      g.fillRect(cx - 4, hy - 17, 8, 8);
      g.fillStyle = c; g.fillRect(hx, hy + 1, hw, 5);
      g.fillStyle = shade(c, 34); g.fillRect(hx, hy + 1, hw, 1);
      g.fillStyle = c; g.fillRect(hx + hw - 2, hy + 2, 6, 13);
    } else if (hat === 1) {
      const c0 = HC ? HC[0] : '#14141f', c1 = HC ? HC[1] : '#32324c';
      g.fillStyle = '#080810'; g.fillRect(hx - 4, hy - 9, hw + 8, 13);
      g.fillStyle = c0; g.fillRect(hx - 3, hy - 8, hw + 6, 11);
      g.fillStyle = c1; g.fillRect(hx - 3, hy - 8, hw + 6, 2);
      g.fillStyle = c0; roundBox(g, hx + 4, hy - 19, hw - 8, 13, 3);
      g.fillStyle = gold0; g.fillRect(cx - 5, hy - 17, 10, 3);
      if (t.jewel) { g.fillStyle = '#40d0e0'; g.fillRect(cx - 2, hy - 17, 4, 3); }
      const wing = 9 + (t.faceIdx & 1) * 4;
      g.fillStyle = c0;
      g.fillRect(hx - 3 - wing, hy - 6 + yaw, wing, 4);
      g.fillRect(hx + hw + 3, hy - 6 - yaw, wing, 4);
      g.fillStyle = c1;
      g.fillRect(hx - 3 - wing, hy - 6 + yaw, wing, 1);
      g.fillRect(hx + hw + 3, hy - 6 - yaw, wing, 1);
    } else if (hat === 3) {
      const c = HC ? HC[0] : shade(t.robe[0], -18);
      g.fillStyle = shade(c, -56); roundBox(g, hx - 3, hy - 17, hw + 6, 22, 6);
      g.fillStyle = c; roundBox(g, hx - 2, hy - 16, hw + 4, 20, 5);
      g.fillStyle = shade(c, 34); g.fillRect(hx + 2, hy - 15, Math.max(3, hw - 13), 2);
      g.fillStyle = shade(c, -34); g.fillRect(hx - 2, hy + 1, hw + 4, 3);
      g.fillStyle = c; g.fillRect(hx + hw, hy - 10, 7, 18);
      g.fillStyle = shade(c, -46); g.fillRect(hx + hw, hy + 4, 7, 2);
    } else if (hat === 9) {
      const c = HC ? HC[0] : t.robe[1];
      g.fillStyle = shade(c, -56); roundBox(g, hx - 3, hy - 14, hw + 6, 19, 7);
      g.fillStyle = c; roundBox(g, hx - 2, hy - 13, hw + 4, 17, 6);
      g.fillStyle = shade(c, -32);
      for (let j = 0; j < 15; j += 3) g.fillRect(hx - 2, hy - 13 + j, hw + 4, 1);
      g.fillStyle = shade(c, 30); g.fillRect(hx + 2, hy - 12, Math.max(3, hw - 17), 2);
      g.fillStyle = c; g.fillRect(cx - 3, hy - 18, 7, 6);
      g.fillStyle = shade(c, -42); g.fillRect(cx - 1, hy - 17, 2, 4);
      g.fillStyle = c; g.fillRect(hx + hw - 1, hy - 4, 8, 5); g.fillRect(hx + hw + 3, hy + 1, 5, 10);
    } else if (hat === 10) {
      for (let i = 0; i < hw + 6; i += 3) {
        g.fillStyle = ((i / 3) & 1) ? '#8c7458' : '#5c4c3c';
        g.fillRect(hx - 3 + i, hy - 14, 3, 8);
      }
      g.fillStyle = '#6c5844'; roundBox(g, hx - 3, hy - 8, hw + 6, 11, 4);
      g.fillStyle = HC ? HC[0] : t.robe[0]; g.fillRect(hx - 2, hy - 5, hw + 4, 6);
      g.fillStyle = gold0; g.fillRect(cx - 4, hy - 4, 8, 3);
    } else if (hat === 2) {
      const c0 = HC ? HC[0] : m0, c1 = HC ? HC[1] : m1, dk = shade(c0, -60);
      g.fillStyle = dk; roundBox(g, hx - 5, hy - 17, hw + 10, 24, 8);      // 외곽선
      g.fillStyle = c0; roundBox(g, hx - 4, hy - 16, hw + 8, 22, 7);
      g.fillStyle = c1; g.fillRect(hx + 3, hy - 15, 8, 18);                // 왼쪽 광
      g.fillStyle = shade(c0, -34);                                        // 마루 능선
      g.fillRect(cx - 2 + Math.round(yaw * 0.6), hy - 16, 4, 16);
      g.fillStyle = gold0; g.fillRect(hx - 4, hy - 2, hw + 8, 4);          // 이마 금테
      g.fillStyle = gold1; g.fillRect(hx - 4, hy - 2, hw + 8, 1);
      if (t.jewel) { g.fillStyle = '#40d0e0'; g.fillRect(cx - 3, hy - 2, 6, 4); }
      g.fillStyle = gold0; g.fillRect(cx - 6, hy - 22, 12, 6);             // 술 받침
      g.fillStyle = gold1; g.fillRect(cx - 4, hy - 21, 8, 2);
      for (let j = 0; j < 14; j++) {                                       // 붉은 술
        const w = 9 - Math.round(j * 0.35);
        g.fillStyle = (j & 1) ? '#e83c30' : '#b82418';
        g.fillRect(cx - (w >> 1) + ((j & 2) ? 1 : -1), hy - 34 + j, w, 1);
      }
      g.fillStyle = '#f88c70'; g.fillRect(cx - 1, hy - 33, 2, 9);
      g.fillStyle = dk;                                                    // 볼가리개
      g.fillRect(hx - 8, hy + 5 + yaw, 7, 21); g.fillRect(hx + hw + 1, hy + 5 - yaw, 7, 21);
      g.fillStyle = c0;
      g.fillRect(hx - 7, hy + 6 + yaw, 5, 19); g.fillRect(hx + hw + 2, hy + 6 - yaw, 5, 19);
      g.fillStyle = shade(c0, -46);
      g.fillRect(hx - 7, hy + 13 + yaw, 5, 2); g.fillRect(hx + hw + 2, hy + 13 - yaw, 5, 2);
    } else if (hat === 11) {
      g.fillStyle = m0; roundBox(g, hx - 4, hy - 17, hw + 8, 25, 8);
      g.fillStyle = m1; g.fillRect(hx + 2, hy - 16, 8, 19);
      g.fillStyle = shade(m0, -48); g.fillRect(hx - 4, hy + 4, hw + 8, 4);
      g.fillStyle = gold0; g.fillRect(hx - 4, hy - 3, hw + 8, 3);
      g.fillStyle = m0;
      g.fillRect(hx - 6, hy + 8 + yaw, 7, 25); g.fillRect(hx + hw - 1, hy + 8 - yaw, 7, 25);
      g.fillStyle = shade(m0, -32);
      g.fillRect(hx - 6, hy + 20 + yaw, 7, 2); g.fillRect(hx + hw - 1, hy + 20 - yaw, 7, 2);
      g.fillStyle = '#f0d040';
      for (let j = 0; j < 10; j++) g.fillRect(cx - 3 + (j & 1), hy - 26 + j, 5, 1);
    } else if (hat === 8) {
      const c0 = HC ? HC[0] : m0, c1 = HC ? HC[1] : m1;
      g.fillStyle = c0; roundBox(g, hx - 3, hy - 16, hw + 6, 22, 7);
      g.fillStyle = c1; g.fillRect(hx + 4, hy - 15, 7, 17);
      g.fillStyle = shade(c0, -44); g.fillRect(hx - 3, hy + 2, hw + 6, 4);
      g.fillStyle = gold1; g.fillRect(cx - 6, hy - 21, 12, 6);
      g.fillStyle = '#40d0e0'; g.fillRect(cx - 2, hy - 20, 4, 4);
      for (let j = 0; j < 17; j++) {
        const u = j / 17, w = 3 + Math.round(u * 3);
        const lx = cx - 10 - Math.round(u * 8), rx = cx + 8 + Math.round(u * 8);
        g.fillStyle = '#101018'; g.fillRect(lx - 1, hy - 13 - j, w + 2, 1); g.fillRect(rx - 1, hy - 13 - j, w + 2, 1);
        g.fillStyle = (j % 4 === 0) ? '#c4c4d4' : '#f4f4fc';
        g.fillRect(lx, hy - 13 - j, w, 1); g.fillRect(rx, hy - 13 - j, w, 1);
      }
      g.fillStyle = c0;
      g.fillRect(hx - 7, hy + 6 + yaw, 5, 18); g.fillRect(hx + hw + 2, hy + 6 - yaw, 5, 18);
    } else if (hat === 4) {
      const c = HC ? HC[0] : shade(t.robe[1], -12);
      g.fillStyle = shade(c, -56); roundBox(g, hx - 3, hy - 14, hw + 6, 19, 6);
      g.fillStyle = c; roundBox(g, hx - 2, hy - 13, hw + 4, 17, 5);
      g.fillStyle = shade(c, 32); g.fillRect(hx + 3, hy - 12, Math.max(3, hw - 15), 2);
      g.fillStyle = gold0; g.fillRect(cx - 7, hy - 11, 14, 3);
      if (t.jewel) { g.fillStyle = '#e04040'; g.fillRect(cx - 2, hy - 11, 4, 3); }
      g.fillStyle = shade(c, -38); g.fillRect(hx - 2, hy + 1, hw + 4, 3);
      g.fillStyle = c; g.fillRect(hx - 8, hy - 6, 7, 16);
      g.fillStyle = shade(c, -46); g.fillRect(hx - 8, hy + 4, 7, 2);
    } else if (hat === 5) {
      const c0 = HC ? HC[0] : gold0, c1 = HC ? HC[1] : gold1;
      g.fillStyle = '#14141f'; g.fillRect(hx - 2, hy - 9, hw + 4, 11);
      g.fillStyle = c0; g.fillRect(hx - 4, hy - 14, hw + 8, 6);
      g.fillStyle = c1; g.fillRect(hx - 4, hy - 14, hw + 8, 2);
      g.fillStyle = '#14141f'; g.fillRect(hx - 11, hy - 20, hw + 22, 5);
      g.fillStyle = c1; g.fillRect(hx - 11, hy - 20, hw + 22, 1);
      for (let i = 0; i < 6; i++) {
        const bx = hx - 9 + i * 9;
        g.fillStyle = '#f8f0c0'; g.fillRect(bx, hy - 15, 2, 3);
        g.fillStyle = '#e04040'; g.fillRect(bx, hy - 12, 2, 2);
        g.fillStyle = '#40d0e0'; g.fillRect(bx, hy - 10, 2, 2);
      }
    } else if (hat === 6) {
      const c0 = HC ? HC[0] : '#c8a818', c1 = HC ? HC[1] : '#f0e060';
      g.fillStyle = c0; g.fillRect(hx + 2, hy - 18, hw - 4, 20);
      g.fillStyle = c1; g.fillRect(hx + 4, hy - 17, Math.max(2, hw - 15), 2);
      g.fillStyle = shade(c0, -46); g.fillRect(hx + 2, hy - 2, hw - 4, 3);
      g.fillStyle = c1; g.fillRect(cx - 3, hy - 24, 7, 7);
      g.fillStyle = '#f8f8f8'; g.fillRect(cx - 1, hy - 23, 2, 5);
    } else if (hat === 7) {
      const c0 = HC ? HC[0] : '#a82020';
      g.fillStyle = '#6c4420'; g.fillRect(hx - 3, hy - 9, hw + 6, 10);
      g.fillStyle = c0; g.fillRect(hx - 3, hy - 9, hw + 6, 3);
      g.fillStyle = '#f8d040'; g.fillRect(cx - 9, hy - 7, 18, 3);
      for (let i = 0; i < 3; i++) {
        const fx = cx - 11 + i * 10;
        g.fillStyle = ['#e04040', '#40c040', '#f0d030'][i];
        for (let j = 0; j < 15; j++) g.fillRect(fx + ((j / 4) | 0), hy - 23 + j, 3, 1);
        g.fillStyle = '#101018'; g.fillRect(fx - 1, hy - 23, 1, 13);
      }
    }

    if (t.ruler && hat !== 5) {
      g.fillStyle = gold1;
      g.fillRect(hx + 3, hy - 25, hw - 6, 3);
      g.fillRect(hx + 3, hy - 29, 3, 4);
      g.fillRect(cx - 2, hy - 32, 4, 7);
      g.fillRect(hx + hw - 6, hy - 29, 3, 4);
      g.fillStyle = gold0; g.fillRect(hx + 3, hy - 22, hw - 6, 1);
    }
  }

  return { draw, hash, frame, preload, hasArt, traitsOf };
})();
