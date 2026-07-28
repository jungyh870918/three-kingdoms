/* =========================================================================
 *  절차적 도트 초상화 — 이름을 해시해서 항상 같은 얼굴을 그린다.
 *  원작 아트는 쓰지 않고, 90년대 VGA 초상화 문법(금색 액자 + 흉상)만 오마주.
 * ========================================================================= */
const Portrait = (() => {

  const SKIN = ['#e8b48c', '#d8a074', '#c89060', '#f0c8a0', '#b87c50'];
  const HAIR = ['#181818', '#241810', '#3c2414', '#6c6c74', '#d8d8d8'];
  const BG = [
    ['#186858', '#2c9078'], ['#204878', '#3068a8'], ['#583060', '#8050a0'],
    ['#186078', '#2890a8'], ['#603018', '#a05828'], ['#204020', '#487848'],
    ['#484860', '#7878a0'], ['#702030', '#a84850'],
  ];
  const ROBE = [
    ['#c02020', '#f05050'], ['#204090', '#4070d0'], ['#207040', '#40a860'],
    ['#8060a0', '#a888c8'], ['#b09020', '#e8c850'], ['#303040', '#585870'],
    ['#a05020', '#d88040'], ['#106060', '#309090'],
  ];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngOf(seed) {
    let s = seed || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* 금색 액자 */
  function frame(g, W, H) {
    const G0 = '#f8e088', G1 = '#d8a020', G2 = '#8c5c10', D = '#100800';
    g.fillStyle = D; g.fillRect(0, 0, W, H);
    g.fillStyle = G1; g.fillRect(1, 1, W - 2, H - 2);
    g.fillStyle = G0; g.fillRect(1, 1, W - 2, 1); g.fillRect(1, 1, 1, H - 2);
    g.fillStyle = G2; g.fillRect(1, H - 2, W - 2, 1); g.fillRect(W - 2, 1, 1, H - 2);
    g.fillStyle = D; g.fillRect(6, 6, W - 12, H - 12);
    // 상·하단 장식
    g.fillStyle = G0;
    for (let x = 8; x < W - 8; x += 4) { g.fillRect(x, 3, 2, 1); g.fillRect(x, H - 4, 2, 1); }
    g.fillStyle = G2;
    for (let y = 10; y < H - 10; y += 6) { g.fillRect(2, y, 2, 2); g.fillRect(W - 4, y, 2, 2); }
    // 네 귀퉁이 못
    g.fillStyle = G0;
    [[2, 2], [W - 5, 2], [2, H - 5], [W - 5, H - 5]].forEach(([x, y]) => {
      g.fillRect(x, y, 3, 3); g.fillStyle = G2; g.fillRect(x + 1, y + 1, 2, 2); g.fillStyle = G0;
    });
  }

  /* 배경(가로 띠 + 디더) */
  function backdrop(g, x, y, w, h, pal, rnd) {
    const [a, b] = pal;
    g.fillStyle = a; g.fillRect(x, y, w, h);
    g.fillStyle = b;
    for (let j = 0; j < h; j++) {
      const t = 1 - j / h;
      for (let i = 0; i < w; i++) {
        if (((i + j) & 1) === 0 && rnd() < t * 0.9) g.fillRect(x + i, y + j, 1, 1);
      }
    }
  }

  /* 본체 — 이름 해시로 골격·수염·관·색을 결정한다 */
  function draw(canvas, name, opt) {
    opt = opt || {};
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    frame(g, W, H);

    const IX = 6, IY = 6, IW = W - 12, IH = H - 12;
    const gen = GENERALS[name] || [50, 50, 50, 50, 50, 50, 5, 1];
    const [war, int, pol, cha] = gen;
    const h = hash(name || '?');
    const rnd = rngOf((h ^ 0x9e3779b9) >>> 0);
    const bit = (sh, m) => (h >>> sh) % m;

    const old = (pol >= 86 && war < 46) || bit(2, 6) === 0;
    const skin = SKIN[bit(0, SKIN.length)];
    const hair = old ? HAIR[3 + bit(1, 2)] : HAIR[bit(4, 3)];
    const bg = BG[bit(3, BG.length)];
    const robe = ROBE[bit(6, ROBE.length)];
    /* 무장은 투구, 문관은 관모, 그 외 두건·유건 */
    const hat = war >= 82 ? (bit(9, 3) ? 2 : 4)
      : (pol >= 78 || int >= 88) ? (bit(9, 3) ? 1 : 3)
      : bit(9, 4);
    const beard = old ? 4 : [0, 1, 2, 3, 2, 4][bit(12, 6)];
    const fierce = war >= 76;
    const gaunt = int >= 88 && war < 60;

    g.save();
    g.beginPath(); g.rect(IX, IY, IW, IH); g.clip();
    backdrop(g, IX, IY, IW, IH, bg, rnd);

    const cx = IX + (IW >> 1);
    const headW = gaunt ? 42 : 46, headH = 52;
    const hx = cx - (headW >> 1), hy = IY + 21;
    const chin = hy + headH;
    const skinD = shade(skin, -28), skinL = shade(skin, 20), skinE = shade(skin, -58);

    /* ── 어깨 · 옷 ── */
    const shY = chin + 4;
    g.fillStyle = robe[0]; g.fillRect(IX, shY, IW, IH - (shY - IY));
    g.fillStyle = shade(robe[0], -34);                       // 어깨선
    g.fillRect(IX, shY, IW, 2);
    g.fillStyle = robe[1];                                   // 어깨 하이라이트
    for (let j = 0; j < IH - (shY - IY); j++) g.fillRect(IX + 2, shY + 2 + j, Math.max(0, 12 - j), 1);
    if (hat === 2 || hat === 4) {                            // 무장 : 견갑
      g.fillStyle = '#8c8ca0';
      g.fillRect(IX, shY, 22, 10); g.fillRect(IW + IX - 22, shY, 22, 10);
      g.fillStyle = '#d0d0e0';
      g.fillRect(IX, shY, 22, 2); g.fillRect(IW + IX - 22, shY, 22, 2);
      g.fillStyle = '#585868';
      for (let i = 0; i < 22; i += 5) { g.fillRect(IX + i, shY + 4, 2, 6); g.fillRect(IW + IX - 22 + i, shY + 4, 2, 6); }
    }
    // 목
    g.fillStyle = skinD; g.fillRect(cx - 9, chin - 6, 18, 12);
    g.fillStyle = skin; g.fillRect(cx - 7, chin - 6, 14, 10);
    // 깃 (V 자)
    g.fillStyle = '#e8e0cc';
    for (let j = 0; j < 9; j++) {
      g.fillRect(cx - 9 - j, shY + j, 4, 1);
      g.fillRect(cx + 5 + j, shY + j, 4, 1);
    }
    g.fillStyle = shade(robe[0], -46);
    for (let j = 0; j < 9; j++) { g.fillRect(cx - 5 - j, shY + j, 2, 1); g.fillRect(cx + 3 + j, shY + j, 2, 1); }

    /* ── 얼굴 : 행별 폭 프로필로 턱을 좁힌다 ── */
    const FACE = [
      [.78, .92, 1.0, 1.0, .97, .90, .78, .58],   // 둥근 얼굴
      [.72, .88, .97, 1.0, .95, .86, .70, .46],   // 긴 얼굴
      [.82, .96, 1.0, .99, .93, .82, .66, .50],   // 각진 얼굴
    ][bit(18, 3)];
    const rowW = j => {
      const t = j / headH * (FACE.length - 1);
      const i = Math.min(FACE.length - 2, Math.floor(t)), f = t - i;
      return Math.round(headW * (FACE[i] * (1 - f) + FACE[i + 1] * f));
    };
    for (let j = -1; j <= headH; j++) {                 // 윤곽선
      const w = rowW(clampi(j, 0, headH - 1)) + 2;
      g.fillStyle = skinE; g.fillRect(cx - (w >> 1), hy + j, w, 1);
    }
    for (let j = 0; j < headH; j++) {
      const w = rowW(j);
      g.fillStyle = skin; g.fillRect(cx - (w >> 1), hy + j, w, 1);
      g.fillStyle = skinD; g.fillRect(cx + (w >> 1) - 4, hy + j, 3, 1);        // 오른뺨 음영
      if (j > 8 && j < headH - 14) { g.fillStyle = skinL; g.fillRect(cx - (w >> 1) + 2, hy + j, 2, 1); }
    }
    // 귀
    const earY = hy + 22, earW = rowW(24) >> 1;
    g.fillStyle = skinD; g.fillRect(cx - earW - 4, earY, 5, 12); g.fillRect(cx + earW - 1, earY, 5, 12);
    g.fillStyle = skinE; g.fillRect(cx - earW - 3, earY + 3, 2, 6); g.fillRect(cx + earW + 1, earY + 3, 2, 6);

    /* 눈썹 · 눈 */
    const eyW = 11 + bit(20, 2), gap = 4 + bit(21, 3);
    const eyY = hy + 25 + bit(22, 2), eL = cx - gap - eyW, eR = cx + gap;
    g.fillStyle = hair;
    const bt = fierce ? 3 : 2;
    if (fierce) {                                            // 치켜올린 눈썹
      g.fillRect(eL, eyY - 6, eyW - 5, bt); g.fillRect(eL + eyW - 6, eyY - 9, 6, bt);
      g.fillRect(eR, eyY - 9, 6, bt); g.fillRect(eR + 5, eyY - 6, eyW - 5, bt);
    } else {
      g.fillRect(eL, eyY - 7, eyW, bt); g.fillRect(eR, eyY - 7, eyW, bt);
    }
    g.fillStyle = '#efe8e0';                                  // 흰자
    g.fillRect(eL + 1, eyY + 1, eyW - 2, 3); g.fillRect(eR + 1, eyY + 1, eyW - 2, 3);
    g.fillStyle = '#141420';                                  // 위 눈꺼풀 · 눈동자
    g.fillRect(eL, eyY, eyW, 1); g.fillRect(eR, eyY, eyW, 1);
    const gaze = bit(15, 3) - 1;
    g.fillRect(eL + ((eyW >> 1) - 2) + gaze, eyY, 4, 4); g.fillRect(eR + ((eyW >> 1) - 2) + gaze, eyY, 4, 4);
    g.fillStyle = skinE;
    g.fillRect(eL + 1, eyY + 4, eyW - 2, 1); g.fillRect(eR + 1, eyY + 4, eyW - 2, 1);

    /* 코 · 입 */
    const nY = eyY + 5, nH = 9 + bit(23, 4);
    g.fillStyle = skinD; g.fillRect(cx - 3, nY, 6, nH);
    g.fillStyle = skinL; g.fillRect(cx - 3, nY, 2, nH - 2);
    g.fillStyle = skinE; g.fillRect(cx - 5, nY + nH - 2, 10, 2);
    const mY = chin - 12, mW = 10 + bit(24, 6);
    g.fillStyle = '#7c3430'; g.fillRect(cx - (mW >> 1), mY, mW, 2);
    g.fillStyle = skinE; g.fillRect(cx - (mW >> 1), mY + 2, mW, 1);

    /* ── 수염 ── */
    g.fillStyle = hair;
    if (beard === 1) {                                        // 팔자수염
      g.fillRect(cx - 12, mY - 4, 10, 4); g.fillRect(cx + 2, mY - 4, 10, 4);
      g.fillRect(cx - 14, mY - 2, 3, 4); g.fillRect(cx + 11, mY - 2, 3, 4);
    } else if (beard === 2) {                                 // 수염 + 염소턱
      g.fillRect(cx - 12, mY - 4, 10, 4); g.fillRect(cx + 2, mY - 4, 10, 4);
      g.fillRect(cx - 5, mY + 4, 10, 8);
      g.fillStyle = shade(hair, 22); g.fillRect(cx - 3, mY + 5, 3, 5);
    } else if (beard >= 3) {                                  // 장수염
      g.fillRect(cx - 13, mY - 4, 11, 4); g.fillRect(cx + 2, mY - 4, 11, 4);
      for (let j = 0; j < (beard === 4 ? 26 : 18); j++) {
        const w = Math.max(4, 22 - Math.floor(j * 0.8));
        g.fillRect(cx - (w >> 1), mY + 4 + j, w, 1);
      }
      g.fillStyle = shade(hair, 24);
      g.fillRect(cx - 6, mY + 7, 3, 12); g.fillRect(cx + 3, mY + 9, 2, 8);
      g.fillStyle = hair;
      const sw = rowW(34) >> 1;                                                        // 구레나룻
      g.fillRect(cx - sw - 1, hy + 30, 4, 12); g.fillRect(cx + sw - 3, hy + 30, 4, 12);
    }

    /* ── 머리 · 관 ── (머리 윗폭에 맞춘다) */
    const hw = rowW(3), hx2 = cx - (hw >> 1);
    g.fillStyle = hair; g.fillRect(hx2 + 1, hy - 2, hw - 2, 8);
    g.fillStyle = shade(hair, 18); g.fillRect(hx2 + 4, hy - 1, hw - 14, 2);
    if (hat === 0) {                                          // 상투 · 머리띠
      g.fillStyle = hair; roundBox(g, hx2 + 4, hy - 10, hw - 8, 12, 4);
      g.fillStyle = hair; g.fillRect(cx - 4, hy - 16, 8, 8);
      g.fillStyle = robe[0]; g.fillRect(hx2 + 1, hy + 1, hw - 2, 4);
      g.fillStyle = shade(robe[0], 30); g.fillRect(hx2 + 1, hy + 1, hw - 2, 1);
    } else if (hat === 1) {                                   // 관모(문관)
      g.fillStyle = '#14141f'; g.fillRect(hx2 - 3, hy - 7, hw + 6, 10);
      g.fillStyle = '#30304c'; g.fillRect(hx2 - 3, hy - 7, hw + 6, 2);
      g.fillStyle = '#14141f'; roundBox(g, hx2 + 5, hy - 18, hw - 10, 13, 3);
      g.fillStyle = '#d8a020'; g.fillRect(cx - 5, hy - 16, 10, 3);
      g.fillStyle = '#14141f'; g.fillRect(hx2 - 10, hy - 5, 8, 4); g.fillRect(hx2 + hw + 2, hy - 5, 8, 4);
    } else if (hat === 3) {                                   // 유건(선비)
      const c = shade(robe[0], -20);
      g.fillStyle = c; roundBox(g, hx2 - 2, hy - 14, hw + 4, 18, 5);
      g.fillStyle = shade(c, 34); g.fillRect(hx2 + 2, hy - 13, hw - 12, 2);
      g.fillStyle = shade(c, -30); g.fillRect(hx2 - 2, hy + 1, hw + 4, 3);
      g.fillStyle = c; g.fillRect(hx2 + hw, hy - 8, 7, 16);
      g.fillStyle = shade(c, -40); g.fillRect(hx2 + hw, hy + 4, 7, 2);
    } else if (hat === 2) {                                   // 투구
      g.fillStyle = '#9c9cae'; roundBox(g, hx2 - 3, hy - 14, hw + 6, 20, 7);
      g.fillStyle = '#d8d8e8'; g.fillRect(hx2 + 4, hy - 13, 7, 15);
      g.fillStyle = '#5c5c70'; g.fillRect(hx2 - 3, hy + 2, hw + 6, 4);
      g.fillStyle = '#d8a020'; g.fillRect(cx - 4, hy - 19, 8, 6);
      g.fillStyle = '#e83c30';                                // 붉은 술
      for (let j = 0; j < 10; j++) g.fillRect(cx - 5 + (j & 1) * 2, hy - 21 + j, 9, 1);
      g.fillStyle = '#f87c60'; g.fillRect(cx - 1, hy - 21, 3, 8);
      g.fillStyle = '#b02418'; g.fillRect(cx - 5, hy - 13, 10, 2);
      g.fillStyle = '#7c7c90'; g.fillRect(hx2 - 7, hy + 6, 5, 18); g.fillRect(hx2 + hw + 2, hy + 6, 5, 18);
      g.fillStyle = '#5c5c70'; g.fillRect(hx2 - 7, hy + 12, 5, 2); g.fillRect(hx2 + hw + 2, hy + 12, 5, 2);
    } else {                                                  // 전건(무장 두건)
      const c = shade(robe[1], -10);
      g.fillStyle = c; roundBox(g, hx2 - 2, hy - 12, hw + 4, 16, 5);
      g.fillStyle = shade(c, 30); g.fillRect(hx2 + 3, hy - 11, hw - 14, 2);
      g.fillStyle = '#d8a020'; g.fillRect(cx - 6, hy - 10, 12, 3);
      g.fillStyle = shade(c, -34); g.fillRect(hx2 - 2, hy + 1, hw + 4, 3);
      g.fillStyle = c; g.fillRect(hx2 - 8, hy - 6, 7, 14);
    }

    /* 군주 표식 */
    if (opt.ruler) {
      g.fillStyle = '#f8e070';
      g.fillRect(hx2 + 4, hy - 22, hw - 8, 3);
      g.fillRect(hx2 + 4, hy - 26, 3, 4); g.fillRect(cx - 2, hy - 29, 4, 7); g.fillRect(hx2 + hw - 7, hy - 26, 3, 4);
      g.fillStyle = '#c08010'; g.fillRect(hx2 + 4, hy - 19, hw - 8, 1);
    }
    g.restore();
    return canvas;
  }

  const clampi = (v, a, b) => Math.max(a, Math.min(b, v));

  function roundBox(g, x, y, w, h, r) {
    g.fillRect(x + r, y, w - 2 * r, h);
    g.fillRect(x, y + r, w, h - 2 * r);
    for (let i = 0; i < r; i++) {
      const o = Math.round(r - Math.sqrt(r * r - (r - i - 1) * (r - i - 1)));
      g.fillRect(x + o, y + i, w - 2 * o, 1);
      g.fillRect(x + o, y + h - 1 - i, w - 2 * o, 1);
    }
  }

  function shade(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, v + d)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  return { draw, hash };
})();
