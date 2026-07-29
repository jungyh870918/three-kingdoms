/* =========================================================================
 *  UI 레이어 — 도트 패널 · 메뉴 · 입력(Promise 기반)
 *  키보드 우선(원작처럼 숫자 입력), 마우스 클릭도 지원
 * ========================================================================= */
const UI = (() => {

  const $ = s => document.querySelector(s);
  const stage = $('#stage');
  const center = $('#center');
  const mapCv = $('#map');

  /* ── 화면 맞춤 ──────────────────────────────────────────────────────
   *  스테이지(1280x800)를 화면에 꽉 채우고 정중앙에 놓는다.
   *  세로 화면(폰)에서는 90도 돌려서 채운다 — 원작이 가로 비율이라 그대로
   *  두면 위아래로 검은 여백만 남는다.
   * ------------------------------------------------------------------ */
  const view = { s: 1, tx: 0, ty: 0, rot: false };

  function fit() {
    const vv = window.visualViewport;
    const vw = Math.round(vv ? vv.width : window.innerWidth);
    const vh = Math.round(vv ? vv.height : window.innerHeight);

    const sFlat = Math.min(vw / 1280, vh / 800);
    const sRot = Math.min(vw / 800, vh / 1280);
    const rot = sRot > sFlat;                      /* 세로 화면이면 돌린다 */
    const s = rot ? sRot : sFlat;

    if (rot) {
      /* rotate(90deg) 뒤 (x,y) → (-y, x) 이므로 오른쪽 위를 원점으로 잡는다 */
      view.tx = (vw + 800 * s) / 2;
      view.ty = (vh - 1280 * s) / 2;
      stage.style.transform =
        `translate(${view.tx}px,${view.ty}px) rotate(90deg) scale(${s})`;
    } else {
      view.tx = (vw - 1280 * s) / 2;
      view.ty = (vh - 800 * s) / 2;
      stage.style.transform = `translate(${view.tx}px,${view.ty}px) scale(${s})`;
    }
    view.s = s;
    view.rot = rot;
  }

  /* 화면 좌표 → 스테이지 내부 좌표(1280x800 기준) */
  function toStage(cx, cy) {
    const u = cx - view.tx, v = cy - view.ty;
    return view.rot
      ? { x: v / view.s, y: -u / view.s }
      : { x: u / view.s, y: v / view.s };
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => { fit(); setTimeout(fit, 300); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fit);
    window.visualViewport.addEventListener('scroll', fit);
  }
  /* 모바일 브라우저는 주소창이 접히며 크기가 늦게 확정된다 */
  window.addEventListener('load', () => { fit(); setTimeout(fit, 300); });

  /* ── 입력 ───────────────────────────────────────────────────────── */
  let waiter = null;
  function nextInput() { return new Promise(r => { waiter = r; }); }
  function send(ev) { if (waiter) { const w = waiter; waiter = null; w(ev); } }

  window.addEventListener('keydown', e => {
    if (['F5', 'F12'].includes(e.key)) return;
    e.preventDefault();
    send({ t: 'key', k: e.key });
  });
  let touched = 0;
  stage.addEventListener('mousedown', e => {
    if (Date.now() - touched < 700) return;        /* 터치가 만든 가짜 클릭 */
    const p = toStage(e.clientX, e.clientY);
    send({ t: 'click', x: p.x, y: p.y, target: e.target });
  });
  stage.addEventListener('touchstart', e => {
    touched = Date.now();
    const t = e.changedTouches[0];
    if (!t) return;
    e.preventDefault();
    const p = toStage(t.clientX, t.clientY);
    send({ t: 'click', x: p.x, y: p.y, target: t.target || e.target });
  }, { passive: false });
  stage.addEventListener('contextmenu', e => { e.preventDefault(); send({ t: 'key', k: 'Escape' }); });

  const isCancel = ev => ev.t === 'key' && ['Escape', 'Backspace', 'x', 'X'].includes(ev.k);
  const isOk = ev => ev.t === 'key' && ['Enter', ' ', 'z', 'Z'].includes(ev.k);

  /* ── 색 헬퍼 ────────────────────────────────────────────────────── */
  const cy = s => `<span class="hi">${s}</span>`;
  const yl = s => `<span class="hy">${s}</span>`;
  const gr = s => `<span class="hg">${s}</span>`;
  const mg = s => `<span class="hm">${s}</span>`;
  const og = s => `<span class="ho">${s}</span>`;
  const rd = s => `<span class="hr">${s}</span>`;

  /* ── 상단 명령 바 ───────────────────────────────────────────────── */
  const CMDS = ['휴양', '군사', '인사', '외교', '정보', '개발', '계략', '상인', '특별', '기능'];
  function cmdbar(active) {
    $('#cmdbar').innerHTML = CMDS.map((c, i) =>
      `<span class="ci ${active === i ? 'on' : ''}" data-cmd="${i}">${i}.${c}</span>`).join('');
  }

  /* ── 메시지 창 ──────────────────────────────────────────────────── */
  function msg(html, cursor) {
    $('#msg').innerHTML = html + (cursor ? '<span class="cur"></span>' : '');
  }
  async function anyKey(html) {
    if (html !== undefined) msg(html + '\n' + cy('아무 키나 눌러 주세요'));
    await nextInput();
  }

  /* ── 시세 · 연월 · 초상화 ───────────────────────────────────────── */
  function market(m) {
    $('#m-ricebuy').textContent = m.riceBuy;
    $('#m-ricesell').textContent = m.riceSell;
    $('#m-bow').textContent = m.bow;
    $('#m-cbow').textContent = m.cbow;
    $('#m-horse').textContent = m.horse;
  }
  function date(st) {
    $('#d-year').textContent = st.year + '년';
    $('#d-season').textContent = SEASONS[st.seasonIdx];
    $('#d-month').textContent = st.month + '월';
  }
  function face(name, ruler) {
    if (!name) { $('#facepane').classList.add('hidden'); return; }
    $('#facepane').classList.remove('hidden');
    Portrait.draw($('#face'), name, { ruler });
  }

  /* ── 도시 정보 패널 ─────────────────────────────────────────────── */
  const gauge = (v, max, cls) =>
    `<div class="gauge"><i class="${cls || ''}" style="width:${Math.max(2, Math.min(100, v / max * 100))}%"></i></div>`;

  function cityPane(st, id) {
    const p = $('#citypane');
    if (!id) { p.classList.add('hidden'); return; }
    const c = st.cities[id], d = CITIES[id - 1];
    const clan = c.clan >= 0 ? st.clans[c.clan] : null;
    const gov = c.governor ? c.governor : '－';
    const adv = c.advisorName || '－';
    p.classList.remove('hidden');
    p.innerHTML = `
      <div class="hd">
        <span class="sq" style="background:${clan ? clan.color : '#fff'}"></span>
        <span>${id}.${d.name}</span>
        <span class="hr">군주</span><span>${clan ? clan.ruler : '－'}</span>
      </div>
      <div class="off"><span class="hm">태수</span><span>${gov}</span>
        <span class="hg">군사</span><span>${adv}</span></div>
      <table>
        <tr><td class="k">인구</td><td class="g">${gauge(c.pop, 1000000)}</td><td class="v">${c.pop}</td></tr>
        <tr><td class="k">금</td><td class="g">${gauge(c.gold, 30000, 'b')}</td><td class="v">${c.gold}</td></tr>
        <tr><td class="k">군량</td><td class="g">${gauge(c.rice, 400000)}</td><td class="v">${c.rice}</td></tr>
        <tr><td class="k">병사</td><td class="g">${gauge(c.troops, 100000, 'r')}</td><td class="v">${c.troops}</td></tr>
        <tr><td class="k">장수</td><td class="g">${gauge(c.gens.length, 20, 'b')}</td><td class="v">${c.gens.length}</td></tr>
        <tr><td class="k">민충</td><td class="g">${gauge(c.loyal, 100)}</td><td class="v">${c.loyal}</td></tr>
      </table>`;
  }

  /* ── 메뉴 ───────────────────────────────────────────────────────── */
  /* items: [{label, dis}] / opt: {x,y,title,width,noCancel} → index | null */
  async function menu(items, opt) {
    opt = opt || {};
    const el = document.createElement('div');
    el.className = 'panel menu';
    el.style.left = (opt.x !== undefined ? opt.x : 40) + 'px';
    el.style.top = (opt.y !== undefined ? opt.y : 60) + 'px';
    if (opt.width) el.style.width = opt.width + 'px';
    center.appendChild(el);
    let sel = opt.sel || 0;
    const render = () => {
      el.innerHTML = (opt.title ? `<div class="hd">${opt.title}</div>` : '') +
        items.map((it, i) =>
          `<div class="it ${i === sel ? 'sel' : ''} ${it.dis ? 'dis' : ''}" data-i="${i}">${it.label}</div>`).join('');
    };
    render();
    try {
      while (true) {
        const ev = await nextInput();
        if (ev.t === 'click') {
          const t = ev.target.closest && ev.target.closest('.it');
          if (t && el.contains(t)) {
            const i = +t.dataset.i;
            if (!items[i].dis) return i;
          } else if (!opt.noCancel && !el.contains(ev.target)) return null;
          continue;
        }
        const k = ev.k;
        if (k === 'ArrowDown' || k === 'j') { sel = (sel + 1) % items.length; render(); }
        else if (k === 'ArrowUp' || k === 'k') { sel = (sel + items.length - 1) % items.length; render(); }
        else if (isOk(ev)) { if (!items[sel].dis) return sel; }
        else if (isCancel(ev)) { if (!opt.noCancel) return null; }
        else if (/^[0-9]$/.test(k)) {
          const i = opt.numBase === 0 ? +k : (+k === 0 ? 9 : +k - 1);
          if (i < items.length && !items[i].dis) return i;
        }
      }
    } finally { el.remove(); }
  }

  /* ── 상단 명령 선택 (0~9) ───────────────────────────────────────── */
  async function topCommand(prompt, allowed) {
    msg(prompt, true);
    while (true) {
      const ev = await nextInput();
      if (ev.t === 'click') {
        const t = ev.target.closest && ev.target.closest('.ci');
        if (t) { const i = +t.dataset.cmd; if (!allowed || allowed.includes(i)) return i; }
        if (ev.y > 44 && ev.y < 690) { const cid = GameMap.at(ev.x, ev.y - 44); if (cid) return { city: cid }; }
        continue;
      }
      if (/^[0-9]$/.test(ev.k)) { const i = +ev.k; if (!allowed || allowed.includes(i)) { cmdbar(i); return i; } }
      if (isCancel(ev)) return null;
    }
  }

  /* ── 수치 입력 ──────────────────────────────────────────────────── */
  async function pickNum(prompt, min, max, def) {
    let buf = '';
    const show = () => msg(`${prompt} (${min}～${max})  ${yl(buf === '' ? (def !== undefined ? def : 0) : buf)}`, true);
    show();
    while (true) {
      const ev = await nextInput();
      if (ev.t !== 'key') continue;
      const k = ev.k;
      if (/^[0-9]$/.test(k)) { if (buf.length < 8) buf += k; show(); }
      else if (k === 'Backspace') { buf = buf.slice(0, -1); show(); }
      else if (k === 'ArrowUp') { buf = String(max); show(); }
      else if (k === 'ArrowDown') { buf = String(min); show(); }
      else if (k === 'Enter' || k === ' ') {
        let v = buf === '' ? (def !== undefined ? def : min) : +buf;
        if (v < min || v > max) { buf = ''; show(); continue; }
        return v;
      } else if (['Escape', 'x', 'X'].includes(k)) return null;
    }
  }

  /* ── 도시 지정(지도에서) ────────────────────────────────────────── */
  async function pickCity(st, prompt, valid, start) {
    const list = CITIES.filter(c => !valid || valid(c.id)).map(c => c.id);
    if (!list.length) return null;
    let i = Math.max(0, list.indexOf(start || list[0]));
    const prev = st.cursorCity;
    const show = () => {
      st.cursorCity = list[i];
      cityPane(st, list[i]);
      msg(`${prompt} : ${yl(list[i] + '.' + CITIES[list[i] - 1].name)}  ${cy('←→ 선택 / Enter 결정')}`, true);
      Render.now();
    };
    show();
    try {
      while (true) {
        const ev = await nextInput();
        if (ev.t === 'click') {
          if (ev.y > 44) {
            const cid = GameMap.at(ev.x, ev.y - 44);
            if (cid && list.includes(cid)) {
              if (cid === list[i]) return cid;
              i = list.indexOf(cid); show();
            }
          }
          continue;
        }
        const k = ev.k;
        if (['ArrowRight', 'ArrowDown', 'l', 'j'].includes(k)) { i = (i + 1) % list.length; show(); }
        else if (['ArrowLeft', 'ArrowUp', 'h', 'k'].includes(k)) { i = (i + list.length - 1) % list.length; show(); }
        else if (isOk(ev)) return list[i];
        else if (isCancel(ev)) return null;
      }
    } finally { st.cursorCity = prev; cityPane(st, null); Render.now(); }
  }

  /* ── 무장 선택 ──────────────────────────────────────────────────── */
  /* gens: [{name, ...}] → 이름 | null.  multi=true 면 배열 반환 */
  async function pickGeneral(st, prompt, gens, opt) {
    opt = opt || {};
    if (!gens.length) { await anyKey(rd('해당하는 무장이 없습니다')); return null; }
    const el = document.createElement('div');
    el.className = 'panel';
    el.style.cssText = 'left:24px;top:56px;width:820px;';
    center.appendChild(el);
    let sel = 0; const chosen = new Set();
    const render = () => {
      msg(prompt + (opt.multi ? cy('  (Space 선택 / Enter 결정)') : ''), true);
      el.innerHTML = `<table class="grid">
        <tr><th class="l">무장</th><th>무력</th><th>지력</th><th>정치</th><th>매력</th><th>육지</th><th>수지</th><th>충성</th><th class="l">상태</th></tr>
        ${gens.map((g, i) => {
          const s = GENERALS[g.name] || [0, 0, 0, 0, 0, 0];
          return `<tr class="${i === sel ? 'sel' : ''} ${g.acted ? 'dim' : ''}" data-i="${i}">
            <td class="l">${chosen.has(i) ? og('●') : '　'}${g.name}</td>
            <td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td><td>${s[5]}</td>
            <td>${g.loyal !== undefined ? g.loyal : '－'}</td>
            <td class="l">${g.acted ? '행동완료' : (g.tag || '')}</td></tr>`;
        }).join('')}</table>`;
      face(gens[sel].name, gens[sel].name === (st.clans[st.playerClan] || {}).ruler);
    };
    render();
    try {
      while (true) {
        const ev = await nextInput();
        if (ev.t === 'click') {
          const t = ev.target.closest && ev.target.closest('tr');
          if (t && el.contains(t) && t.dataset.i !== undefined) {
            const i = +t.dataset.i;
            if (opt.multi) { chosen.has(i) ? chosen.delete(i) : chosen.add(i); sel = i; render(); }
            else return gens[i].name;
          } else if (!el.contains(ev.target)) return null;
          continue;
        }
        const k = ev.k;
        if (['ArrowDown', 'j'].includes(k)) { sel = (sel + 1) % gens.length; render(); }
        else if (['ArrowUp', 'k'].includes(k)) { sel = (sel + gens.length - 1) % gens.length; render(); }
        else if (k === ' ' && opt.multi) { chosen.has(sel) ? chosen.delete(sel) : chosen.add(sel); render(); }
        else if (k === 'Enter') {
          if (opt.multi) return [...chosen].sort().map(i => gens[i].name);
          return gens[sel].name;
        } else if (isCancel(ev)) return null;
      }
    } finally { el.remove(); }
  }

  /* ── 표 보여주기 ────────────────────────────────────────────────── */
  async function table(title, head, rows, opt) {
    opt = opt || {};
    const el = document.createElement('div');
    el.className = 'panel';
    el.style.cssText = `left:${opt.x || 24}px;top:${opt.y || 56}px;width:${opt.w || 1000}px;max-height:600px;overflow:hidden`;
    center.appendChild(el);
    let page = 0, sel = 0;
    const per = opt.per || 15;
    const pages = Math.max(1, Math.ceil(rows.length / per));
    const render = () => {
      const view = rows.slice(page * per, page * per + per);
      el.innerHTML = `<div class="hd">${title} <span class="hi">(${page + 1}/${pages})</span></div>
        <table class="grid"><tr>${head.map(h => `<th class="${h[1] || ''}">${h[0]}</th>`).join('')}</tr>
        ${view.map((r, i) => `<tr class="${opt.pick && i === sel ? 'sel' : ''}" data-i="${page * per + i}">` +
          r.map((c, j) => `<td class="${head[j][1] || ''}">${c}</td>`).join('') + '</tr>').join('')}</table>`;
      msg(opt.pick ? cy('↑↓ 선택 / ←→ 페이지 / Enter 열전 / ESC 닫기') : cy('←→ 페이지 넘김 / ESC 닫기'));
    };
    render();
    try {
      while (true) {
        const ev = await nextInput();
        if (ev.t === 'click') {
          const tr = ev.target.closest && ev.target.closest('tr');
          if (opt.pick && tr && el.contains(tr) && tr.dataset.i !== undefined) return +tr.dataset.i;
          if (!el.contains(ev.target)) return null;
          continue;
        }
        const k = ev.k, cnt = Math.min(per, rows.length - page * per);
        if (opt.pick && ['ArrowDown', 'j'].includes(k)) { sel = (sel + 1) % cnt; render(); }
        else if (opt.pick && ['ArrowUp', 'k'].includes(k)) { sel = (sel + cnt - 1) % cnt; render(); }
        else if (['ArrowRight', 'l'].includes(k) || (!opt.pick && ['ArrowDown', ' '].includes(k))) {
          page = (page + 1) % pages; sel = 0; render();
        } else if (['ArrowLeft', 'h'].includes(k) || (!opt.pick && k === 'ArrowUp')) {
          page = (page + pages - 1) % pages; sel = 0; render();
        } else if (k === 'Enter') { if (opt.pick) return page * per + sel; page = (page + 1) % pages; render(); }
        else if (isCancel(ev)) return null;
      }
    } finally { el.remove(); }
  }

  /* ── 이벤트 제목 배너 ───────────────────────────────────────────── */
  async function banner(title) {
    const el = document.createElement('div');
    el.className = 'panel evbanner';
    el.innerHTML = `<div class="t">${title}</div>`;
    center.appendChild(el);
    msg(cy('아무 키나 눌러 주세요'));
    await nextInput();
    el.remove();
  }

  /* ── 열전 ───────────────────────────────────────────────────────── */
  async function bio(name, extra, opts) {
    const s = GENERALS[name] || [0, 0, 0, 0, 0, 0, 0, 0];
    const b = (typeof BIOS !== 'undefined' && BIOS[name]) || ['—', '전하는 기록이 없다.'];
    const el = document.createElement('div');
    el.className = 'panel biopane';
    el.innerHTML = `
      <canvas width="95" height="110"></canvas>
      <div class="bd">
        <div class="nm"><span class="hy">${name}</span> <span class="hi">자(字) ${b[0]}</span></div>
        <div class="st">무력 <b>${s[0]}</b>　지력 <b>${s[1]}</b>　정치 <b>${s[2]}</b>　매력 <b>${s[3]}</b>
          　육지 <b>${s[4]}</b>　수지 <b>${s[5]}</b>　의리 <b>${s[6]}</b></div>
        ${extra ? `<div class="ex hi">${extra}</div>` : ''}
        ${(opts && opts.items && opts.items.length)
          ? `<div class="ex ho">소지 : ${opts.items.map(n => `${n}${TREASURES[n] ? `(${TREASURES[n].kind})` : ''}`).join('　')}</div>` : ''}
        <div class="tx">${b[1]}</div>
        ${(typeof LORE !== 'undefined' && LORE[name])
          ? `<div class="lore"><b>정사에서는</b>\n${LORE[name]}</div>` : ''}
      </div>`;
    center.appendChild(el);
    Portrait.draw(el.querySelector('canvas'), name, {});
    msg(cy('아무 키나 눌러 주세요'));
    await nextInput();
    el.remove();
  }

  /* ── 말풍선 이벤트 (원작의 초상화 + 말풍선) ─────────────────────── */
  async function speech(name, text, title) {
    const el = document.createElement('div');
    el.className = 'panel';
    el.style.cssText = 'left:170px;top:230px;width:872px;min-height:230px;';
    el.innerHTML = `
      <canvas width="95" height="110" style="width:190px;height:220px;position:absolute;left:8px;top:2px"></canvas>
      <div style="position:absolute;left:230px;top:14px" class="hw">${title || name + ' 말하길'}</div>
      <div class="speech" style="left:250px;top:70px;right:20px">${text}</div>`;
    center.appendChild(el);
    Portrait.draw(el.querySelector('canvas'), name, {});
    await anyKey('');
    el.remove();
  }

  async function confirm(prompt) {
    msg(prompt, true);
    const i = await menu([{ label: '예' }, { label: '아니오' }], { x: 900, y: 560, width: 180 });
    return i === 0;
  }

  async function report(lines) {
    for (const l of lines) await anyKey(l);
  }

  return {
    fit, cmdbar, msg, anyKey, market, date, face, cityPane, menu, topCommand, pickNum,
    pickCity, pickGeneral, table, speech, confirm, report, nextInput, isCancel, isOk,
    banner, bio,
    cy, yl, gr, mg, og, rd, $,
  };
})();

/* 지도 렌더 루프 */
const Render = (() => {
  let st = null, t = 0;
  function bind(s) { st = s; loop(); }
  function now() { if (st) GameMap.draw(UI.$('#map'), st); }
  function loop() {
    t++;
    if (st) { st.blink = ((t >> 4) & 1) === 0; now(); }
    requestAnimationFrame(loop);
  }
  return { bind, now };
})();
