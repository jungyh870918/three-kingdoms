/* =========================================================================
 *  진행 흐름 — 타이틀 → 시나리오 → 군주 선택 → 본편
 * ========================================================================= */
(async function main() {

  const $ = UI.$;
  UI.fit();

  /* 폰트가 준비되면 캔버스 글자도 도트로 찍힌다 */
  try { await document.fonts.ready; } catch (e) { /* noop */ }
  /* 준비된 인물 삽화가 있으면 먼저 읽어 둔다 */
  try { await Portrait.preload(); } catch (e) { /* noop */ }

  /* 배경 지도(타이틀용) */
  const dummy = {
    seasonIdx: 0, blink: true, cursorCity: null, marchArrow: null,
    clans: [], cities: {},
  };
  CITIES.forEach(c => { dummy.cities[c.id] = { clan: -1, gens: [] }; });
  GameMap.draw($('#map'), dummy);

  /* 개발용 빠른 시작 :  index.html?dev=1&scen=1&clan=0
     자동 조작 스모크 테스트 :  &keys=5,1,Enter,Enter&kdelay=300 */
  const q = new URLSearchParams(location.search);
  if (q.get('keys')) {
    const seq = q.get('keys').split(',');
    let i = 0;
    const iv = setInterval(() => {
      if (i >= seq.length) return clearInterval(iv);
      const k = seq[i++];
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k === 'Space' ? ' ' : k }));
    }, +(q.get('kdelay') || 260));
  }
  if (q.get('dev') === 'select') {
    $('#title').classList.add('hidden');
    if (await setupScreen(+(q.get('scen') || 0))) await Game.loop();
  } else if (q.get('dev')) {
    $('#title').classList.add('hidden');
    const st = Game.newGame(+(q.get('scen') || 0), +(q.get('clan') || 0));
    /* 이벤트 미리보기 :  &event=samgo  /  &bio=제갈량 */
    if (q.get('event')) {
      Render.bind(st); UI.date(st); UI.market(st.market); UI.cmdbar(-1);
      const ev = Events.STORY.find(e => e.id === q.get('event'));
      if (ev) await ev.run(st);
    }
    /* 사람 사이의 일 미리보기 :  &human=sworn  (all 이면 조건이 맞는 것을 모두) */
    if (q.get('human')) {
      Render.bind(st); UI.date(st); UI.market(st.market); UI.cmdbar(-1);
      Events.bookkeep(st);
      const want = q.get('human');
      const list = HUMAN_EVENTS.filter(e => want === 'all' || e.id === want);
      const lines = [];
      for (const e of list) {
        let ok = true;
        try { ok = e.cond ? e.cond(st) : true; } catch (x) { ok = false; }
        if (!ok) { lines.push(`${e.id} — 조건 불충족`); continue; }
        try { await e.run(st, lines); } catch (x) { lines.push(`${e.id} — 오류 ${x.message}`); }
      }
      if (lines.length) UI.msg(lines.join(' · '));
    }
    if (q.get('diplo')) {
      Render.bind(st); UI.date(st); UI.market(st.market); UI.cmdbar(-1);
      const d = Events.DIPLO.find(e => e.id === q.get('diplo'));
      const list = d ? d.pick(st) : [];
      if (d && list.length) await d.run(st, list[0]);
      else UI.msg(UI.rd('조건에 맞는 세력이 없습니다'));
    }
    if (q.get('bio')) {
      Render.bind(st); UI.cmdbar(-1);
      await UI.bio(q.get('bio'), '열전 미리보기');
    }
    Render.bind(st);
    UI.date(st); UI.market(st.market);
    UI.face(st.clans[st.playerClan].ruler, true);
    UI.cmdbar(-1);
    UI.cityPane(st, Game.clanCities(st.playerClan)[0]);
    UI.msg(`${UI.gr(st.clans[st.playerClan].ruler)}님, ${UI.yl(Game.cname(Game.clanCities(st.playerClan)[0]))}에 명령을(0-9)?`, true);
    await Game.loop();
  }

  while (true) {
    await titleScreen();
    const started = await setupScreen();
    if (!started) continue;
    const r = await Game.loop();
    if (r === 'win' || r === 'lose' || r === 'end') await endScreen(r);
    resetScreens();
  }

  /* ── 타이틀 ─────────────────────────────────────────────────────── */
  async function titleScreen() {
    $('#title').classList.remove('hidden');
    $('#rulersel').classList.add('hidden');
    $('#citypane').classList.add('hidden');
    $('#facepane').classList.add('hidden');
    UI.cmdbar(-1);
    UI.msg('');
    $('#d-year').textContent = '삼국지'; $('#d-season').textContent = 'Ⅲ'; $('#d-month').textContent = 'WEB';
    UI.market({ riceBuy: '－', riceSell: '－', bow: '－', cbow: '－', horse: '－' });
    await UI.nextInput();
    $('#title').classList.add('hidden');
  }

  /* ── 시나리오 · 군주 선택 ───────────────────────────────────────── */
  async function setupScreen(preset) {
    $('#d-year').textContent = ''; $('#d-season').textContent = '초기설정'; $('#d-month').textContent = '';

    /* 시나리오 */
    let si = preset;
    if (si === undefined) {
      const order = SCENARIOS.map((s, i) => i).sort((a, b) => SCENARIOS[a].year - SCENARIOS[b].year);
      const items = order.map((idx, k) => ({ label: `${String(k + 1).padStart(2, ' ')} ${SCENARIOS[idx].year}년  ${SCENARIOS[idx].title}` }));
      items.push({ label: ` ${SCENARIOS.length + 1} 기록 불러오기` });
      UI.msg(UI.cy('시나리오를 고르십시오  (↑↓ 선택 / Enter 결정)'));
      const pick = await UI.menu(items, { title: '시나리오', x: 390, y: 52, width: 500, noCancel: true });
      si = pick === SCENARIOS.length ? SCENARIOS.length : order[pick];
      if (si === SCENARIOS.length) return await loadGame();
      const sc = SCENARIOS[si];
      await UI.speech(sc.clans[0][0], sc.desc, `${sc.year}년 ${sc.title}`);
    }

    /* 군주 선택 */
    const st = Game.newGame(si, 0);
    Render.bind(st);
    UI.date(st); UI.market(st.market);

    const pane = $('#rulersel');
    pane.classList.remove('hidden');
    const PER = 6;
    const clans = st.clans;
    let page = 0, sel = 0;
    const pages = Math.ceil(clans.length / PER);

    const render = () => {
      const view = clans.slice(page * PER, page * PER + PER);
      pane.innerHTML = `<div class="rw">${view.map((cl, k) => {
        const idx = page * PER + k;
        const cs = Game.clanCities(idx);
        const seat = cs.find(id => st.cities[id].gens.includes(cl.ruler)) || cs[0];
        const home = seat ? CITIES[seat - 1].name : '－';
        return `<div class="card ${k === sel ? 'sel' : ''}" data-i="${idx}">
          <canvas width="95" height="110"></canvas>
          <div class="nm">${idx + 1}.${cl.ruler}</div>
          <div class="cw"><i style="background:${cl.color}"></i>${home}</div>
        </div>`;
      }).join('')}</div>
      <div style="text-align:center;margin-top:6px" class="hi">← → 페이지 (${page + 1}/${pages})</div>`;
      pane.querySelectorAll('.card').forEach(card => {
        Portrait.draw(card.querySelector('canvas'), clans[+card.dataset.i].ruler, { ruler: true });
      });
      const cur = clans[page * PER + sel];
      const cs = Game.clanCities(page * PER + sel);
      st.cursorCity = cs.find(id => st.cities[id].gens.includes(cur.ruler)) || cs[0] || null;
      Render.now();
      UI.msg(`게임자 1은 누구를 선택하겠습니까(1-${clans.length})?  ${UI.yl(cur.ruler)}  ` +
        UI.cy(`도시 ${cs.length} / 무장 ${Game.clanGens(page * PER + sel).length}`), true);
    };
    render();

    let chosen = null, buf = '';
    while (chosen === null) {
      const ev = await UI.nextInput();
      if (ev.t === 'click') {
        const card = ev.target.closest && ev.target.closest('.card');
        if (card) {
          const i = +card.dataset.i;
          if (page * PER + sel === i) chosen = i;
          else { page = Math.floor(i / PER); sel = i % PER; render(); }
        }
        continue;
      }
      const k = ev.k;
      if (/^[0-9]$/.test(k)) {
        buf += k;
        const v = +buf;
        if (v >= 1 && v <= clans.length) { page = Math.floor((v - 1) / PER); sel = (v - 1) % PER; render(); }
        if (buf.length >= 2 || v * 10 > clans.length) buf = '';
      } else if (['ArrowRight', 'l'].includes(k)) { page = (page + 1) % pages; sel = 0; render(); }
      else if (['ArrowLeft', 'h'].includes(k)) { page = (page + pages - 1) % pages; sel = 0; render(); }
      else if (['ArrowDown', 'j'].includes(k)) { sel = (sel + 1) % Math.min(PER, clans.length - page * PER); render(); }
      else if (['ArrowUp', 'k'].includes(k)) { const n = Math.min(PER, clans.length - page * PER); sel = (sel + n - 1) % n; render(); }
      else if (['Enter', ' ', 'z'].includes(k)) chosen = page * PER + sel;
      else if (k === 'Escape') { pane.classList.add('hidden'); return false; }
    }

    const cl = clans[chosen];
    const ok = await UI.confirm(`${UI.yl(cl.ruler)}로 천하를 도모하겠습니까?`);
    if (!ok) { pane.classList.add('hidden'); return false; }

    /* 플레이어 지정 */
    Game.newGame(si, chosen);
    const nst = Game.get();
    Render.bind(nst);
    pane.classList.add('hidden');
    st.cursorCity = null;
    UI.date(nst); UI.market(nst.market);
    UI.face(cl.ruler, true);
    await UI.speech(cl.ruler, `${UI.yl(nst.year + '년 ' + SEASONS[nst.seasonIdx])}.\n천하는 지금부터 우리의 것이다!`, `${cl.ruler} 군 출발`);
    return true;
  }

  async function loadGame() {
    const read = i => { try { return localStorage.getItem('sgk3_save' + i); } catch (e) { return null; } };
    const slots = [0, 1, 2].map(i => {
      const raw = read(i);
      if (!raw) return { label: `${i + 1} (비어 있음)`, dis: true };
      try {
        const s = JSON.parse(raw);
        return { label: `${i + 1} ${s.year}년 ${s.month}월  ${s.clans[s.playerClan].ruler}` };
      } catch (e) { return { label: `${i + 1} (손상)`, dis: true }; }
    });
    const i = await UI.menu(slots, { title: '기록 불러오기', x: 440, y: 260, width: 420 });
    if (i === null) return false;
    const s = JSON.parse(read(i));
    Game.set(s);
    Render.bind(s);
    UI.date(s); UI.market(s.market);
    UI.face(s.clans[s.playerClan].ruler, true);
    await UI.anyKey('기록을 불러왔습니다');
    return true;
  }

  async function endScreen(r) {
    const st = Game.get();
    const p = st.clans[st.playerClan];
    $('#title').classList.remove('hidden');
    $('#titlehint').innerHTML = r === 'win'
      ? `${p.ruler} — 천하통일 (${st.year}년)`
      : r === 'lose' ? `${p.ruler} 군 멸망 (${st.year}년)` : '게임을 마쳤습니다';
    await UI.nextInput();
    $('#titlehint').textContent = '아무 키나 눌러 주세요';
    $('#title').classList.add('hidden');
  }

  function resetScreens() {
    $('#citypane').classList.add('hidden');
    $('#rulersel').classList.add('hidden');
    $('#warscreen').classList.remove('on');
    UI.msg('');
  }
})();
