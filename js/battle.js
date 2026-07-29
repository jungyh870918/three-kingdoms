/* =========================================================================
 *  전투 — 16x9 격자 전술전 (부대 이동 / 공격 / 일기토 / 계략)
 * ========================================================================= */
const Battle = (() => {

  const COLS = 16, ROWS = 9, TW = 40, TH = 36;
  const S = n => GENERALS[n] || [50, 50, 50, 50, 50, 50, 5, 1];
  const rr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* 지형 0평지 1삼림 2산 3물 4성 */
  const TCOL = {
    0: ['#3c7a2c', '#4e9438'], 1: ['#1e5c22', '#2c7028'], 2: ['#7c6440', '#98805c'],
    3: ['#2c50c0', '#4470e0'], 4: ['#a8a090', '#c8c0b0'],
  };
  const TDEF = { 0: 1, 1: 1.2, 2: 1.4, 3: 0.75, 4: 1.7 };
  const TCOST = { 0: 1, 1: 2, 2: 3, 3: 3, 4: 1 };
  const WSPEED = { '기마': 5, '보병': 3, '노궁': 3, '강노': 3 };
  const WRANGE = { '기마': 1, '보병': 1, '노궁': 2, '강노': 3 };
  const WATK = { '기마': 1.3, '보병': 1.0, '노궁': 1.05, '강노': 1.15 };

  let B = null;   // 전투 상태

  /* ── 지형 생성 ──────────────────────────────────────────────────── */
  function makeField(cityId) {
    const t = CITIES[cityId - 1].t;
    const g = [];
    for (let y = 0; y < ROWS; y++) {
      g[y] = [];
      for (let x = 0; x < COLS; x++) {
        let v = 0;
        const r = Math.random();
        if (t === 's') v = r < 0.28 ? 2 : r < 0.5 ? 1 : 0;
        else if (t === 'w') v = r < 0.2 ? 3 : r < 0.34 ? 1 : 0;
        else v = r < 0.12 ? 1 : r < 0.18 ? 2 : 0;
        g[y][x] = v;
      }
    }
    /* 수비측 성 (오른쪽) : 13열이 성벽, 14~15열이 성 안 */
    for (let y = 1; y <= 7; y++) for (let x = 13; x < COLS; x++) g[y][x] = 4;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < 2; x++) g[y][x] = 0;   // 공격측 집결지
    return g;
  }

  /* ── 부대 배치 ──────────────────────────────────────────────────── */
  function place(units, side, city, defCity) {
    const arr = [];
    units.forEach((u, i) => {
      const bo = u.bonus || {};
      const lead = (u.name ? S(u.name)[4] : 40) + (bo.l || 0);
      const navy = (u.name ? S(u.name)[5] : 40) + (bo.n || 0);
      const mo = clamp(58 + (u.train || 50) / 3 + (u.name ? S(u.name)[3] / 10 : 0) + (side === 'D' ? 8 : 0), 20, 100);
      arr.push({
        side, name: u.name, faceless: !u.name,
        troops: u.troops, max: u.troops, morale: Math.round(mo),
        train: u.train || 50, weapon: u.weapon || '보병',
        lead, navy, bonus: bo,
        war: (u.name ? S(u.name)[0] : 45) + (bo.w || 0),
        int: (u.name ? S(u.name)[1] : 40) + (bo.i || 0),
        x: side === 'A' ? (i % 2) : 15 - (i % 2),
        y: side === 'A' ? 1 + i * 2 % ROWS : Math.min(ROWS - 1, 2 + i),
        acted: false, alive: true,
      });
    });
    /* 겹침 정리 */
    arr.forEach(u => {
      while (arr.some(o => o !== u && o.x === u.x && o.y === u.y)) { u.y = (u.y + 1) % ROWS; }
    });
    return arr;
  }

  /* ── 렌더 ───────────────────────────────────────────────────────── */
  function drawField() {
    const cv = UI.$('#warmap'), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = B.grid[y][x], [c0, c1] = TCOL[t];
      g.fillStyle = c0; g.fillRect(x * TW, y * TH, TW, TH);
      g.fillStyle = c1;
      for (let j = 0; j < TH; j += 2) for (let i = ((j >> 1) & 1) * 2; i < TW; i += 4) g.fillRect(x * TW + i, y * TH + j, 2, 2);
      if (t === 2) { g.fillStyle = '#5c4828'; g.beginPath(); g.moveTo(x * TW + 8, y * TH + 28); g.lineTo(x * TW + 20, y * TH + 8); g.lineTo(x * TW + 32, y * TH + 28); g.fill(); g.fillStyle = '#c8b890'; g.fillRect(x * TW + 18, y * TH + 10, 4, 4); }
      if (t === 1) { g.fillStyle = '#123c14'; for (let k = 0; k < 3; k++) { const ox = x * TW + 6 + k * 11, oy = y * TH + 12 + (k % 2) * 8; g.fillRect(ox, oy, 8, 8); g.fillRect(ox + 3, oy + 8, 2, 4); } }
      if (t === 4) {
        const px = x * TW, py = y * TH;
        g.fillStyle = '#b0a894'; g.fillRect(px, py, TW, TH);
        g.fillStyle = '#8c8474';                                  // 석재 줄눈
        for (let j = 0; j < TH; j += 6) g.fillRect(px, py + j, TW, 1);
        for (let j = 0; j < TH; j += 12) for (let i = ((j / 6) & 1) * 10; i < TW; i += 20) g.fillRect(px + i, py, 1, TH);
        if (x === 13) {                                           // 성벽 총안
          g.fillStyle = '#6c6454'; g.fillRect(px, py, 6, TH);
          g.fillStyle = '#e4dcc4';
          for (let j = 0; j < TH; j += 9) g.fillRect(px, py + j, 4, 5);
        }
        if (x === 14 && y === 4) {                                 // 성루 · 깃발
          g.fillStyle = '#7c2c14'; g.fillRect(px + 6, py + 8, TW - 12, TH - 12);
          g.fillStyle = '#c85028'; g.fillRect(px + 6, py + 8, TW - 12, 4);
          g.fillStyle = '#f8d040'; g.fillRect(px + 14, py + 2, 3, 8);
          g.fillStyle = B ? B.defColor : '#fff'; g.fillRect(px + 17, py + 2, 8, 5);
        }
      }
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1;
      g.strokeRect(x * TW + 0.5, y * TH + 0.5, TW - 1, TH - 1);
    }
    /* 이동 가능 표시 */
    if (B.mode === 'move' && B.sel) {
      g.fillStyle = 'rgba(255,255,255,0.22)';
      B.reach.forEach(k => { const [x, y] = k.split(',').map(Number); g.fillRect(x * TW + 2, y * TH + 2, TW - 4, TH - 4); });
    }
    if (B.mode === 'attack' && B.sel) {
      g.fillStyle = 'rgba(255,60,60,0.3)';
      B.targets.forEach(u => g.fillRect(u.x * TW + 2, u.y * TH + 2, TW - 4, TH - 4));
    }
    /* 부대 */
    B.units.filter(u => u.alive).forEach(u => {
      const px = u.x * TW, py = u.y * TH;
      const col = u.side === 'A' ? B.atkColor : B.defColor;
      g.fillStyle = '#000'; g.fillRect(px + 5, py + 6, 30, 20);
      g.fillStyle = col; g.fillRect(px + 6, py + 7, 28, 18);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(px + 6, py + 21, 28, 4);
      g.fillStyle = u.morale > 60 ? '#40e040' : u.morale > 30 ? '#f8f000' : '#f04040';
      g.fillRect(px + 6, py + 21, Math.round(28 * u.morale / 100), 4);
      /* 병종 표식 */
      g.fillStyle = '#000';
      g.font = '11px Galmuri11, monospace'; g.textBaseline = 'top';
      const mark = { '기마': '騎', '보병': '步', '노궁': '弓', '강노': '弩' }[u.weapon] || '步';
      g.fillText(mark, px + 8, py + 9);
      g.fillStyle = '#fff';
      const nm = u.faceless ? '병사' : u.name;
      const cl = (t, w) => Math.max(1, Math.min(640 - w, t));
      outline(g, nm, cl(px + 20 - nm.length * 5.5, nm.length * 11), py - 3, '#fff');
      const ts = String(u.troops);
      outline(g, ts, cl(px + 20 - ts.length * 3, ts.length * 6), py + 26, '#ffe080');
      if (u === B.sel) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(px + 3, py + 4, 34, 24); }
      if (u.acted) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(px + 6, py + 7, 28, 18); }
    });
    /* 커서 */
    if (B.cur) {
      g.strokeStyle = B.blink ? '#ffff00' : '#ff8000'; g.lineWidth = 2;
      g.strokeRect(B.cur[0] * TW + 1, B.cur[1] * TH + 1, TW - 2, TH - 2);
    }
  }

  function outline(g, txt, x, y, col) {
    g.font = '11px Galmuri11, monospace'; g.textBaseline = 'top';
    g.fillStyle = '#000';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(txt, x + dx, y + dy);
    g.fillStyle = col; g.fillText(txt, x, y);
  }

  function drawHud(msg) {
    UI.$('#warbar').innerHTML =
      `<span class="hy">${B.turn}/${B.maxTurn}턴</span>
       <span class="${B.phase === 'A' ? 'hr' : 'hi'}">${B.phase === 'A' ? '공격측' : '수비측'} 차례</span>
       <span>${B.atkName} 군 <span class="hy">${sum('A')}</span></span>
       <span>${B.defName} 군 <span class="hy">${sum('D')}</span></span>
       <span class="hi">${B.playerSide ? (B.phase === B.playerSide ? '지휘하시오' : '적군 행동 중') : '관전'}</span>`;
    const u = B.sel || B.hover;
    UI.$('#warhud').innerHTML = `
      <div class="col" style="width:520px;flex:none">${u && !u.faceless
        ? `<span class="hy">${u.name}</span>　무력 ${u.war}　지력 ${u.int}　육지 ${u.lead}　수지 ${u.navy}` +
          (u.bonus && Object.keys(u.bonus).length ? ' <span class="ho">＊보물</span>' : '')
        : '<span class="hi">부대를 고르시오</span>'}
        ${u ? `<br>병사 <span class="hy">${u.troops}</span>　사기 <span class="hg">${u.morale}</span>　훈련 ${u.train}　${u.weapon}` : ''}</div>
      <div class="col" style="flex:1">${msg || ''}</div>`;
  }
  const sum = side => B.units.filter(u => u.alive && u.side === side).reduce((s, u) => s + u.troops, 0);

  /* ── 이동 범위 ──────────────────────────────────────────────────── */
  function reachable(u) {
    const spd = WSPEED[u.weapon] || 3;
    const seen = { [u.x + ',' + u.y]: 0 }, q = [[u.x, u.y, 0]], out = new Set();
    while (q.length) {
      const [x, y, c] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const t = B.grid[ny][nx];
        const cost = TCOST[t] + (t === 4 && u.side === 'A' ? 2 : 0);
        const nc = c + cost;
        if (nc > spd) continue;
        const k = nx + ',' + ny;
        if (seen[k] !== undefined && seen[k] <= nc) continue;
        if (B.units.some(o => o.alive && o.x === nx && o.y === ny)) continue;
        seen[k] = nc; out.add(k); q.push([nx, ny, nc]);
      }
    }
    return out;
  }

  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const unitAt = (x, y) => B.units.find(u => u.alive && u.x === x && u.y === y);

  /* ── 공격 ───────────────────────────────────────────────────────── */
  async function attack(a, d, log) {
    const t = B.grid[d.y][d.x];
    const water = t === 3;
    const lead = water ? d.navy : d.lead;
    const alead = water ? a.navy : a.lead;
    let atk = a.troops / 100 * (1 + alead / 90) * WATK[a.weapon] * (a.morale / 100) * (0.5 + a.train / 100);
    if (a.weapon === '기마' && (t === 1 || t === 2)) atk *= 0.7;
    const dmg = Math.max(30, Math.round(atk * 6 * (0.85 + Math.random() * 0.3) / TDEF[t] / (1 + lead / 260)));
    d.troops -= dmg;
    d.morale = clamp(d.morale - Math.round(dmg / Math.max(1, d.max) * 90) - rr(1, 4), 0, 100);
    log.push(`${a.faceless ? '병사' : a.name} → ${d.faceless ? '병사' : d.name} : ${UI.rd(dmg)}명 손실`);

    /* 반격 (근접 · 생존 시) */
    if (d.troops > 0 && dist(a, d) === 1 && (WRANGE[d.weapon] || 1) >= 1) {
      const at = B.grid[a.y][a.x];
      let ratk = d.troops / 100 * (1 + (at === 3 ? d.navy : d.lead) / 90) * WATK[d.weapon] * (d.morale / 100) * (0.5 + d.train / 100);
      const rd = Math.max(20, Math.round(ratk * 3.4 * (0.8 + Math.random() * 0.3) / TDEF[at]));
      a.troops -= rd;
      a.morale = clamp(a.morale - Math.round(rd / Math.max(1, a.max) * 70), 0, 100);
      log.push(`${d.faceless ? '병사' : d.name}의 반격 : ${UI.rd(rd)}명 손실`);
    }
    [a, d].forEach(u => {
      if (u.troops <= u.max * 0.08 || u.troops <= 0 || u.morale <= 0) rout(u, log);
    });
  }

  function rout(u, log) {
    u.alive = false; u.troops = Math.max(0, u.troops);
    const nm = u.faceless ? '병사' : u.name;
    const r = Math.random();
    if (u.faceless) { log.push(`${nm} 부대가 궤멸했습니다`); return; }
    if (r < 0.16) { u.fate = 'dead'; log.push(`${UI.rd(nm + ' 전사')}!`); }
    else if (r < 0.55) { u.fate = 'captured'; log.push(`${UI.og(nm)}가 붙잡혔습니다`); }
    else { u.fate = 'fled'; log.push(`${nm} 부대가 퇴각했습니다`); }
  }

  /* ── 일기토 ─────────────────────────────────────────────────────── */
  async function duel(a, d, log) {
    if (a.faceless || d.faceless) return;
    const aw = a.war + rr(0, 30), dw = d.war + rr(0, 30);
    await say(`${UI.yl(a.name)} 과 ${UI.yl(d.name)}의 일기토!`);
    const win = aw >= dw ? a : d, lose = aw >= dw ? d : a;
    win.morale = clamp(win.morale + 14, 0, 100);
    lose.morale = clamp(lose.morale - 26, 0, 100);
    lose.troops = Math.floor(lose.troops * 0.9);
    log.push(`${UI.gr(win.name)}가 ${lose.name}를 물리쳤습니다!`);
    if (Math.random() < 0.14) { rout(lose, log); if (!lose.alive) lose.fate = Math.random() < 0.5 ? 'dead' : 'captured'; }
  }

  /* ── AI 행동 ────────────────────────────────────────────────────── */
  async function aiTurn(side, log) {
    const mine = B.units.filter(u => u.alive && u.side === side && !u.acted);
    for (const u of mine) {
      const foes = B.units.filter(o => o.alive && o.side !== side);
      if (!foes.length) break;
      /* 사거리 내 표적 */
      let tgt = foes.filter(f => dist(u, f) <= (WRANGE[u.weapon] || 1))
        .sort((a, b) => a.troops - b.troops)[0];
      if (!tgt) {
        /* 가까운 적으로 접근 */
        const goal = foes.slice().sort((a, b) => dist(u, a) - dist(u, b))[0];
        const reach = reachable(u);
        let best = null, bd = 1e9;
        reach.forEach(k => {
          const [x, y] = k.split(',').map(Number);
          const d = Math.abs(x - goal.x) + Math.abs(y - goal.y) - (B.grid[y][x] === 2 ? 0.5 : 0);
          if (d < bd) { bd = d; best = [x, y]; }
        });
        if (best) { u.x = best[0]; u.y = best[1]; }
        tgt = foes.filter(f => dist(u, f) <= (WRANGE[u.weapon] || 1)).sort((a, b) => a.troops - b.troops)[0];
      } else if (side === 'A' && Math.random() < 0.5) {
        /* 성으로 파고들기 */
        const reach = reachable(u);
        let best = null, bd = 1e9;
        reach.forEach(k => {
          const [x, y] = k.split(',').map(Number);
          const d = Math.abs(x - tgt.x) + Math.abs(y - tgt.y);
          if (d < bd && d >= 1) { bd = d; best = [x, y]; }
        });
        if (best && bd <= (WRANGE[u.weapon] || 1)) { u.x = best[0]; u.y = best[1]; }
      }
      if (tgt) await attack(u, tgt, log);
      u.acted = true;
      drawField(); drawHud(log.slice(-2).join('   '));
      await sleep(B.playerSide ? 260 : 40);
      if (over()) return;
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ── 종료 판정 ──────────────────────────────────────────────────── */
  function over() {
    const A = B.units.some(u => u.alive && u.side === 'A');
    const D = B.units.some(u => u.alive && u.side === 'D');
    if (!D) return 'A';
    if (!A) return 'D';
    /* 성 점령 */
    if (B.units.some(u => u.alive && u.side === 'A' && u.x >= 14 && u.y >= 3 && u.y <= 5)) return 'A';
    if (B.turn > B.maxTurn) return 'D';
    return null;
  }

  /* ── 플레이어 조작 ──────────────────────────────────────────────── */
  async function humanTurn(side, log) {
    B.mode = 'select'; B.sel = null;
    while (true) {
      const remain = B.units.filter(u => u.alive && u.side === side && !u.acted);
      if (!remain.length) return;
      drawField();
      drawHud(B.sel
        ? '이동:빈 칸 / 공격:적 클릭　Enter 대기　Tab 다음　E 종료'
        : `부대를 클릭 (남은 부대 ${remain.length})　Tab 선택　E 종료`);
      const ev = await UI.nextInput();
      if (ev.t === 'key') {
        if (ev.k === 'Tab' || ev.k === ' ') {
          const i = remain.indexOf(B.sel);
          B.sel = remain[(i + 1) % remain.length];
          B.reach = reachable(B.sel); B.mode = 'move';
          B.targets = B.units.filter(o => o.alive && o.side !== side && dist(B.sel, o) <= (WRANGE[B.sel.weapon] || 1));
        } else if (ev.k === 'Enter' && B.sel) { B.sel.acted = true; B.sel = null; B.mode = 'select'; }
        else if (ev.k === 'e' || ev.k === 'E') { remain.forEach(u => { u.acted = true; }); return; }
        else if (ev.k === 'Escape') { B.sel = null; B.mode = 'select'; }
        continue;
      }
      /* 클릭 */
      const gx = Math.floor(ev.x / 2 / TW), gy = Math.floor((ev.y - 44) / 2 / TH);
      if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) continue;
      const u = unitAt(gx, gy);
      if (!B.sel) {
        if (u && u.side === side && !u.acted) {
          B.sel = u; B.reach = reachable(u); B.mode = 'move';
          B.targets = B.units.filter(o => o.alive && o.side !== side && dist(u, o) <= (WRANGE[u.weapon] || 1));
        }
        continue;
      }
      if (u && u.side !== side) {
        if (dist(B.sel, u) <= (WRANGE[B.sel.weapon] || 1)) {
          if (!B.sel.faceless && !u.faceless && dist(B.sel, u) === 1 && S(B.sel.name)[0] >= 70 && Math.random() < 0.9) {
            const i = await UI.menu([{ label: '1 공격' }, { label: '2 일기토' }], { title: '어떻게 합니까', x: 500, y: 300, width: 240 });
            if (i === null) continue;
            if (i === 1) await duel(B.sel, u, log); else await attack(B.sel, u, log);
          } else await attack(B.sel, u, log);
          B.sel.acted = true; B.sel = null; B.mode = 'select';
          drawField();
          await showLog(log);
          if (over()) return;
        }
        continue;
      }
      if (!u && B.reach.has(gx + ',' + gy)) {
        B.sel.x = gx; B.sel.y = gy;
        B.reach = new Set();
        B.targets = B.units.filter(o => o.alive && o.side !== side && dist(B.sel, o) <= (WRANGE[B.sel.weapon] || 1));
        B.mode = 'attack';
        if (!B.targets.length) { B.sel.acted = true; B.sel = null; B.mode = 'select'; }
      } else if (u === B.sel) { B.sel.acted = true; B.sel = null; B.mode = 'select'; }
    }
  }

  async function say(text) {
    drawField();
    drawHud(text + '　　' + UI.cy('아무 키나 눌러 주세요'));
    await UI.nextInput();
  }

  async function showLog(log) {
    const tail = log.slice(-3);
    if (!tail.length) return;
    drawHud(tail.join('   '));
    await sleep(420);
  }

  /* ── 메인 ───────────────────────────────────────────────────────── */
  async function run(st, o) {
    const atkClan = st.clans[o.atkClan], defClan = o.defClan >= 0 ? st.clans[o.defClan] : null;
    B = {
      grid: makeField(o.toCity),
      units: [...place(o.atkUnits, 'A'), ...place(o.defUnits, 'D')],
      turn: 1, maxTurn: 30, phase: 'A', sel: null, hover: null, cur: null,
      mode: 'select', reach: new Set(), targets: [], blink: true,
      playerSide: o.playerSide,
      atkColor: atkClan.color, defColor: defClan ? defClan.color : '#ffffff',
      atkName: atkClan.ruler, defName: defClan ? defClan.ruler : '무주공산',
    };
    const scr = UI.$('#warscreen');
    scr.classList.add('on');
    UI.msg('');
    const log = [];
    await say(`${UI.yl(B.atkName + ' 군')}이 ${UI.yl(CITIES[o.toCity - 1].name)}의 ${UI.yl(B.defName + ' 군')}을 공격합니다`);

    let result = null;
    while (!(result = over())) {
      /* 페이즈 */
      B.units.filter(u => u.side === B.phase).forEach(u => { u.acted = false; });
      drawField(); drawHud(`${B.phase === 'A' ? B.atkName : B.defName} 군의 차례`);
      await sleep(240);
      if (B.playerSide === B.phase) await humanTurn(B.phase, log);
      else await aiTurn(B.phase, log);
      if (over()) break;
      if (B.phase === 'A') B.phase = 'D';
      else { B.phase = 'A'; B.turn++; B.units.filter(u => u.alive).forEach(u => { u.morale = clamp(u.morale + 2, 0, 100); }); }
    }

    /* 결과 정리 */
    const winner = result;
    const survivors = { A: [], D: [] }, dead = { A: [], D: [] }, captured = [];
    B.units.forEach(u => {
      if (u.alive) { survivors[u.side].push({ name: u.name, troops: Math.max(0, u.troops) }); return; }
      if (u.faceless) return;
      if (u.fate === 'dead') dead[u.side].push(u.name);
      else if (u.fate === 'captured' && u.side !== winner) captured.push(u.name);
    });
    await say(winner === 'A' ? UI.yl(`${B.atkName} 군이 승리했습니다`) : UI.cy(`${B.defName} 군이 성을 지켜냈습니다`));
    scr.classList.remove('on');
    return { winner, survivors, dead, captured };
  }

  return { run };
})();
