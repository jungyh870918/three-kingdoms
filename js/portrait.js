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
    iron: ['#78788c', '#b0b0c4'], steel: ['#8890a4', '#c8d0e0'], bronze: ['#8c6a30', '#d8a850'],
  };
  const HAT_NAME = { topknot: 0, gwan: 1, helm: 2, silk: 3, warcloth: 4, crown: 5, daoist: 6,
                     feather: 7, phoenixhelm: 8, wrap: 9, fur: 10, facehelm: 11, bare: 12 };
  const BEARD_NAME = { none: 0, mustache: 1, goatee: 2, full: 3, long: 4, bushy: 5,
                       whitelong: 6, whisker: 7 };
  /* 눈 : 크기가 아니라 '생김새'가 다르다 */
  const EYES = ['open', 'big', 'thin', 'sharp', 'gentle', 'closed', 'smile', 'glare', 'sanpaku', 'sleepy'];
  const EYE_ALIAS = { normal: 'open', fierce: 'sharp', phoenix: 'sharp', ring: 'big',
                      narrow: 'thin', droop: 'gentle', small: 'thin', sleepy: 'sleepy' };
  const NOSE_NAME = { straight: 0, hook: 1, wide: 2, long: 3, small: 4 };
  const MOUTH_NAME = { closed: 0, firm: 1, frown: 2, open: 3, smile: 4 };
  const BROW_NAME = { arch: 0, flat: 1, raised: 2, drooped: 3, thick: 4 };
  const SHOULDER_NAME = { robe: 0, scale: 1, mail: 2, pauldron: 3, fur: 4, court: 5 };
  const METAL_NAME = { steel: 0, bronze: 1, blue: 2, gold: 3 };
  /* 눈매에 어울리는 기본 눈썹 — 무작위가 아니라 규칙으로 정한다 */
  const BROW_BY_EYE = { sharp: 2, glare: 2, sanpaku: 2, big: 4, thin: 1, closed: 0,
                        smile: 0, gentle: 3, sleepy: 3, open: 0 };
  /* 관에 어울리는 기본 어깨 */
  const SHOULDER_BY_HAT = { 0: 0, 1: 5, 2: 1, 3: 0, 4: 1, 5: 5, 6: 0, 7: 4, 8: 3, 9: 0, 10: 4, 11: 3, 12: 0 };
  const DEFAULT_FACE = { skin: 'tan', hair: 'black', eye: 'open', nose: 'straight', mouth: 'closed',
                         beard: 'mustache', hat: 'gwan', face: 0, jaw: 0, headW: 48, headH: 50,
                         bg: 'blue', robe: 'blue', color: 'black' };
  const warned = {};

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
    let F = (typeof FACES !== 'undefined' && FACES[name]) || null;
    if (!F) {
      if (!warned[name]) { warned[name] = 1; console.warn('[Portrait] 특징표(js/faces.js)에 없는 인물:', name); }
      F = DEFAULT_FACE;
    }
    const num = (v, d) => (v === undefined ? d : v);
    const eye = EYE_ALIAS[F.eye] || F.eye || 'open';
    const hat = HAT_NAME[F.hat] !== undefined ? HAT_NAME[F.hat] : 1;
    const old = F.hair === 'white' || F.hair === 'gray';

    const t = {
      /* ── 뼈대 : 인물마다 직접 지정한다 ── */
      headW: num(F.headW, 48),
      headH: num(F.headH, 50),
      faceIdx: clampi(num(F.face, 0), 0, 4),
      jaw: clampi(num(F.jaw, 0), 0, 2),
      jawWidthMul: num(F.jawWidthMul, 1),
      yaw: clampi(num(F.yaw, 0), -6, 6),
      tilt: clampi(num(F.tilt, 0), -3, 3),
      asym: clampi(num(F.asym, 1), 0, 2),
      eyeSpacing: num(F.eyeSpacing, 0),
      browHeight: num(F.browHeight, 0),
      cheekY: num(F.cheekY, 0),
      /* ── 색 ── */
      skin: SKIN_MAP[F.skin] || SKIN_MAP.tan,
      hair: HAIR_MAP[F.hair] || HAIR_MAP.black,
      bg: COL_MAP[F.bg] || COL_MAP.blue,
      robe: COL_MAP[F.robe] || COL_MAP.blue,
      metal: METALS[METAL_NAME[F.metal] !== undefined ? METAL_NAME[F.metal] : 0],
      hatCol: F.color ? (COL_MAP[F.color] || null) : null,
      bgStyle: clampi(num(F.bgStyle, 0), 0, 5),
      /* ── 이목구비 ── */
      eye,
      eyeW: num(F.eyeW, eye === 'big' ? 14 : eye === 'thin' ? 12 : 13),
      eyeGap: clampi(5 + num(F.eyeSpacing, 0), 2, 10),
      browK: BROW_NAME[F.brow] !== undefined ? BROW_NAME[F.brow] : (BROW_BY_EYE[eye] || 0),
      browThick: num(F.browThick, eye === 'sharp' || eye === 'big' ? 3 : 2),
      browAngle: num(F.browAngle, 0),
      browBushy: !!F.browBushy,
      irisDark: !!F.irisDark,
      noseK: NOSE_NAME[F.nose] !== undefined ? NOSE_NAME[F.nose] : 0,
      noseLen: clampi(num(F.noseLen, 11) + num(F.noseLenOverride, 0), 5, 20),
      mouthK: MOUTH_NAME[F.mouth] !== undefined ? MOUTH_NAME[F.mouth] : 0,
      mouthW: num(F.mouthW, 12),
      /* ── 털 · 옷 ── */
      beard: BEARD_NAME[F.beard] !== undefined ? BEARD_NAME[F.beard] : 1,
      beardLen: clampi(num(F.beardLen, 16), 8, 24),
      hat,
      shoulder: SHOULDER_NAME[F.shoulder] !== undefined ? SHOULDER_NAME[F.shoulder]
        : (F.shoulder !== undefined ? F.shoulder : SHOULDER_BY_HAT[hat]),
      /* ── 덧붙임 ── */
      jewel: !!F.jewel, earring: !!F.earring, scar: !!F.scar,
      patch: F.eye === 'patch' || !!F.patch,
      ear: F.ear ? 1 : 0, fan: F.fan ? 1 : 0,
      old, ruler: false,
    };
    if (t.patch && t.eye === 'patch') t.eye = 'sharp';
    if (F.young) { if (t.beard === 4 || t.beard === 6) t.beard = 1; }
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
    const hy = IY + 22, chin = hy + headH;
    const lightL = yaw <= 0;
    const skin = t.skin;
    const sL = shade(skin, 22), sD = shade(skin, -30), sD2 = shade(skin, -48), sE = shade(skin, -66);

    /* ── 실루엣 : 매끈한 타원이 아니라 마디에서 각이 꺾이는 다각선 ──
       마디 위치(ny)  0 정수리   .16 이마   .30 관자놀이   .46 광대뼈
                      .62 볼     .78 턱모서리  .90 턱      1.0 턱끝      */
    const NODE = [0, 0.16, 0.30, 0.46, 0.62, 0.78, 0.90, 1.0];
    const FACE = [
      [.74, .93, 1.00, 1.00, .94, .82, .64, .42],   // 둥근 얼굴
      [.64, .83, .94, 1.00, .92, .78, .56, .34],   // 긴 얼굴
      [.88, 1.00, 1.00, 1.00, .99, .96, .80, .58],   // 네모난 얼굴 — 턱모서리에서 급락
      [.70, .87, .95, 1.00, 1.00, 1.00, .86, .60],   // 턱이 넓은 얼굴
      [.58, .78, .90, 1.00, .86, .68, .46, .26],   // 여윈 얼굴
    ][clampi(t.faceIdx, 0, 4)];
    const tilt = t.tilt || 0;
    const rowW = j => {
      const ny = clampi(j, 0, headH) / headH;
      let i = 0; while (i < NODE.length - 2 && ny > NODE[i + 1]) i++;
      const f = (ny - NODE[i]) / (NODE[i + 1] - NODE[i]);      // 마디 사이는 직선
      let w = headW * (FACE[i] + (FACE[i + 1] - FACE[i]) * f);
      if (t.jaw === 1 && ny > 0.70) w += 2;                    // 각진 턱
      if (t.jaw === 2 && ny > 0.70) w -= 2;                    // 뾰족한 턱
      if (t.jawWidthMul !== 1 && ny > 0.46) w *= 1 + (t.jawWidthMul - 1) * ((ny - 0.46) / 0.54);
      return Math.max(6, Math.round(w));
    };
    /* 실루엣이 꺾이는 지점 — 여기에 가로 획을 그어 "뼈가 바뀐다"를 보여준다 */
    const BREAKS = [0.30, 0.46, 0.78].map(v => Math.round(v * headH));
    const rowC = j => {
      const ny = clampi(j, 0, headH) / headH;
      return cx + Math.round(yaw * (0.10 + 0.55 * ny) + tilt * (0.5 - ny) * 2);
    };
    const FSH = Math.round(yaw * 1.25);        // 이목구비를 미는 양 (얼굴이 돌아 보이는 핵심)

    const eyY = hy + Math.round(headH * 0.40);
    const nY = eyY + 2;
    const noseBot = Math.min(chin - 16, nY + 4 + t.noseLen);
    const shY = chin + 3;

    /* ── 어깨 ── */
    paintShoulder(g, t, IX, IY, IW, IH, cx, shY, yaw);

    /* ── 목 ── */
    const neckW = 14 + Math.round((headW - 42) * 0.6);
    g.fillStyle = sD2; g.fillRect(cx - (neckW >> 1) + yaw, chin - 8, neckW, 13);
    g.fillStyle = sD; g.fillRect(cx - (neckW >> 1) + yaw + 1, chin - 8, neckW - 3, 11);
    g.fillStyle = sE; g.fillRect(cx - (neckW >> 1) + yaw, chin - 8, neckW, 3);

    /* ── 얼굴 ── */
    /* ── 채색 ────────────────────────────────────────────────────────
       ① 뼈가 만드는 평면(이마·관자놀이·눈두덩·광대·볼·코옆·턱·턱밑)을 따로 칠하고
       ② 평면과 평면이 만나는 자리에는 두 색을 체커로 섞은 디더 밴드를 2픽셀 깐다.
          면 안쪽은 평평하게 두되 경계만 흩뿌려서, 눈이 그 경계를 곡면으로 읽게 만든다.
          (경계를 무디더링으로 끊으면 저폴리곤 플랫셰이딩처럼 보인다)              */
    const HL2 = shade(skin, 56), HL = shade(skin, 30);
    const SH = shade(skin, -36), SH2 = shade(skin, -62), SH3 = shade(skin, -86);
    const LINE = shade(skin, -100);
    const TONE = [HL2, HL, skin, SH, SH2, SH3];          // 밝은 → 어두운
    const dirN = lightL ? 1 : -1;
    const cheek = t.cheekY || 0;
    const noseSide = -dirN * 0.16;

    /* 1차 — 평면 지수를 계산해 둔다 */
    const BW = headW + 10, BH = headH + 2;
    const BX = cx - (BW >> 1) - 4, BY = hy;
    const PL = new Int8Array(BW * BH).fill(-1);
    for (let j = 0; j < headH; j++) {
      const w = rowW(j), c = rowC(j), l = c - (w >> 1), r = l + w;
      const ny = j / headH;
      for (let x = l; x < r; x++) {
        const nx = (x - c) / Math.max(1, w / 2);
        const d = nx * dirN;
        let k = 2;                                        // 바탕
        if (d > 0.54) k = 3;                              // 옆면
        if (d > 0.88) k = 4;
        if (ny < 0.30) k = (d > 0.60) ? 3 : (d < -0.40 && ny > 0.13 ? 0 : 1);   // 이마
        else if (ny < 0.345) k = (d > 0.66) ? 4 : 3;      // 눈썹뼈 아래
        else if (ny >= 0.42 + cheek && ny < 0.60 + cheek) {                      // 광대
          const edge = 0.20 + (ny - (0.42 + cheek)) * 1.6;
          if (-d > edge && -d < 0.86) k = 1;
          else if (d > 0.30) k = 3;
        } else if (ny >= 0.60 + cheek && ny < 0.78) {     // 볼
          if (d > 0.22) k = 3;
          if (d > 0.70) k = 4;
        } else if (ny >= 0.86) k = (d > 0.10) ? 4 : 3;    // 턱
        if (ny > 0.95) k = 5;
        if (ny > 0.46 && ny < 0.70 && Math.abs(nx - noseSide) < 0.09) k = Math.max(k, 3);
        if (ny >= 0.78 && ny < 0.86 && Math.abs(nx) < 0.30) k = 2;               // 인중 옆
        const bx = x - BX, by = j;
        if (bx >= 0 && bx < BW) PL[by * BW + bx] = k;
      }
    }

    /* 2차 — 경계에서 1~2픽셀은 이웃 색과 체커로 섞는다 */
    const at = (bx, by) => (bx < 0 || by < 0 || bx >= BW || by >= BH) ? -1 : PL[by * BW + bx];
    const band = new Int8Array(BW * BH);                  // 0 안쪽 1 경계 2 그 바깥
    const nbr = new Int8Array(BW * BH).fill(-1);
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      const k = at(bx, by); if (k < 0) continue;
      let best = -1, diff = 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const o = at(bx + dx, by + dy);
        if (o >= 0 && o !== k && Math.abs(o - k) > diff) { diff = Math.abs(o - k); best = o; }
      });
      if (best >= 0) { band[by * BW + bx] = 1; nbr[by * BW + bx] = best; }
    }
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      if (band[by * BW + bx] || at(bx, by) < 0) continue;
      let best = -1;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const i = (by + dy) * BW + (bx + dx);
        if (band[i] === 1 && nbr[i] >= 0 && nbr[i] !== at(bx, by)) best = nbr[i];
      });
      if (best >= 0) { band[by * BW + bx] = 2; nbr[by * BW + bx] = best; }
    }
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      const k = at(bx, by); if (k < 0) continue;
      const i = by * BW + bx, x = BX + bx, y = BY + by;
      let col = TONE[k];
      if (band[i] === 1 && ((x + y) & 1) === 0) col = TONE[nbr[i]];            // 촘촘한 체커
      else if (band[i] === 2 && BAYER[y & 3][x & 3] < 4) col = TONE[nbr[i]];   // 성근 체커
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }

    /* 얼굴 테두리 */
    g.fillStyle = LINE;
    for (let j = 0; j < headH; j++) {
      const w = rowW(j), c = rowC(j);
      g.fillRect(c - (w >> 1) - 1, hy + j, 1, 1);
      g.fillRect(c + (w >> 1), hy + j, 1, 1);
    }
    { const w0 = rowW(0), c0 = rowC(0); g.fillRect(c0 - (w0 >> 1) - 1, hy - 1, w0 + 2, 1); }
    { const w1 = rowW(headH - 1), c1 = rowC(headH - 1); g.fillRect(c1 - (w1 >> 1) - 1, hy + headH, w1 + 2, 1); }

    /* ── 구조선 : 뼈가 바뀌는 자리에 획을 긋는다 ── */
    const STRUCT = shade(skin, -50);
    /* 실루엣이 꺾이는 마디 — 바깥쪽에 짧은 가로 획 */
    BREAKS.forEach(bj => {
      const w = rowW(bj), c = rowC(bj);
      g.fillStyle = LINE;
      g.fillRect(c - (w >> 1) - 1, hy + bj, 3, 1);
      g.fillRect(c + (w >> 1) - 1, hy + bj, 3, 1);
    });
    /* 눈썹뼈 : 그늘 쪽 절반에만 짧게 */
    { const bj = Math.round(headH * 0.345), w = rowW(bj), c = rowC(bj);
      g.fillStyle = STRUCT;
      const len = Math.round(w * 0.30);
      g.fillRect(lightL ? c + 2 : c - 2 - len, hy + bj, len, 1); }
    /* 광대뼈 아래 짧은 사선 */
    { const bj = Math.round((0.62 + cheek) * headH), w = rowW(bj), c = rowC(bj);
      g.fillStyle = STRUCT;
      for (let i = 0; i < 4; i++) {
        const x = lightL ? c + Math.round(w * 0.22) + i : c - Math.round(w * 0.22) - i;
        g.fillRect(x, hy + bj - i, 1, 1);
      } }
    /* 턱 모서리 : 아래턱뼈가 꺾이는 자리 */
    { const bj = Math.round(headH * 0.80), w = rowW(bj), c = rowC(bj);
      g.fillStyle = STRUCT;
      for (let i = 0; i < 4; i++) {
        g.fillRect(c - (w >> 1) + 1 + i, hy + bj + i, 1, 1);
        g.fillRect(c + (w >> 1) - 2 - i, hy + bj + i, 1, 1);
      } }
    t._line = LINE;

    /* 3/4 얼굴의 코 옆선 */
    if (yaw !== 0) {
      const dir = yaw > 0 ? 1 : -1;
      for (let j = nY - 2; j < noseBot + 3; j++) {
        const u = (j - (nY - 2)) / Math.max(1, noseBot + 3 - (nY - 2));
        const bump = Math.round(Math.sin(u * Math.PI) * (2 + Math.abs(yaw) * 0.9));
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
      const x = side < 0 ? rowC(earJ) - ew - 2 : rowC(earJ) + ew - 1;
      g.fillStyle = LINE;                                   // 테두리
      g.fillRect(x, earY, 3, earH);
      g.fillStyle = skin; g.fillRect(x + (side < 0 ? 1 : 0), earY + 1, 2, earH - 2);
      g.fillStyle = shade(skin, -40);
      g.fillRect(x + (side < 0 ? 1 : 1), earY + 3, 1, earH - 7);
      if (t.earring) { g.fillStyle = '#f0d040'; g.fillRect(x, earY + earH, 2, 2); }
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
    eyes.forEach(e => {
      const far = (yaw >= 0 ? -1 : 1) === e.side;          // 돌아본 반대쪽(먼 눈)
      drawBrow(g, t, e, eyY, LINE);
      drawEye(g, t, e, eyY + (far ? 1 : 0), LINE);         // 먼 눈은 한 픽셀 아래
    });
    if (t.patch) drawPatch(g, t, eyes[1], eyY, rowC(headH * 0.4), rowW(headH * 0.4));

    /* ── 코 ── */
    drawNose(g, t, ec + FSH + Math.round(yaw * 0.3), nY, noseBot, yaw, LINE);

    /* ── 입 ── */
    const mY = Math.min(chin - 10, noseBot + 4);
    const mc = rowC(headH * 0.82) + Math.round(FSH * 0.85);
    drawMouth(g, t, mc, mY, LINE);

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
  /* ── 눈썹 : 모양 다섯 가지 ───────────────────────────────────────── */
  function drawBrow(g, t, e, eyY, LINE) {
    const side = e.side, th = t.browThick;
    const col = t.old ? shade(t.hair, 20) : t.hair;
    const x0 = e.x - 1, w = e.w + 2;
    /* 좌우를 일부러 어긋나게 — 고개를 돌린 쪽 눈썹이 조금 높고 완만하다 */
    const far = (t.yaw >= 0 ? -1 : 1) === side ? 1 : 0;
    const base = eyY - 8 - (t.browHeight || 0) - far + (t.asym || 0) * (side < 0 ? 1 : 0);
    const shape = t.browK;
    g.fillStyle = col;
    for (let i = 0; i < w; i++) {
      const u = i / (w - 1);
      const outer = side < 0 ? u : 1 - u;      // 바깥쪽으로 갈수록 1
      let dy = 0, h = th;
      if (shape === 0) { dy = -Math.round(Math.sin(u * Math.PI) * (2 - far * 0.6)); }  // 반달
      else if (shape === 1) { dy = 0; }                                               // 일자
      else if (shape === 2) { dy = -Math.round(outer * 4); h = th + (outer > .6 ? 1 : 0); }  // 치켜올린
      else if (shape === 3) { dy = Math.round(outer * 3); }                            // 처진
      else { dy = -Math.round(Math.sin(u * Math.PI) * 1.5); h = th + 1; }              // 두꺼운
      g.fillRect(x0 + i, base + dy, 1, Math.max(1, h - (outer > 0.82 ? 1 : 0)));
    }
    if (t.browBushy) {
      g.fillStyle = shade(col, 22);
      for (let i = 1; i < w; i += 2) g.fillRect(x0 + i, base - 2, 1, 2);
    }
  }

  /* ── 눈 : 크기가 아니라 생김새 ──────────────────────────────────── */
  function drawEye(g, t, e, eyY, LINE) {
    const k = t.eye, w = Math.max(6, e.w), x = e.x, side = e.side, y = eyY;
    const L = '#20140c', WHITE = '#f4ece0', IRIS = t.irisDark ? '#141018' : '#3a2a18';
    const inner = side < 0 ? x + w - 1 : x;      // 코 쪽 끝
    const outer = side < 0 ? x : x + w - 1;      // 바깥 끝

    const lidTop = (lift, thick) => {            // 윗눈꺼풀 : 눈매를 결정한다
      g.fillStyle = L;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1), o = side < 0 ? u : 1 - u;
        const dy = -Math.round(lift * o) - Math.round(Math.sin(u * Math.PI) * 0.8);
        g.fillRect(x + i, y + dy, 1, thick);
      }
    };
    const lidBot = (drop) => {
      g.fillStyle = shade(t.skin, -70);
      for (let i = 1; i < w - 1; i++) {
        const u = i / (w - 1), o = side < 0 ? u : 1 - u;
        g.fillRect(x + i, y + 4 + Math.round(drop * o), 1, 1);
      }
    };
    const ball = (cxp, cyp, r, ir) => {          // 흰자 + 눈동자
      g.fillStyle = WHITE;
      for (let j = -r; j <= r; j++) {
        const ww = Math.round(Math.sqrt(Math.max(0, r * r - j * j)) * 1.7);
        g.fillRect(cxp - ww, cyp + j, ww * 2 + 1, 1);
      }
      const ix = cxp - ir + (side < 0 ? -1 : 1);
      g.fillStyle = IRIS; g.fillRect(ix, cyp - ir, ir * 2, ir * 2 + 1);
      g.fillStyle = '#101018'; g.fillRect(ix + 1, cyp - ir + 1, ir, ir);
      g.fillStyle = '#f8f8f8'; g.fillRect(ix, cyp - ir, 1, 1);
    };

    if (k === 'closed') {                        // 감은 눈 — 선 하나
      g.fillStyle = L;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1);
        g.fillRect(x + i, y + 1 + Math.round(Math.sin(u * Math.PI) * -1.4), 1, 2);
      }
      g.fillStyle = shade(t.skin, -50);
      g.fillRect(x + 1, y + 4, w - 2, 1);
      return;
    }
    if (k === 'smile') {                         // 웃는 눈 — 위로 휜 활
      g.fillStyle = L;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1);
        g.fillRect(x + i, y + 3 - Math.round(Math.sin(u * Math.PI) * 3), 1, 2);
      }
      return;
    }
    if (k === 'thin') {                          // 가는 눈
      lidTop(1, 2);
      g.fillStyle = WHITE; g.fillRect(x + 1, y + 2, w - 2, 1);
      g.fillStyle = IRIS; g.fillRect(x + (w >> 1) - 1, y + 2, 3, 1);
      lidBot(0);
      return;
    }
    if (k === 'sleepy') {                        // 졸린 눈 — 무거운 윗꺼풀
      g.fillStyle = shade(t.skin, -46); g.fillRect(x, y - 2, w, 2);
      lidTop(0, 2);
      g.fillStyle = WHITE; g.fillRect(x + 1, y + 2, w - 2, 2);
      g.fillStyle = IRIS; g.fillRect(x + (w >> 1) - 1, y + 2, 3, 2);
      lidBot(1);
      return;
    }
    if (k === 'gentle') {                        // 어진 눈 — 아래로 부드럽게
      g.fillStyle = L;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1), o = side < 0 ? u : 1 - u;
        g.fillRect(x + i, y + Math.round(o * 1.5) - Math.round(Math.sin(u * Math.PI)), 1, 2);
      }
      ball(x + (w >> 1), y + 4, 2, 2);
      lidBot(1);
      return;
    }
    if (k === 'sharp') {                         // 날카로운 눈 — 눈꼬리가 치솟는다
      lidTop(3, 2);
      g.fillStyle = WHITE; g.fillRect(x + 1, y + 2, w - 2, 2);
      g.fillStyle = IRIS;
      g.fillRect(inner + (side < 0 ? -3 : 1), y + 2, 3, 2);
      g.fillStyle = L; g.fillRect(outer, y - 3, 2, 3);
      lidBot(-1);
      return;
    }
    if (k === 'glare') {                         // 째려보는 눈 — 반쯤 덮인 눈
      g.fillStyle = shade(t.skin, -52); g.fillRect(x, y - 2, w, 2);
      lidTop(1, 3);
      g.fillStyle = WHITE; g.fillRect(x + 1, y + 3, w - 2, 2);
      g.fillStyle = IRIS; g.fillRect(x + (w >> 1) - 2, y + 3, 4, 2);
      lidBot(0);
      return;
    }
    if (k === 'sanpaku') {                       // 흰자가 많은 눈
      lidTop(1, 2);
      ball(x + (w >> 1), y + 4, 3, 1);
      lidBot(0);
      return;
    }
    if (k === 'big') {                           // 부리부리한 눈
      lidTop(2, 2);
      ball(x + (w >> 1), y + 4, 3, 2);
      g.fillStyle = L; g.fillRect(x + 1, y + 8, w - 2, 1);
      return;
    }
    /* open : 보통 뜬 눈 */
    lidTop(1, 2);
    ball(x + (w >> 1), y + 4, 3, 2);
    lidBot(0);
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

  /* ── 코 : 선으로 그린다 ─────────────────────────────────────────── */
  function drawNose(g, t, x, nY, noseBot, yaw, LINE) {
    const dir = yaw >= 0 ? 1 : -1;               // 그늘이 지는 쪽
    const sh = shade(t.skin, -40), dk = shade(t.skin, -72), hl = shade(t.skin, 22);
    const len = Math.max(6, noseBot - nY);
    const k = t.noseK;
    if (k === 4) {                               // 작은 코 : 점 하나
      g.fillStyle = dk; g.fillRect(x + dir, noseBot - 2, 2, 1);
      g.fillStyle = sh; g.fillRect(x + dir * 2, noseBot - 4, 1, 2);
      return;
    }
    /* 콧대 : 그늘 쪽에 선 하나, 반대쪽에 밝은 선 */
    for (let j = 0; j < len; j++) {
      const u = j / len;
      let off = Math.round(2 + u * 2);
      if (k === 1 && u > 0.5) off += 1;          // 매부리
      if (k === 3) off = Math.round(1 + u * 3);  // 긴 코
      g.fillStyle = sh; g.fillRect(x + dir * off, nY + j, 2, 1);
      if (u > 0.3) { g.fillStyle = hl; g.fillRect(x - dir * Math.max(0, off - 2), nY + j, 1, 1); }
    }
    /* 코끝과 콧방울 */
    const tipW = k === 2 ? 8 : 6;
    g.fillStyle = sh; g.fillRect(x - (tipW >> 1), noseBot - 3, tipW, 3);
    g.fillStyle = hl; g.fillRect(x - dir, noseBot - 4, 3, 2);
    g.fillStyle = dk;
    g.fillRect(x - (tipW >> 1) - 1, noseBot - 2, 2, 2);
    g.fillRect(x + (tipW >> 1) - 1, noseBot - 2, 2, 2);
    g.fillStyle = shade(t.skin, -84);
    g.fillRect(x - (tipW >> 1), noseBot - 1, 1, 1);
    g.fillRect(x + (tipW >> 1) - 1, noseBot - 1, 1, 1);
  }

  /* ── 입 ─────────────────────────────────────────────────────────── */
  function drawMouth(g, t, mc, mY, LINE) {
    const w = t.mouthW, x = mc - (w >> 1);
    const line = '#5c2c24', lip = '#a8564c', dk = shade(t.skin, -56);
    if (t.mouthK === 0) {                        // 다문 입
      g.fillStyle = line; g.fillRect(x, mY, w, 1);
      g.fillStyle = lip; g.fillRect(x + 1, mY + 1, w - 2, 1);
    } else if (t.mouthK === 1) {                 // 굳게 다문 일자
      g.fillStyle = line; g.fillRect(x, mY, w, 2);
      g.fillStyle = dk; g.fillRect(x - 1, mY, 1, 1); g.fillRect(x + w, mY, 1, 1);
    } else if (t.mouthK === 2) {                 // 입꼬리가 내려간 입
      g.fillStyle = line;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1);
        g.fillRect(x + i, mY + Math.round(Math.abs(u - 0.5) * 3), 1, 1);
      }
      g.fillStyle = lip; g.fillRect(x + 2, mY + 1, w - 4, 1);
    } else if (t.mouthK === 3) {                 // 살짝 벌린 입
      g.fillStyle = line; g.fillRect(x, mY, w, 3);
      g.fillStyle = '#e8dcc8'; g.fillRect(x + 2, mY + 1, w - 4, 1);
    } else {                                     // 웃는 입
      g.fillStyle = line;
      for (let i = 0; i < w; i++) {
        const u = i / (w - 1);
        g.fillRect(x + i, mY + 2 - Math.round(Math.sin(u * Math.PI) * 2), 1, 1);
      }
    }
    g.fillStyle = shade(t.skin, 18); g.fillRect(x + 2, mY + 3, w - 4, 1);   // 아랫입술 빛
    g.fillStyle = shade(t.skin, -70);                                        // 한쪽 입꼬리만 눌러 표정을 만든다
    g.fillRect(t.yaw >= 0 ? x - 1 : x + w, mY + 1, 1, 2);
  }

  function drawBeard(g, t, mc, mY, hy, headH, rowW, rowC) {
    const k = t.beard;
    if (k === 0) return;
    const base = k === 6 ? '#d8d8d8' : mix(t.hair, t.skin, 0.34);
    const hi = shade(base, 30), lo = shade(base, -34);
    const mw = t.mouthW;
    const chinC = rowC(headH * 0.92);          // 턱의 중심 (얼굴 기준)
    const chinW = rowW(headH * 0.92);

    /* 콧수염 */
    if (k !== 7) {
      const half = Math.max(4, (mw >> 1) + 1);
      g.fillStyle = base;
      g.fillRect(mc - half - 3, mY - 3, half, 2);
      g.fillRect(mc + 3, mY - 3, half, 2);
      g.fillStyle = lo;
      g.fillRect(mc - half - 5, mY - 2, 3, 3);
      g.fillRect(mc + half + 2, mY - 2, 3, 3);
      g.fillStyle = hi;
      g.fillRect(mc - half - 2, mY - 3, 2, 1);
      g.fillRect(mc + 4, mY - 3, 2, 1);
    }
    if (k === 1) return;

    /* 구레나룻 — 수염을 머리와 이어 준다 */
    const burn = () => {
      const jj = Math.round(headH * 0.58), sw = rowW(jj) >> 1, c = rowC(jj);
      g.fillStyle = lo;
      g.fillRect(c - sw - 1, hy + Math.round(headH * 0.42), 4, 16);
      g.fillRect(c + sw - 3, hy + Math.round(headH * 0.42), 4, 16);
      g.fillStyle = base;
      g.fillRect(c - sw, hy + Math.round(headH * 0.42), 3, 15);
      g.fillRect(c + sw - 3, hy + Math.round(headH * 0.42), 3, 15);
    };

    /* 턱을 감싸는 덩어리 + 아래로 흐르는 부분 */
    const edge = shade(base, -70);
    const mass = (yTop, rows, wAt) => {
      for (let j = 0; j < rows; j++) {
        const u = j / rows;
        const w = Math.max(3, Math.round(wAt(u)));
        const sway = Math.round(t.yaw * u * 0.9);
        const x0 = Math.round(chinC - w / 2 + sway), y = yTop + j;
        g.fillStyle = edge; g.fillRect(x0 - 1, y, w + 2, 1);          // 테두리
        g.fillStyle = base; g.fillRect(x0, y, w, 1);
        g.fillStyle = lo;                                             // 결 두 줄
        g.fillRect(x0 + 1 + ((j * 3) % Math.max(1, w - 2)), y, 1, 1);
        if ((j & 1) === 0 && w > 6) g.fillStyle = hi, g.fillRect(x0 + 1 + ((j * 5) % Math.max(1, w - 2)), y, 1, 1);
      }
      g.fillStyle = edge;                                             // 아래 테두리
      const wEnd = Math.max(3, Math.round(wAt(1)));
      g.fillRect(Math.round(chinC - wEnd / 2 + t.yaw * 0.9) - 1, yTop + rows, wEnd + 2, 1);
    };

    if (k === 2) {                                   // 염소턱
      mass(mY + 5, 9, u => 8 - u * 3);
      return;
    }
    if (k === 3) {                                   // 턱수염
      burn();
      mass(mY + 4, 14, u => chinW * (0.50 + Math.sin(u * Math.PI) * 0.26) - u * 3);
      return;
    }
    if (k === 5) {                                   // 범수염 — 옆으로도 뻗친다
      burn();
      mass(mY + 4, 13, u => chinW * (0.58 + Math.sin(u * Math.PI) * 0.26));
      g.fillStyle = lo;
      for (let j = 0; j < 7; j++) {
        g.fillRect(chinC - (chinW >> 1) - 2 - (j & 1) * 2, mY + j, 5, 1);
        g.fillRect(chinC + (chinW >> 1) - 3 + (j & 1) * 2, mY + j, 5, 1);
      }
      return;
    }
    if (k === 7) { burn(); return; }                 // 구레나룻만

    /* 4 · 6 : 장수염 — 턱을 덮고 가슴까지 흐른다 */
    burn();
    const len = Math.max(14, t.beardLen);
    mass(mY + 4, len, u => {
      const hug = chinW * 0.80 * Math.max(0, 1 - u * 1.2);       // 턱을 감싸는 부분
      const flow = 15 - u * 7;                                    // 흘러내리는 부분
      return Math.max(flow, hug);
    });
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
  /* 모자별 챙(아래 테두리)이 hy 로부터 몇 픽셀 아래에 있는지 */
  const BRIM = { 0: 6, 1: 3, 2: 6, 3: 4, 4: 4, 5: 2, 6: 2, 7: 1, 8: 6, 9: 4, 10: 1, 11: 8, 12: 2 };

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
      g.fillStyle = shade(c, -30); g.fillRect(hx - 2, hy - 7, hw + 4, 3);      // 두른 띠
      g.fillStyle = shade(c, -52); g.fillRect(hx - 2, hy - 5, hw + 4, 1);
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
      const cw2 = Math.min(22, hw - 6);                                    // 정수리 금장식
      g.fillStyle = shade(gold0, -50); g.fillRect(cx - (cw2 >> 1) - 1, hy - 21, cw2 + 2, 7);
      g.fillStyle = gold0; g.fillRect(cx - (cw2 >> 1), hy - 20, cw2, 5);
      g.fillStyle = gold1; g.fillRect(cx - (cw2 >> 1), hy - 20, cw2, 2);
      g.fillStyle = '#e04040'; g.fillRect(cx - 3, hy - 19, 6, 3);
      for (let j = 0; j < 6; j++) {                                        // 짧은 붉은 술
        const w = 7 - j;
        g.fillStyle = (j & 1) ? '#e83c30' : '#b82418';
        g.fillRect(cx - (w >> 1), hy - 26 + j, w, 1);
      }
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
      for (let j = 0; j < 20; j++) {                                       // 옆으로 뻗은 꿩깃
        const u = j / 20, w = 2 + Math.round(u * 3);
        const dy = hy - 14 - Math.round(u * 8);
        const lx = cx - 11 - j, rx = cx + 9 + j;
        g.fillStyle = '#101018'; g.fillRect(lx - 1, dy - 1, w + 2, 3);
        g.fillStyle = '#101018'; g.fillRect(rx - 1, dy - 1, w + 2, 3);
        g.fillStyle = (j % 5 === 0) ? '#b8b8cc' : '#f4f4fc';
        g.fillRect(lx, dy, w, 2); g.fillRect(rx, dy, w, 2);
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

    /* 관 아래 드리운 그림자 — 색을 뚝 끊지 않고 세 줄에 걸쳐 흩뿌린다.
       (예전에는 ny<0.07 을 통째로 어둡게 칠해 이마에 흉터 같은 선이 생겼다) */
    {
      const brim = BRIM[hat] !== undefined ? BRIM[hat] : 4;
      const sh1 = shade(t.skin, -34), sh2 = shade(t.skin, -18);
      for (let j = 0; j < 4; j++) {
        const row = brim + j;
        if (row >= headH) break;
        const w = rowW(row), c = rowC(row), y = hy + row;
        for (let x = c - (w >> 1); x < c + (w >> 1); x++) {
          let on = false, col = sh1;
          if (j === 0) on = true;
          else if (j === 1) { on = ((x + y) & 1) === 0; }
          else if (j === 2) { on = BAYER[y & 3][x & 3] < 6; col = sh2; }
          else { on = BAYER[y & 3][x & 3] < 3; col = sh2; }
          if (on) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
        }
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
