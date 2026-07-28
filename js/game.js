/* =========================================================================
 *  게임 본체 — 상태 · 월 진행 · 10 계열 명령 · AI · 이벤트
 * ========================================================================= */
const Game = (() => {

  /* ── 유틸 ───────────────────────────────────────────────────────── */
  const rnd = n => Math.floor(Math.random() * n);
  const rr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = name => GENERALS[name] || [40, 40, 40, 40, 40, 40, 5, 1];
  const cname = id => `${id}.${CITIES[id - 1].name}`;

  const ADJ = {}, SEAROUTE = {};
  CITIES.forEach(c => { ADJ[c.id] = []; });
  ROUTES.forEach(([a, b, w]) => { ADJ[a].push(b); ADJ[b].push(a); SEAROUTE[a + '-' + b] = w; SEAROUTE[b + '-' + a] = w; });
  const isSea = (a, b) => !!SEAROUTE[a + '-' + b];

  let st = null;
  const get = () => st;

  /* ── 초기화 ─────────────────────────────────────────────────────── */
  function newGame(scenIdx, playerClanIdx) {
    const sc = SCENARIOS[scenIdx];
    st = {
      scen: scenIdx, year: sc.year, month: sc.month, seasonIdx: ((sc.month - 1) / 3) | 0,
      playerClan: playerClanIdx, clans: [], cities: {}, gens: {},
      market: { riceBuy: 100, riceSell: 70, bow: 60, cbow: 90, horse: 50 },
      cursorCity: null, blink: true, marchArrow: null, hist: [],
    };

    /* 도시 */
    CITIES.forEach(d => {
      const k = d.size;
      st.cities[d.id] = {
        id: d.id, clan: -1, gens: [], prisoners: [], governor: null, advisorName: null,
        pop: rr(60000, 130000) * k, gold: rr(700, 2200) * k, rice: rr(25000, 62000) * k,
        troops: rr(4000, 11000) * k, loyal: rr(58, 84), agri: rr(20, 34) + k * 12,
        comm: rr(18, 32) + k * 12, tech: rr(20, 40) + k * 8, flood: rr(35, 60),
        wall: rr(45, 70) + k * 6, train: rr(35, 60),
        bows: rr(2, 8) * 500 * k, cbows: rr(0, 4) * 400 * k, horses: rr(1, 5) * 400 * k,
      };
    });

    /* 세력 */
    sc.clans.forEach(([ruler, cityIds, place], i) => {
      const clan = {
        id: i, ruler, color: CLAN_COLORS[i % CLAN_COLORS.length],
        isPlayer: i === playerClanIdx, alive: true, emperor: false,
        allies: {}, truce: {}, relation: {},
      };
      st.clans.push(clan);
      cityIds.forEach(cid => {
        if (!st.cities[cid]) return;
        st.cities[cid].clan = i;
        st.cities[cid].gens = [];
      });
      (place || []).forEach(([cid, names]) => {
        names.split(' ').filter(Boolean).forEach(nm => {
          if (!GENERALS[nm] || st.gens[nm]) return;
          st.gens[nm] = {
            name: nm, clan: i, city: cid, acted: false,
            loyal: nm === ruler ? 100 : clamp(60 + S(nm)[6] * 3 + rr(-6, 8), 40, 99),
          };
          if (st.cities[cid]) st.cities[cid].gens.push(nm);
        });
      });
      // 군주가 배치 목록에 없으면 첫 도시에 둔다
      if (!st.gens[ruler]) {
        const cid = cityIds[0];
        st.gens[ruler] = { name: ruler, clan: i, city: cid, acted: false, loyal: 100 };
        st.cities[cid].gens.push(ruler);
      }
      cityIds.forEach(cid => {
        const c = st.cities[cid];
        if (c && c.gens.length) assignOfficers(cid);
      });
    });

    /* 재야 무장 */
    Object.keys(GENERALS).forEach(nm => {
      if (st.gens[nm]) return;
      const home = S(nm)[7];
      st.gens[nm] = { name: nm, clan: -1, city: st.cities[home] ? home : 1, acted: false, loyal: 0 };
    });

    st.clans.forEach((a, i) => st.clans.forEach((b, j) => { if (i !== j) a.relation[j] = rr(30, 55); }));
    return st;
  }

  const clanCities = ci => CITIES.map(c => c.id).filter(id => st.cities[id].clan === ci);
  const clanGens = ci => Object.values(st.gens).filter(g => g.clan === ci);
  const freeGensIn = cid => Object.values(st.gens).filter(g => g.clan === -1 && g.city === cid);
  const player = () => st.clans[st.playerClan];

  function assignOfficers(cid) {
    const c = st.cities[cid];
    if (!c.gens.length) { c.governor = null; c.advisorName = null; return; }
    const ruler = c.clan >= 0 ? st.clans[c.clan].ruler : null;
    if (!c.governor || !c.gens.includes(c.governor)) {
      const cand = c.gens.includes(ruler) ? ruler :
        c.gens.slice().sort((a, b) => (S(b)[2] + S(b)[3]) - (S(a)[2] + S(a)[3]))[0];
      c.governor = cand;
    }
    const rest = c.gens.filter(n => n !== c.governor);
    c.advisorName = rest.length ? rest.slice().sort((a, b) => S(b)[1] - S(a)[1])[0] : null;
  }

  function moveGen(name, toCity, toClan) {
    const g = st.gens[name];
    if (g.clan >= 0 && st.cities[g.city]) {
      const arr = st.cities[g.city].gens;
      const i = arr.indexOf(name); if (i >= 0) arr.splice(i, 1);
      assignOfficers(g.city);
    }
    g.city = toCity;
    if (toClan !== undefined) g.clan = toClan;
    if (g.clan >= 0) { st.cities[toCity].gens.push(name); assignOfficers(toCity); }
  }

  /* ── 렌더 갱신 ──────────────────────────────────────────────────── */
  function refresh(cid) {
    UI.date(st); UI.market(st.market);
    if (cid) UI.cityPane(st, cid);
    Render.now();
  }

  /* ═════════════════════════════════════════════════════════════════
   *  플레이어 턴
   * ════════════════════════════════════════════════════════════════ */
  async function playerPhase() {
    const p = player();
    for (const cid of clanCities(st.playerClan)) {
      const c = st.cities[cid];
      st.cursorCity = cid;
      UI.cityPane(st, cid); UI.cmdbar(-1); Render.now();
      let end = false;
      while (!end) {
        const avail = c.gens.filter(n => !st.gens[n].acted);
        UI.face(c.governor, c.governor === p.ruler);
        const prompt = `${UI.gr(p.ruler)}님, ${UI.yl(cname(cid))}에 명령을(0-9)?`;
        const cmd = await UI.topCommand(prompt, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        if (cmd === null) continue;
        if (typeof cmd === 'object') {          // 지도 클릭 → 정보만 표시
          UI.cityPane(st, cmd.city);
          await UI.anyKey(`${UI.yl(cname(cmd.city))}의 상황입니다`);
          UI.cityPane(st, cid);
          continue;
        }
        if (cmd === 0) { await cmdRest(cid); end = true; break; }
        if (cmd !== 4 && cmd !== 9 && !avail.length) {
          await UI.anyKey(UI.rd('이 도시에 명령을 수행할 무장이 없습니다'));
          continue;
        }
        const handler = [null, cmdMilitary, cmdPersonnel, cmdDiplomacy, cmdInfo,
          cmdDevelop, cmdScheme, cmdMerchant, cmdSpecial, cmdSystem][cmd];
        const r = await handler(cid);
        UI.cmdbar(-1);
        refresh(cid);
        if (r === 'endcity') end = true;
        if (r === 'quit') return 'quit';
        if (st.cities[cid].clan !== st.playerClan) end = true;
      }
      UI.cityPane(st, null);
    }
    st.cursorCity = null;
    return null;
  }

  async function cmdRest(cid) {
    const c = st.cities[cid];
    c.gens.forEach(n => { st.gens[n].acted = true; });
    c.loyal = clamp(c.loyal + 1, 0, 100);
    UI.msg(`${UI.yl(cname(cid))}은 이번 달을 조용히 보냈습니다`);
    await sleep(260);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* 행동할 무장 고르기 */
  async function chooseActor(cid, prompt, sortKey) {
    const c = st.cities[cid];
    let list = c.gens.filter(n => !st.gens[n].acted);
    if (!list.length) { await UI.anyKey(UI.rd('행동할 수 있는 무장이 없습니다')); return null; }
    if (sortKey !== undefined) list = list.slice().sort((a, b) => S(b)[sortKey] - S(a)[sortKey]);
    const rows = list.map(n => ({ name: n, loyal: st.gens[n].loyal, acted: false }));
    return await UI.pickGeneral(st, prompt, rows);
  }

  /* ── 1. 군사 ────────────────────────────────────────────────────── */
  async function cmdMilitary(cid) {
    const c = st.cities[cid];
    const i = await UI.menu([
      { label: '1 징병' }, { label: '2 훈련' }, { label: '3 출병' }, { label: '4 수송' },
    ], { title: '군사', x: 40, y: 60 });
    if (i === null) return;
    if (i === 0) {
      const max = Math.min(Math.floor(c.pop * 0.06) - 0, c.gold * 40, Math.max(0, 100000 - c.troops));
      if (max < 100) { await UI.anyKey(UI.rd('징병할 여력이 없습니다')); return; }
      const n = await UI.pickNum(`${cname(cid)} 징병 인원`, 100, Math.floor(max / 100) * 100, 1000);
      if (!n) return;
      const actor = await chooseActor(cid, '누가 징병하겠습니까?', 3);
      if (!actor) return;
      const eff = 0.7 + S(actor)[3] / 200 + c.loyal / 400;
      const got = Math.floor(n * clamp(eff, 0.5, 1.25));
      c.troops += got; c.pop -= n; c.gold -= Math.ceil(n / 40);
      c.loyal = clamp(c.loyal - Math.ceil(n / 2500), 0, 100);
      c.train = Math.floor(c.train * (c.troops - got) / Math.max(1, c.troops));
      st.gens[actor].acted = true;
      await UI.anyKey(`${UI.gr(actor)}가 병사 ${UI.yl(got)}명을 모았습니다`);
    } else if (i === 1) {
      const actor = await chooseActor(cid, '누가 훈련하겠습니까?', 4);
      if (!actor) return;
      const up = Math.floor(4 + S(actor)[4] / 9 + rr(0, 4));
      c.train = clamp(c.train + up, 0, 100);
      c.rice -= Math.floor(c.troops / 40);
      st.gens[actor].acted = true;
      await UI.anyKey(`${UI.gr(actor)}가 병사를 훈련했습니다. 훈련도 ${UI.yl(c.train)}`);
    } else if (i === 2) {
      await doMarch(cid);
    } else {
      await doTransport(cid);
    }
  }

  async function doMarch(cid) {
    const c = st.cities[cid];
    const targets = ADJ[cid].filter(t => st.cities[t].clan !== st.playerClan);
    if (!targets.length) { await UI.anyKey(UI.rd('인접한 적 도시가 없습니다')); return; }
    const tgt = await UI.pickCity(st, '어느 도시를 공격합니까?', id => targets.includes(id), targets[0]);
    if (!tgt) return;
    const dcl = st.cities[tgt].clan;
    if (dcl >= 0 && player().allies[dcl]) {
      if (!await UI.confirm(UI.rd(`${st.clans[dcl].ruler}와는 동맹 중입니다. 파기하겠습니까?`))) return;
      delete player().allies[dcl]; delete st.clans[dcl].allies[st.playerClan];
      st.clans[dcl].relation[st.playerClan] = 0;
    }
    const avail = c.gens.filter(n => !st.gens[n].acted);
    const rows = avail.map(n => ({ name: n, loyal: st.gens[n].loyal }));
    const chosen = await UI.pickGeneral(st, `출진할 무장을 고르시오 (최대 5)`, rows, { multi: true });
    if (!chosen || !chosen.length) return;
    const units = chosen.slice(0, 5);
    const maxT = Math.min(c.troops - 500, units.length * 30000);
    if (maxT < units.length * 500) { await UI.anyKey(UI.rd('병사가 부족합니다')); return; }
    const n = await UI.pickNum('출진 병력', units.length * 500, maxT, Math.min(maxT, units.length * 8000));
    if (!n) return;

    st.marchArrow = [cid, tgt];
    Render.now();
    await UI.anyKey(`${UI.yl(cname(cid))} 군이 ${UI.yl(cname(tgt))}로 진군합니다`);
    st.marchArrow = null;

    const per = Math.floor(n / units.length);
    const atkUnits = units.map((nm, k) => ({
      name: nm, troops: per, weapon: pickWeapon(c, k), train: c.train,
    }));
    units.forEach(nm => { st.gens[nm].acted = true; });
    c.troops -= n;
    await resolveWar(st.playerClan, cid, tgt, atkUnits, 'A');
  }

  function pickWeapon(c, k) {
    const pool = [];
    if (c.horses > 1500) pool.push('기마');
    if (c.cbows > 1500) pool.push('강노');
    if (c.bows > 1500) pool.push('노궁');
    pool.push('보병', '보병');
    return pool[k % pool.length];
  }

  /* 전투 실행 + 결과 반영 */
  async function resolveWar(atkClan, fromCity, toCity, atkUnits, playerSide) {
    const d = st.cities[toCity];
    const defClan = d.clan;
    const dgens = d.gens.slice(0, 5);
    const defUnits = dgens.length
      ? dgens.map((nm, k) => ({
          name: nm, troops: Math.max(300, Math.floor(d.troops / dgens.length)),
          weapon: pickWeapon(d, k), train: d.train,
        }))
      : [];

    if (!defUnits.length && d.troops < 1500) {     // 무혈입성
      await UI.anyKey(`${UI.yl(cname(toCity))}은 비어 있었습니다. 무혈입성!`);
      captureCity(atkClan, toCity, atkUnits.reduce((s, u) => s + u.troops, 0), atkUnits.map(u => u.name), []);
      return { winner: 'A' };
    }
    if (!defUnits.length) {
      defUnits.push({ name: null, troops: d.troops, weapon: '보병', train: d.train, faceless: true });
    }

    const res = await Battle.run(st, {
      atkClan, defClan, fromCity, toCity, atkUnits, defUnits,
      playerSide: playerSide || (defClan === st.playerClan ? 'D' : null),
    });

    /* 사상자 반영 */
    const survA = res.survivors.A, survD = res.survivors.D;
    d.troops = survD.reduce((s, u) => s + u.troops, 0);
    d.train = clamp(d.train - 6, 0, 100);
    const backTroops = survA.reduce((s, u) => s + u.troops, 0);

    if (res.winner === 'A') {
      const dead = res.dead.D, cap = res.captured;
      captureCity(atkClan, toCity, backTroops, survA.map(u => u.name), cap, dead);
      const lines = [`${UI.yl(cname(toCity))} 함락! ${UI.gr(st.clans[atkClan].ruler)} 군이 성을 차지했습니다`];
      if (cap.length) lines.push(`${UI.og(cap.join('  '))} 를 포로로 잡았습니다`);
      if (dead.length) lines.push(`${UI.rd(dead.join('  '))} 가 전사했습니다`);
      await UI.report(lines);
    } else {
      // 공격 실패 → 생존군 귀환
      const f = st.cities[fromCity];
      if (f.clan === atkClan) f.troops += backTroops;
      res.dead.A.forEach(nm => killGen(nm));
      res.captured.forEach(nm => { if (st.gens[nm]) { st.gens[nm].clan = -3; st.gens[nm].city = toCity; d.prisoners.push(nm); } });
      const lines = [`${UI.rd(cname(toCity) + ' 공략 실패')}. 군은 물러났습니다`];
      if (res.dead.A.length) lines.push(`${UI.rd(res.dead.A.join('  '))} 가 전사했습니다`);
      await UI.report(lines);
    }
    st.cities[fromCity] && assignOfficers(fromCity);
    assignOfficers(toCity);
    checkClanDeath();
    refresh(st.cursorCity);
    return res;
  }

  function killGen(nm) {
    const g = st.gens[nm]; if (!g) return;
    CITIES.forEach(d => {
      const arr = st.cities[d.id].prisoners, i = arr.indexOf(nm);
      if (i >= 0) arr.splice(i, 1);
    });
    if (g.clan >= 0 && st.cities[g.city]) {
      const arr = st.cities[g.city].gens, i = arr.indexOf(nm);
      if (i >= 0) arr.splice(i, 1);
    }
    delete st.gens[nm];
  }

  function captureCity(newClan, cid, troops, atkGenNames, captured, dead) {
    const c = st.cities[cid];
    const oldClan = c.clan;
    (dead || []).forEach(nm => killGen(nm));
    /* 남은 수비 무장 처리 : 포로 or 도주 */
    c.gens.slice().forEach(nm => {
      if (!st.gens[nm]) return;
      if ((captured || []).includes(nm)) {
        st.gens[nm].clan = -3; st.gens[nm].city = cid;
        const i = c.gens.indexOf(nm); c.gens.splice(i, 1);
        c.prisoners.push(nm);
      } else {
        const refuge = clanCities(oldClan).filter(x => x !== cid);
        const i = c.gens.indexOf(nm); c.gens.splice(i, 1);
        if (refuge.length) { st.gens[nm].city = refuge[0]; st.cities[refuge[0]].gens.push(nm); assignOfficers(refuge[0]); }
        else { st.gens[nm].clan = -1; st.gens[nm].loyal = 0; }   // 세력 멸망 → 재야
      }
    });
    c.clan = newClan;
    c.gens = [];
    c.troops = Math.floor(troops * 0.9);
    c.loyal = clamp(c.loyal - 18, 0, 100);
    c.gold = Math.floor(c.gold * 0.5);
    c.rice = Math.floor(c.rice * 0.6);
    c.train = 45;
    (atkGenNames || []).forEach(nm => { if (st.gens[nm] && nm) moveGen(nm, cid, newClan); });
    c.governor = null; assignOfficers(cid);
  }

  function checkClanDeath() {
    st.clans.forEach((cl, i) => {
      if (!cl.alive) return;
      if (clanCities(i).length === 0) {
        cl.alive = false;
        clanGens(i).forEach(g => { g.clan = -1; g.loyal = 0; });
      }
    });
  }

  async function doTransport(cid) {
    const c = st.cities[cid];
    const dst = ADJ[cid].filter(t => st.cities[t].clan === st.playerClan);
    if (!dst.length) { await UI.anyKey(UI.rd('인접한 자기 도시가 없습니다')); return; }
    const to = await UI.pickCity(st, '어디로 수송합니까?', id => dst.includes(id), dst[0]);
    if (to === null) return;
    const k = await UI.menu([{ label: '1 금' }, { label: '2 군량' }, { label: '3 병사' }], { title: '수송', x: 40, y: 60 });
    if (k === null) return;
    const key = ['gold', 'rice', 'troops'][k], nm = ['금', '군량', '병사'][k];
    const max = key === 'troops' ? c.troops - 500 : c[key];
    if (max <= 0) { await UI.anyKey(UI.rd('수송할 것이 없습니다')); return; }
    const n = await UI.pickNum(`${nm} 수송량`, 1, max, Math.floor(max / 2));
    if (!n) return;
    const actor = await chooseActor(cid, '누가 수송하겠습니까?', 4);
    if (!actor) return;
    c[key] -= n; st.cities[to][key] += n;
    st.gens[actor].acted = true;
    await UI.anyKey(`${UI.gr(actor)}가 ${nm} ${UI.yl(n)}을 ${UI.yl(cname(to))}로 옮겼습니다`);
  }

  /* ── 2. 인사 ────────────────────────────────────────────────────── */
  async function cmdPersonnel(cid) {
    const c = st.cities[cid];
    const i = await UI.menu([
      { label: '1 탐색' }, { label: '2 등용' }, { label: '3 이동' },
      { label: '4 태수임명' }, { label: '5 포상' }, { label: '6 추방' },
    ], { title: '인사', x: 40, y: 60 });
    if (i === null) return;

    if (i === 0) {                                       // 탐색
      const actor = await chooseActor(cid, '누가 인재를 찾겠습니까?', 3);
      if (!actor) return;
      st.gens[actor].acted = true;
      c.gold -= 50;
      const pool = freeGensIn(cid).filter(g => !g.found);
      const chance = 0.28 + S(actor)[1] / 400 + S(actor)[3] / 400;
      if (pool.length && Math.random() < chance) {
        const f = pool[rnd(pool.length)];
        f.found = true;
        await UI.speech(f.name, `${UI.mg(f.name)}(이)라는 인물을 찾았습니다.\n등용해 보시겠습니까?`, `${actor} 보고`);
      } else {
        await UI.anyKey(`${UI.gr(actor)}는 아무도 찾지 못했습니다`);
      }
    } else if (i === 1) {                                 // 등용
      const cand = [
        ...freeGensIn(cid).filter(g => g.found).map(g => ({ name: g.name, tag: '재야' })),
        ...c.prisoners.filter(n => st.gens[n]).map(n => ({ name: n, tag: '포로' })),
      ];
      if (!cand.length) { await UI.anyKey(UI.rd('등용할 인물이 없습니다. 먼저 탐색하시오')); return; }
      const who = await UI.pickGeneral(st, '누구를 등용합니까?', cand);
      if (!who) return;
      const actor = await chooseActor(cid, '누가 설득하겠습니까?', 3);
      if (!actor) return;
      st.gens[actor].acted = true;
      const tg = st.gens[who], isPri = tg.clan === -3;
      const p = player();
      let ch = 0.18 + S(actor)[3] / 300 + S(p.ruler)[3] / 260 + clanCities(st.playerClan).length / 90
        - S(who)[6] / 34 + (isPri ? 0.06 : 0);
      if (S(who)[0] > 90 || S(who)[1] > 90) ch -= 0.12;
      if (Math.random() < clamp(ch, 0.05, 0.9)) {
        if (isPri) { const i2 = c.prisoners.indexOf(who); c.prisoners.splice(i2, 1); }
        tg.clan = st.playerClan; tg.city = cid; tg.acted = true; tg.found = false;
        tg.loyal = clamp(55 + S(who)[6] * 2 + rr(0, 10), 40, 90);
        c.gens.push(who); assignOfficers(cid);
        await UI.speech(who, `이 한 몸 ${UI.gr(p.ruler)}님께 바치겠습니다`, `${who} 등용`);
      } else {
        await UI.speech(who, isPri ? '차라리 죽여 주시오' : '아직 때가 아닌 것 같습니다', `${who} 말하길`);
      }
    } else if (i === 2) {                                 // 이동
      const actor = await chooseActor(cid, '누가 이동합니까?');
      if (!actor) return;
      const dst = ADJ[cid].filter(t => st.cities[t].clan === st.playerClan);
      if (!dst.length) { await UI.anyKey(UI.rd('이동할 도시가 없습니다')); return; }
      const to = await UI.pickCity(st, '어디로 이동합니까?', id => dst.includes(id), dst[0]);
      if (to === null) return;
      if (c.gens.length <= 1) { await UI.anyKey(UI.rd('도시를 비울 수는 없습니다')); return; }
      st.gens[actor].acted = true;
      moveGen(actor, to);
      await UI.anyKey(`${UI.gr(actor)}가 ${UI.yl(cname(to))}로 떠났습니다`);
    } else if (i === 3) {                                 // 태수임명
      if (c.gens.length < 2) { await UI.anyKey(UI.rd('무장이 부족합니다')); return; }
      const who = await UI.pickGeneral(st, '누구를 태수로 삼습니까?',
        c.gens.map(n => ({ name: n, loyal: st.gens[n].loyal, tag: n === c.governor ? '현 태수' : '' })));
      if (!who) return;
      c.governor = who; assignOfficers(cid);
      await UI.anyKey(`${UI.gr(who)}를 ${UI.yl(cname(cid))} 태수로 임명했습니다`);
    } else if (i === 4) {                                 // 포상
      const who = await UI.pickGeneral(st, '누구에게 포상합니까?',
        c.gens.map(n => ({ name: n, loyal: st.gens[n].loyal })));
      if (!who) return;
      const max = Math.min(c.gold, 2000);
      if (max < 50) { await UI.anyKey(UI.rd('금이 부족합니다')); return; }
      const n = await UI.pickNum('하사할 금', 50, max, Math.min(300, max));
      if (!n) return;
      c.gold -= n;
      const up = Math.floor(n / 60) + rr(0, 3);
      st.gens[who].loyal = clamp(st.gens[who].loyal + up, 0, 100);
      await UI.anyKey(`${UI.gr(who)}의 충성이 ${UI.yl(st.gens[who].loyal)}이 되었습니다`);
    } else {                                              // 추방
      const who = await UI.pickGeneral(st, '누구를 추방합니까?',
        c.gens.filter(n => n !== player().ruler).map(n => ({ name: n, loyal: st.gens[n].loyal })));
      if (!who) return;
      if (!await UI.confirm(`${who}를 정말 추방합니까?`)) return;
      const g = st.gens[who];
      const arr = c.gens; arr.splice(arr.indexOf(who), 1);
      g.clan = -1; g.loyal = 0; g.found = false; assignOfficers(cid);
      await UI.anyKey(`${UI.gr(who)}는 어디론가 사라졌습니다`);
    }
  }

  /* ── 3. 외교 ────────────────────────────────────────────────────── */
  async function cmdDiplomacy(cid) {
    const p = player();
    const others = st.clans.filter(cl => cl.alive && cl.id !== st.playerClan);
    if (!others.length) { await UI.anyKey(UI.rd('상대할 세력이 없습니다')); return; }
    const i = await UI.menu([{ label: '1 동맹' }, { label: '2 정전' }, { label: '3 동맹파기' }],
      { title: '외교', x: 40, y: 60 });
    if (i === null) return;
    if (i === 2) {
      const tgt = await UI.pickGeneral(st, '어느 세력과 파기합니까?',
        Object.keys(p.allies).map(k => ({ name: st.clans[k].ruler, tag: '동맹' })));
      if (!tgt) return;
      const cl = st.clans.find(c => c.ruler === tgt);
      delete p.allies[cl.id]; delete cl.allies[st.playerClan];
      cl.relation[st.playerClan] = 0;
      await UI.anyKey(`${UI.gr(cl.ruler)}와의 동맹을 파기했습니다`);
      return;
    }
    const rows = others.map(cl => ({
      name: cl.ruler,
      tag: `${clanCities(cl.id).length}성 ${p.allies[cl.id] ? '동맹' : (p.truce[cl.id] ? '정전' : '')}`,
    }));
    const tgt = await UI.pickGeneral(st, i === 0 ? '어느 세력에 동맹을 청합니까?' : '어느 세력에 정전을 청합니까?', rows);
    if (!tgt) return;
    const cl = st.clans.find(c => c.ruler === tgt);
    const actor = await chooseActor(cid, '누구를 사자로 보냅니까?', 3);
    if (!actor) return;
    st.gens[actor].acted = true;
    const gift = await UI.pickNum('보낼 예물(금)', 0, st.cities[cid].gold, 300);
    if (gift === null) return;
    st.cities[cid].gold -= gift;
    const rel = cl.relation[st.playerClan] || 30;
    let ch = rel / 160 + S(actor)[3] / 260 + gift / 4000 + (i === 1 ? 0.2 : 0);
    ch -= clanCities(st.playerClan).length / 120;
    cl.relation[st.playerClan] = clamp(rel + Math.floor(gift / 100) + 4, 0, 100);
    if (Math.random() < clamp(ch, 0.05, 0.92)) {
      if (i === 0) { p.allies[cl.id] = 1; cl.allies[st.playerClan] = 1; }
      p.truce[cl.id] = 12; cl.truce[st.playerClan] = 12;
      await UI.speech(cl.ruler, i === 0 ? '좋소. 함께 천하를 도모합시다' : '알겠소. 잠시 창을 거두지요', `${cl.ruler} 답하길`);
    } else {
      await UI.speech(cl.ruler, '그 청은 받아들일 수 없소', `${cl.ruler} 답하길`);
    }
  }

  /* ── 4. 정보 ────────────────────────────────────────────────────── */
  async function cmdInfo(cid) {
    const i = await UI.menu([
      { label: '1 도시일람' }, { label: '2 무장일람' }, { label: '3 세력일람' },
      { label: '4 개발상황' }, { label: '5 자기세력 무장' },
    ], { title: '정보', x: 40, y: 60 });
    if (i === null) return;
    if (i === 0) {
      const rows = CITIES.map(d => {
        const c = st.cities[d.id];
        const cl = c.clan >= 0 ? st.clans[c.clan].ruler : '－';
        return [cname(d.id), cl, c.pop, c.gold, c.rice, c.troops, c.gens.length, c.loyal];
      });
      await UI.table('도시 일람', [['도시', 'l'], ['군주', 'l'], ['인구'], ['금'], ['군량'], ['병사'], ['장수'], ['민충']], rows);
    } else if (i === 1) {
      const rows = Object.values(st.gens).filter(g => g.clan >= 0).map(g => {
        const s = S(g.name);
        return [g.name, st.clans[g.clan].ruler, cname(g.city), s[0], s[1], s[2], s[3], s[4], s[5], g.loyal];
      }).sort((a, b) => (b[3] + b[4]) - (a[3] + a[4]));
      await UI.table('무장 일람', [['무장', 'l'], ['소속', 'l'], ['도시', 'l'], ['무력'], ['지력'], ['정치'], ['매력'], ['육지'], ['수지'], ['충성']], rows);
    } else if (i === 2) {
      const rows = st.clans.filter(c => c.alive).map(cl => {
        const cs = clanCities(cl.id);
        const g = clanGens(cl.id);
        return [cl.ruler + (cl.emperor ? '(황제)' : ''), cs.length, g.length,
          cs.reduce((s, x) => s + st.cities[x].troops, 0),
          cs.reduce((s, x) => s + st.cities[x].gold, 0),
          cs.reduce((s, x) => s + st.cities[x].rice, 0),
          cl.id === st.playerClan ? '자기' : (player().allies[cl.id] ? '동맹' : (player().truce[cl.id] ? '정전' : ''))];
      }).sort((a, b) => b[1] - a[1]);
      await UI.table('세력 일람', [['군주', 'l'], ['도시'], ['장수'], ['병사'], ['금'], ['군량'], ['관계', 'l']], rows);
    } else if (i === 3) {
      const rows = clanCities(st.playerClan).map(id => {
        const c = st.cities[id];
        return [cname(id), c.agri, c.comm, c.tech, c.flood, c.wall, c.train, c.bows, c.cbows, c.horses];
      });
      await UI.table('개발 상황', [['도시', 'l'], ['농업'], ['상업'], ['기술'], ['치수'], ['성벽'], ['훈련'], ['노궁'], ['강노'], ['군마']], rows);
    } else {
      const rows = clanGens(st.playerClan).map(g => {
        const s = S(g.name);
        return [g.name, cname(g.city), s[0], s[1], s[2], s[3], s[4], s[5], g.loyal, g.acted ? '완료' : ''];
      });
      await UI.table(`${player().ruler} 군 무장`, [['무장', 'l'], ['도시', 'l'], ['무력'], ['지력'], ['정치'], ['매력'], ['육지'], ['수지'], ['충성'], ['상태', 'l']], rows);
    }
  }

  /* ── 5. 개발 ────────────────────────────────────────────────────── */
  async function cmdDevelop(cid) {
    const c = st.cities[cid];
    const opts = [
      ['개간', 'agri', 300], ['치수', 'flood', 300], ['상업', 'comm', 300],
      ['기술', 'tech', 400], ['축성', 'wall', 500], ['순찰', 'loyal', 150],
    ];
    const i = await UI.menu(opts.map((o, k) => ({ label: `${k + 1} ${o[0]}  ${UI.cy(c[o[1]])}` })),
      { title: '개발', x: 40, y: 60, width: 300 });
    if (i === null) return;
    const [nm, key, cost] = opts[i];
    if (c.gold < cost) { await UI.anyKey(UI.rd(`금이 부족합니다 (${cost} 필요)`)); return; }
    const actor = await chooseActor(cid, `누가 ${nm}합니까?`, key === 'loyal' ? 3 : 2);
    if (!actor) return;
    st.gens[actor].acted = true;
    c.gold -= cost;
    const stat = key === 'loyal' ? S(actor)[3] : (key === 'tech' ? S(actor)[1] : S(actor)[2]);
    const up = Math.max(1, Math.floor(stat / 14) + rr(-1, 3));
    const before = c[key];
    c[key] = clamp(c[key] + up, 0, 100);
    if (key === 'agri' || key === 'comm') c.pop += rr(200, 900);
    await UI.anyKey(`${UI.gr(actor)}의 ${nm}으로 ${nm === '순찰' ? '민충' : nm}이 ${UI.yl(before)} → ${UI.yl(c[key])}`);
  }

  /* ── 6. 계략 ────────────────────────────────────────────────────── */
  async function cmdScheme(cid) {
    const c = st.cities[cid];
    const foes = ADJ[cid].filter(t => st.cities[t].clan >= 0 && st.cities[t].clan !== st.playerClan);
    if (!foes.length) { await UI.anyKey(UI.rd('인접한 적 도시가 없습니다')); return; }
    const i = await UI.menu([
      { label: '1 유언비어' }, { label: '2 매수' }, { label: '3 화계' }, { label: '4 선동' },
    ], { title: '계략', x: 40, y: 60 });
    if (i === null) return;
    const tgt = await UI.pickCity(st, '어느 도시에 계략을 씁니까?', id => foes.includes(id), foes[0]);
    if (tgt === null) return;
    const t = st.cities[tgt];
    const cost = [300, 800, 500, 600][i];
    if (c.gold < cost) { await UI.anyKey(UI.rd(`금이 부족합니다 (${cost} 필요)`)); return; }
    const actor = await chooseActor(cid, '누가 계략을 씁니까?', 1);
    if (!actor) return;
    st.gens[actor].acted = true;
    c.gold -= cost;
    const oppInt = t.advisorName ? S(t.advisorName)[1] : 50;
    const ch = clamp(0.2 + (S(actor)[1] - oppInt) / 130, 0.05, 0.9);
    if (Math.random() > ch) { await UI.anyKey(`계략이 간파되었습니다`); return; }
    if (i === 0) {
      const d = rr(8, 20); t.loyal = clamp(t.loyal - d, 0, 100);
      await UI.anyKey(`${UI.yl(cname(tgt))}에 유언비어가 퍼져 민충이 ${UI.rd('-' + d)} 되었습니다`);
    } else if (i === 1) {
      const cand = t.gens.filter(n => n !== st.clans[t.clan].ruler);
      if (!cand.length) { await UI.anyKey('매수할 무장이 없었습니다'); return; }
      const who = cand.sort((a, b) => st.gens[a].loyal - st.gens[b].loyal)[0];
      const d = rr(10, 25);
      st.gens[who].loyal = clamp(st.gens[who].loyal - d, 0, 100);
      await UI.anyKey(`${UI.gr(who)}의 충성이 흔들립니다 (${UI.rd(st.gens[who].loyal)})`);
    } else if (i === 2) {
      const d = Math.floor(t.rice * (0.1 + Math.random() * 0.25));
      t.rice -= d;
      await UI.anyKey(`${UI.yl(cname(tgt))}의 창고가 불타 군량 ${UI.rd(d)}을 잃었습니다`);
    } else {
      const d = Math.floor(t.troops * (0.05 + Math.random() * 0.12));
      t.troops -= d; t.train = clamp(t.train - 8, 0, 100);
      await UI.anyKey(`${UI.yl(cname(tgt))}의 병사 ${UI.rd(d)}명이 이탈했습니다`);
    }
  }

  /* ── 7. 상인 ────────────────────────────────────────────────────── */
  async function cmdMerchant(cid) {
    const c = st.cities[cid], m = st.market;
    const i = await UI.menu([
      { label: `1 쌀 구입   ${UI.cy(m.riceBuy)}금/100석` },
      { label: `2 쌀 매도   ${UI.cy(m.riceSell)}금/100석` },
      { label: `3 노궁 구입 ${UI.cy(m.bow)}금/개` },
      { label: `4 강노 구입 ${UI.cy(m.cbow)}금/개` },
      { label: `5 군마 구입 ${UI.cy(m.horse)}금/필` },
    ], { title: '상인', x: 40, y: 60, width: 420 });
    if (i === null) return;
    const actor = await chooseActor(cid, '누가 거래합니까?', 2);
    if (!actor) return;
    const bonus = 1 - S(actor)[2] / 500;
    if (i === 0) {
      const max = Math.floor(c.gold / (m.riceBuy * bonus)) * 100;
      if (max < 100) { await UI.anyKey(UI.rd('금이 부족합니다')); return; }
      const n = await UI.pickNum('구입할 쌀(석)', 100, max, Math.min(max, 10000));
      if (!n) return;
      const cost = Math.floor(n / 100 * m.riceBuy * bonus);
      c.gold -= cost; c.rice += n; st.gens[actor].acted = true;
      await UI.anyKey(`쌀 ${UI.yl(n)}석을 금 ${UI.yl(cost)}에 사들였습니다`);
    } else if (i === 1) {
      if (c.rice < 100) { await UI.anyKey(UI.rd('군량이 부족합니다')); return; }
      const n = await UI.pickNum('매도할 쌀(석)', 100, Math.floor(c.rice / 100) * 100, Math.min(c.rice, 10000));
      if (!n) return;
      const gain = Math.floor(n / 100 * m.riceSell * (2 - bonus));
      c.rice -= n; c.gold += gain; st.gens[actor].acted = true;
      await UI.anyKey(`쌀 ${UI.yl(n)}석을 금 ${UI.yl(gain)}에 팔았습니다`);
    } else {
      const [key, nm, price] = [['bows', '노궁', m.bow], ['cbows', '강노', m.cbow], ['horses', '군마', m.horse]][i - 2];
      const unit = price / 100;
      const max = Math.floor(c.gold / unit);
      if (max < 10) { await UI.anyKey(UI.rd('금이 부족합니다')); return; }
      const n = await UI.pickNum(`구입할 ${nm}`, 10, max, Math.min(max, 2000));
      if (!n) return;
      const cost = Math.floor(n * unit);
      c.gold -= cost; c[key] += n; st.gens[actor].acted = true;
      await UI.anyKey(`${nm} ${UI.yl(n)}을 금 ${UI.yl(cost)}에 사들였습니다`);
    }
  }

  /* ── 8. 특별 ────────────────────────────────────────────────────── */
  async function cmdSpecial(cid) {
    const p = player();
    const cities = clanCities(st.playerClan);
    const i = await UI.menu([
      { label: '1 논공행상' }, { label: '2 즉위', dis: cities.length < 20 || p.emperor },
      { label: '3 인재천거' }, { label: '4 항복' },
    ], { title: '특별', x: 40, y: 60 });
    if (i === null) return;
    if (i === 0) {
      const c = st.cities[cid];
      const cost = clanGens(st.playerClan).length * 100;
      if (c.gold < cost) { await UI.anyKey(UI.rd(`금이 부족합니다 (${cost} 필요)`)); return; }
      c.gold -= cost;
      clanGens(st.playerClan).forEach(g => { g.loyal = clamp(g.loyal + rr(3, 9), 0, 100); });
      await UI.anyKey(`논공행상을 베풀어 모든 무장의 충성이 올랐습니다`);
    } else if (i === 1) {
      if (!await UI.confirm(UI.yl('황제로 즉위하겠습니까?'))) return;
      p.emperor = true;
      st.clans.forEach(cl => { if (cl.id !== st.playerClan) cl.relation[st.playerClan] = clamp((cl.relation[st.playerClan] || 30) - 15, 0, 100); });
      await UI.anyKey(`${UI.gr(p.ruler)}는 황제를 칭하고 천하에 조서를 내렸습니다!`);
    } else if (i === 2) {
      const actor = await chooseActor(cid, '누가 인재를 천거합니까?', 3);
      if (!actor) return;
      st.gens[actor].acted = true;
      const near = [cid, ...ADJ[cid]];
      const pool = Object.values(st.gens).filter(g => g.clan === -1 && near.includes(g.city));
      if (pool.length && Math.random() < 0.5 + S(actor)[3] / 400) {
        const f = pool[rnd(pool.length)]; f.found = true; f.city = cid;
        await UI.speech(f.name, `${UI.mg(f.name)}이(가) 인사드립니다`, `${actor}의 천거`);
      } else await UI.anyKey('마땅한 인재가 없었습니다');
    } else {
      const foes = st.clans.filter(c => c.alive && c.id !== st.playerClan);
      const tgt = await UI.pickGeneral(st, '누구에게 항복합니까?', foes.map(f => ({ name: f.ruler, tag: `${clanCities(f.id).length}성` })));
      if (!tgt) return;
      if (!await UI.confirm(UI.rd('정말로 항복하겠습니까? 게임이 끝납니다'))) return;
      const cl = st.clans.find(c => c.ruler === tgt);
      clanCities(st.playerClan).forEach(id => { st.cities[id].clan = cl.id; });
      st.gameOver = 'surrender';
      return 'endcity';
    }
  }

  /* ── 9. 기능 ────────────────────────────────────────────────────── */
  async function cmdSystem(cid) {
    const i = await UI.menu([
      { label: '1 저장' }, { label: '2 불러오기' }, { label: '3 이 도시 턴 종료' },
      { label: '4 타이틀로' },
    ], { title: '기능', x: 40, y: 60 });
    if (i === null) return;
    if (i === 0) {
      const slot = await UI.menu([{ label: '1 슬롯 1' }, { label: '2 슬롯 2' }, { label: '3 슬롯 3' }], { title: '저장', x: 340, y: 60 });
      if (slot === null) return;
      try {
        localStorage.setItem('sgk3_save' + slot, JSON.stringify(st));
        await UI.anyKey(`슬롯 ${slot + 1}에 저장했습니다`);
      } catch (e) {
        await UI.anyKey(UI.rd('저장할 수 없습니다 (브라우저 저장소 사용 불가)'));
      }
    } else if (i === 1) {
      const slot = await UI.menu([{ label: '1 슬롯 1' }, { label: '2 슬롯 2' }, { label: '3 슬롯 3' }], { title: '불러오기', x: 340, y: 60 });
      if (slot === null) return;
      let raw = null;
      try { raw = localStorage.getItem('sgk3_save' + slot); } catch (e) { raw = null; }
      if (!raw) { await UI.anyKey(UI.rd('저장된 기록이 없습니다')); return; }
      st = JSON.parse(raw);
      Render.bind(st); refresh(null);
      await UI.anyKey('기록을 불러왔습니다');
      return 'endcity';
    } else if (i === 2) {
      return 'endcity';
    } else {
      if (await UI.confirm('타이틀 화면으로 돌아갑니까?')) return 'quit';
    }
  }

  /* ═════════════════════════════════════════════════════════════════
   *  AI
   * ════════════════════════════════════════════════════════════════ */
  async function aiPhase() {
    for (const cl of st.clans) {
      if (!cl.alive || cl.isPlayer) continue;
      const cities = clanCities(cl.id);
      /* 내정 */
      cities.forEach(cid => {
        const c = st.cities[cid];
        const acts = Math.max(1, Math.min(3, c.gens.length));
        const wantTroops = Math.min(Math.floor(c.pop * 0.14), 70000);
        for (let k = 0; k < acts; k++) {
          const r = Math.random();
          if (c.loyal < 55 && c.gold > 300) {                     // 순찰
            c.gold -= 200; c.loyal = clamp(c.loyal + rr(4, 10), 0, 100);
          } else if (c.troops < wantTroops * 0.6 && c.gold > 600 && c.rice > c.troops * 3) {
            const n = Math.min(Math.floor(c.pop * 0.05), c.gold * 25, wantTroops - c.troops);
            if (n > 500) { c.troops += n; c.pop -= n; c.gold -= Math.ceil(n / 30); c.train = Math.floor(c.train * 0.8); }
          } else if (r < 0.22 && c.agri < 95 && c.gold > 400) { c.gold -= 300; c.agri = clamp(c.agri + rr(2, 6), 0, 100); }
          else if (r < 0.4 && c.comm < 95 && c.gold > 400) { c.gold -= 300; c.comm = clamp(c.comm + rr(2, 6), 0, 100); }
          else if (r < 0.5 && c.flood < 85 && c.gold > 400) { c.gold -= 300; c.flood = clamp(c.flood + rr(2, 5), 0, 100); }
          else if (r < 0.58 && c.wall < 90 && c.gold > 600) { c.gold -= 500; c.wall = clamp(c.wall + rr(2, 5), 0, 100); }
          else if (r < 0.66 && c.tech < 90 && c.gold > 500) { c.gold -= 400; c.tech = clamp(c.tech + rr(2, 5), 0, 100); }
          else if (r < 0.84 && c.train < 95) { c.train = clamp(c.train + rr(3, 8), 0, 100); c.rice -= Math.floor(c.troops / 40); }
          else if (c.gold > 1500) {                               // 무기 · 군마
            const spend = Math.min(c.gold - 500, 3000);
            c.gold -= spend;
            c.bows += Math.floor(spend * 40 / st.market.bow / 3);
            c.cbows += Math.floor(spend * 40 / st.market.cbow / 3);
            c.horses += Math.floor(spend * 40 / st.market.horse / 3);
          } else if (c.troops < wantTroops && c.gold > 400 && c.rice > c.troops * 2) {
            const n = Math.min(Math.floor(c.pop * 0.03), c.gold * 25, wantTroops - c.troops);
            if (n > 500) { c.troops += n; c.pop -= n; c.gold -= Math.ceil(n / 30); }
          }
        }
        /* 군량 사고 남는 금 굴리기 */
        if (c.rice < c.troops * 6 && c.gold > 2000) {
          const buy = Math.floor((c.gold - 1000) * 0.6 / st.market.riceBuy) * 100;
          if (buy > 0) { c.gold -= Math.floor(buy / 100 * st.market.riceBuy); c.rice += buy; }
        } else if (c.gold > 12000 && c.rice > c.troops * 12) {
          const sell = Math.floor(c.rice * 0.1 / 100) * 100;      // 창고 정리
          c.rice -= sell; c.gold += Math.floor(sell / 100 * st.market.riceSell);
        }
      });
      /* 외교 : 강자에게는 붙는다 */
      if (Math.random() < 0.12) {
        const others = st.clans.filter(c => c.alive && c.id !== cl.id && !cl.allies[c.id]);
        if (others.length) {
          const t = others[rnd(others.length)];
          if (clanCities(t.id).length > cities.length * 1.5 && Math.random() < 0.5) {
            cl.allies[t.id] = 1; t.allies[cl.id] = 1;
          }
        }
      }
      /* 출병 */
      const attacks = [];
      cities.forEach(cid => {
        const c = st.cities[cid];
        if (c.troops < 9000 || !c.gens.length || c.rice < 12000) return;
        ADJ[cid].forEach(t => {
          const d = st.cities[t];
          if (d.clan === cl.id) return;
          if (d.clan >= 0 && (cl.allies[d.clan] || cl.truce[d.clan])) return;
          const mine = c.troops * (1 + c.train / 150) * (1 + bestLead(c) / 200);
          const theirs = d.troops * (1 + d.train / 150) * (1 + bestLead(d) / 200) * (1 + d.wall / 250) + 3000;
          if (mine > theirs * 1.35) attacks.push({ from: cid, to: t, ratio: mine / theirs });
        });
      });
      attacks.sort((a, b) => b.ratio - a.ratio);
      const done = new Set();
      for (const a of attacks.slice(0, 2)) {
        if (done.has(a.from)) continue;
        done.add(a.from);
        await aiAttack(cl, a.from, a.to);
        if (st.gameOver) return;
      }
    }
    /* 무장 행동 초기화 */
    Object.values(st.gens).forEach(g => { g.acted = false; });
  }

  function bestLead(c) { return c.gens.length ? Math.max(...c.gens.map(n => S(n)[4])) : 30; }

  async function aiAttack(cl, from, to) {
    const c = st.cities[from], d = st.cities[to];
    const gens = c.gens.slice().sort((a, b) => S(b)[4] - S(a)[4]).slice(0, 5);
    if (!gens.length) return;
    const send = Math.floor(c.troops * 0.75);
    const per = Math.floor(send / gens.length);
    const atkUnits = gens.map((nm, k) => ({ name: nm, troops: per, weapon: pickWeapon(c, k), train: c.train }));
    c.troops -= send;

    if (d.clan === st.playerClan) {
      st.marchArrow = [from, to]; st.cursorCity = to;
      UI.cityPane(st, to); Render.now();
      await UI.anyKey(`${UI.rd(cl.ruler + ' 군')}이 ${UI.yl(cname(to))}로 공격해 옵니다!`);
      st.marchArrow = null; UI.cityPane(st, null);
      await resolveWar(cl.id, from, to, atkUnits, 'D');
      return;
    }
    /* AI vs AI : 자동 판정 */
    const A = atkUnits.reduce((s, u) => s + u.troops, 0) * (1 + c.train / 150) * (1 + Math.max(...gens.map(n => S(n)[4])) / 130);
    const D = d.troops * (1 + d.train / 150) * (1 + bestLead(d) / 130) * (1 + d.wall / 200) + 2000;
    const win = A * (0.8 + Math.random() * 0.5) > D;
    if (win) {
      const surv = Math.floor(send * (0.35 + Math.random() * 0.35));
      const dead = d.gens.filter(() => Math.random() < 0.12);
      const cap = d.gens.filter(n => !dead.includes(n) && Math.random() < 0.35);
      const wasPlayerNeighbor = false;
      captureCity(cl.id, to, surv, gens, cap, dead);
      cap.forEach(nm => {                       // AI 는 절반쯤 등용
        if (Math.random() < 0.45 && st.gens[nm]) {
          const i2 = st.cities[to].prisoners.indexOf(nm);
          if (i2 >= 0) st.cities[to].prisoners.splice(i2, 1);
          st.gens[nm].clan = cl.id; st.gens[nm].city = to; st.gens[nm].loyal = rr(45, 70);
          st.cities[to].gens.push(nm); assignOfficers(to);
        }
      });
      st.hist.push(`${st.year}년 ${st.month}월 ${cl.ruler} 군이 ${cname(to)}를 점령`);
      if (!wasPlayerNeighbor) { /* 조용히 진행 */ }
    } else {
      c.troops += Math.floor(send * (0.25 + Math.random() * 0.3));
      d.troops = Math.floor(d.troops * (0.5 + Math.random() * 0.3));
    }
    checkClanDeath();
  }

  /* ═════════════════════════════════════════════════════════════════
   *  월말 처리 · 이벤트
   * ════════════════════════════════════════════════════════════════ */
  async function endOfMonth() {
    const lines = [];
    /* 시세 */
    const m = st.market;
    m.riceBuy = clamp(m.riceBuy + rr(-9, 9), 55, 190);
    m.riceSell = clamp(Math.floor(m.riceBuy * (0.62 + Math.random() * 0.16)), 30, 150);
    m.bow = clamp(m.bow + rr(-5, 5), 35, 120);
    m.cbow = clamp(m.cbow + rr(-6, 6), 60, 170);
    m.horse = clamp(m.horse + rr(-5, 5), 30, 130);

    CITIES.forEach(d => {
      const c = st.cities[d.id];
      if (c.clan < 0) return;
      /* 군량 소비 (병사 급식 + 관가 소비) */
      const eat = Math.floor(c.troops / 20) + Math.floor(c.pop / 1500);
      c.rice -= eat;
      if (c.rice < 0) {
        const lost = Math.min(c.troops, Math.floor(-c.rice / 4) + 200);
        c.troops -= lost; c.rice = 0;
        c.loyal = clamp(c.loyal - 6, 0, 100);
        if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))}의 군량이 바닥나 병사 ${UI.rd(lost)}명이 흩어졌습니다`);
      }
      /* 인구 */
      c.pop += Math.floor(c.pop * (c.loyal - 45) / 24000);
      c.pop = Math.max(20000, c.pop);
      /* 민충 자연 회복/하락 */
      c.loyal = clamp(c.loyal + (c.loyal < 50 ? -1 : 0) + (Math.random() < 0.4 ? 1 : 0), 0, 100);
      /* 수입 — 금은 3·9월, 쌀은 4월(보리) · 9월(추수) */
      if (st.month === 3 || st.month === 9) {
        const g = Math.floor(c.pop / 120 * (c.comm / 50) * (0.6 + c.loyal / 200) * (1 + c.tech / 400));
        c.gold += g;
        if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))} 금 수입 ${UI.gr('+' + g)}`);
      }
      if (st.month === 4 || st.month === 9) {
        const base = c.pop / 8 * (c.agri / 55) * (0.8 + c.flood / 400) * (0.5 + c.loyal / 200);
        const r = Math.floor(st.month === 9 ? base : base * 0.4);
        c.rice += r;
        if (c.clan === st.playerClan)
          lines.push(`${UI.yl(cname(d.id))} ${st.month === 9 ? '추수' : '보리 수확'} ${UI.gr('+' + r)}석`);
      }
    });

    /* 재해 */
    if (Math.random() < 0.22) {
      const pool = CITIES.filter(d => st.cities[d.id].clan >= 0);
      const d = pool[rnd(pool.length)], c = st.cities[d.id];
      const kind = rnd(3);
      if (kind === 0 && (st.month >= 6 && st.month <= 8)) {
        const dmg = Math.floor(c.rice * (0.3 - c.flood / 400));
        c.rice -= Math.max(0, dmg); c.loyal = clamp(c.loyal - 8, 0, 100);
        if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))}에 ${UI.rd('수해')}가 나 군량 ${dmg}석을 잃었습니다`);
      } else if (kind === 1) {
        c.pop -= Math.floor(c.pop * 0.04); c.loyal = clamp(c.loyal - 6, 0, 100);
        if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))}에 ${UI.rd('역병')}이 돌았습니다`);
      } else {
        c.rice -= Math.floor(c.rice * 0.12);
        if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))}에 ${UI.rd('가뭄')}이 들었습니다`);
      }
    }

    /* 반란 · 모반 (원작의 "○○이 모반을 일으켰습니다") */
    for (const g of Object.values(st.gens)) {
      if (g.clan < 0) continue;
      const cl = st.clans[g.clan];
      if (g.name === cl.ruler) continue;
      if (g.loyal >= 40 || Math.random() > 0.10) continue;
      const c = st.cities[g.city];
      if (c.governor !== g.name || clanCities(g.clan).length < 2) {
        /* 단순 이탈 */
        const arr = c.gens; arr.splice(arr.indexOf(g.name), 1);
        g.clan = -1; g.loyal = 0; assignOfficers(c.id);
        lines.push(`${UI.gr(g.name)}가 ${UI.yl(cname(c.id))}를 떠났습니다`);
      } else {
        /* 태수 모반 → 독립 */
        const nid = st.clans.length;
        st.clans.push({
          id: nid, ruler: g.name, color: CLAN_COLORS[nid % CLAN_COLORS.length],
          isPlayer: false, alive: true, emperor: false, allies: {}, truce: {}, relation: {},
        });
        st.clans.forEach((x, i) => { if (i !== nid) { x.relation[nid] = rr(20, 40); st.clans[nid].relation[i] = rr(20, 40); } });
        c.clan = nid; g.clan = nid; g.loyal = 100;
        c.gens.filter(n => n !== g.name).forEach(n => {
          if (Math.random() < 0.5) st.gens[n].clan = nid;
          else { const arr = c.gens; arr.splice(arr.indexOf(n), 1); st.gens[n].clan = -1; st.gens[n].loyal = 0; }
        });
        assignOfficers(c.id);
        lines.push(`${UI.yl(cname(c.id))}의 ${UI.gr(g.name)}이 모반을 일으켰습니다`);
        lines.push(`${UI.gr(g.name)}은 독립해서 군주가 되었습니다`);
        checkClanDeath();
      }
    }

    /* 민심 이반으로 인한 도시 반란 */
    for (const d of CITIES) {
      const c = st.cities[d.id];
      if (c.clan < 0 || c.loyal > 22 || Math.random() > 0.3) continue;
      const lost = Math.floor(c.troops * 0.25);
      c.troops -= lost; c.loyal = clamp(c.loyal + 12, 0, 100);
      if (c.clan === st.playerClan) lines.push(`${UI.yl(cname(d.id))}에서 백성이 봉기해 병사 ${UI.rd(lost)}명을 잃었습니다`);
    }

    /* 재야 무장 등장 알림 · 조언 (플레이어 전용) */
    if (Math.random() < 0.18 && clanCities(st.playerClan).length) {
      const p = player();
      const cs = clanCities(st.playerClan);
      const cid = cs[rnd(cs.length)];
      const foes = st.clans.filter(c => c.alive && c.id !== st.playerClan);
      const line = ADVICE_LINES[rnd(ADVICE_LINES.length)]
        .replace('{L}', p.ruler).replace('{C}', CITIES[cid - 1].name)
        .replace('{E}', foes.length ? foes[rnd(foes.length)].ruler : '적');
      const sage = ['사마휘', '좌자', '관로'].find(n => st.gens[n]) || '사마휘';
      await UI.speech(sage, line, `${sage} 말하길`);
    }

    /* 결과 보고 */
    if (lines.length) { UI.cityPane(st, null); await UI.report(lines.slice(0, 14)); }

    /* 날짜 진행 */
    st.month++;
    if (st.month > 12) { st.month = 1; st.year++; }
    st.seasonIdx = ((st.month - 1) / 3) | 0;
    Object.values(st.clans).forEach(cl => {
      Object.keys(cl.truce).forEach(k => { cl.truce[k]--; if (cl.truce[k] <= 0) delete cl.truce[k]; });
    });
    Object.values(st.gens).forEach(g => { g.acted = false; });
    refresh(null);
  }

  /* ── 승패 ───────────────────────────────────────────────────────── */
  function checkEnd() {
    const mine = clanCities(st.playerClan).length;
    if (mine === 0) return 'lose';
    if (mine === CITIES.length) return 'win';
    return null;
  }

  /* ── 메인 루프 ──────────────────────────────────────────────────── */
  async function loop() {
    UI.cmdbar(-1);
    while (true) {
      refresh(null);
      const r = await playerPhase();
      if (r === 'quit') return 'quit';
      if (st.gameOver) break;
      UI.msg(UI.cy('각 세력이 움직입니다...'));
      await sleep(180);
      await aiPhase();
      await endOfMonth();
      const e = checkEnd();
      if (e === 'win') {
        await UI.anyKey(UI.yl(`${player().ruler}는 천하를 통일했습니다!  ${st.year}년 ${st.month}월`));
        return 'win';
      }
      if (e === 'lose') {
        await UI.anyKey(UI.rd(`${player().ruler} 군은 멸망했습니다...  ${st.year}년 ${st.month}월`));
        return 'lose';
      }
    }
    await UI.anyKey(UI.rd('게임 종료'));
    return 'end';
  }

  return {
    newGame, loop, get, clanCities, clanGens, ADJ, isSea, S, cname,
    set: s => { st = s; }, refresh,
    aiPhase, endOfMonth, checkEnd,      // 검증용
  };
})();
