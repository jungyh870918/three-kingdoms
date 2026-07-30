/* =========================================================================
 *  이벤트 —  사서 이벤트 체인 · 외교 · 수명(등장/사망) · 임의 사건
 *  Game 에서 매월 Events.monthly(st) 를 부른다.
 * ========================================================================= */
const Events = (() => {

  const rnd = n => Math.floor(Math.random() * n);
  const rr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = n => GENERALS[n] || [40, 40, 40, 40, 40, 40, 5, 1];
  const cname = id => `${id}.${CITIES[id - 1].name}`;
  const now = st => st.year * 12 + st.month;

  /* ── 상태 조회 도우미 ───────────────────────────────────────────── */
  const flag = (st, id) => (st.flags || (st.flags = {}))[id];
  const setFlag = (st, id, v) => { (st.flags || (st.flags = {}))[id] = v === undefined ? now(st) : v; };
  const since = (st, id) => flag(st, id) ? now(st) - flag(st, id) : -1;

  const clanOf = (st, name) => (st.gens[name] ? st.gens[name].clan : -9);
  const isFree = (st, name) => st.gens[name] && st.gens[name].clan === -1;
  const alive = (st, name) => !!st.gens[name];
  const pc = st => st.playerClan;
  const pClan = st => st.clans[st.playerClan];
  const pRuler = st => (pClan(st) || {}).ruler;
  const cities = (st, ci) => CITIES.map(c => c.id).filter(id => st.cities[id].clan === ci);
  const capital = st => {
    const cs = cities(st, pc(st));
    if (!cs.length) return null;
    const home = cs.find(id => st.cities[id].gens.includes(pRuler(st)));
    return home || cs[0];
  };
  const clanByRuler = (st, ruler) => st.clans.find(c => c.alive && c.ruler === ruler);
  const clanGens = (st, ci) => Object.values(st.gens).filter(g => g.clan === ci);
  /* 두 세력이 국경을 맞대고 있는가 */
  const adjacentTo = (st, a, b) =>
    cities(st, a).some(x => Game.ADJ[x].some(y => st.cities[y].clan === b));
  /* 세력이 가진 도시 중 하나 (없으면 null) */
  const anyCityOf = (st, ci) => { const cs = cities(st, ci); return cs.length ? cs[rnd(cs.length)] : null; };
  /* 대사 여러 줄을 잇달아 보여준다 : [[말한이, 내용, 제목], ...] */
  async function scenes(list) {
    for (const [who, text, title] of list) await UI.speech(who, text, title);
  }
  /* 세상 소식 (플레이어 소속이 아니면 한 줄로만) */
  const notify = (lines, text) => { lines.push(text); };
  /* 보물 수여 */
  async function grant(st, name, item, quiet) {
    if (!Game.grant(name, item)) return false;
    const t = TREASURES[item];
    if (!quiet && st.gens[name] && st.gens[name].clan === pc(st)) {
      await UI.speech(name, `${UI.yl(item)}\n${t.txt}\n\n${UI.gr(name)}이(가) 이를 손에 넣었습니다.`, `${item} 획득`);
    }
    return true;
  }
  /* 사서 이벤트 — 연의 계열(story.js) + 정사 계열(annals.js) */
  const storyList = () => (typeof STORY_EVENTS !== 'undefined' ? STORY_EVENTS : [])
    .concat(typeof ANNALS_EVENTS !== 'undefined' ? ANNALS_EVENTS : []);
  /* 사람 사이의 일 — human.js. 읽는 순서에 매이지 않도록 그때그때 찾는다 */
  const randomList = () => RANDOM.concat(typeof HUMAN_EVENTS !== 'undefined' ? HUMAN_EVENTS : []);

  /* 무장을 세력에 합류시킨다 */
  function join(st, name, clanIdx, cityId, loyal) {
    if (!st.gens[name]) {
      st.gens[name] = { name, clan: -1, city: cityId, acted: true, loyal: 0 };
    }
    const g = st.gens[name];
    Game.removeFromCity(name);
    CITIES.forEach(d => {
      const arr = st.cities[d.id].prisoners, i = arr.indexOf(name);
      if (i >= 0) arr.splice(i, 1);
    });
    g.clan = clanIdx; g.city = cityId; g.acted = true;
    g.loyal = loyal === undefined ? 90 : loyal;
    g.found = false;
    st.cities[cityId].gens.push(name);
    Game.assignOfficers(cityId);
  }

  /* 무장을 재야로 돌린다 */
  function leave(st, name) {
    const g = st.gens[name]; if (!g) return;
    Game.removeFromCity(name);
    g.clan = -1; g.loyal = 0; g.found = false;
  }

  /* ─────────────────────────────────────────────────────────────────
   *  기록 — 조건문이 '지금'뿐 아니라 '여태까지'를 물을 수 있게 한다.
   *  매월 monthly() 첫머리에서 갱신한다.
   * ──────────────────────────────────────────────────────────────── */
  function mem(st) {
    return st.mem || (st.mem = {
      held: {},        // 세력별 : 한 번이라도 가졌던 도시
      peak: {},        // 세력별 : 최대 도시 수
      own: {},         // 도시별 : { now, prev, since } 주인이 바뀐 이력
      bond: {},        // 'A|B' : 의형제·친분의 깊이
      tier: {},        // 등급별 : 마지막으로 그 등급 이벤트가 터진 달
      start: null,     // 시나리오가 시작한 달
    });
  }
  function bookkeep(st) {
    const m = mem(st);
    if (m.start === null) m.start = now(st);
    st.clans.forEach(c => {
      if (!c.alive) return;
      const h = m.held[c.id] || (m.held[c.id] = {});
      const cs = cities(st, c.id);
      cs.forEach(id => { h[id] = true; });
      if (cs.length > (m.peak[c.id] || 0)) m.peak[c.id] = cs.length;
    });
    CITIES.forEach(c => {
      const o = st.cities[c.id].clan;
      const r = m.own[c.id] || (m.own[c.id] = { now: o, prev: -9, since: now(st) });
      if (r.now !== o) { r.prev = r.now; r.now = o; r.since = now(st); }
    });
  }

  /* ── 시간 ──────────────────────────────────────────────────────── */
  /* 시나리오가 시작한 뒤 몇 달이 지났는가 — '시작 직후 대사건' 을 막는 자물쇠 */
  const elapsed = st => { const m = mem(st); return m.start === null ? 0 : now(st) - m.start; };
  const startYear = st => (SCENARIOS[st.scen] || { year: st.year }).year;

  /* ── 땅 ────────────────────────────────────────────────────────── */
  const clanAny = (st, ruler) => st.clans.find(c => c.ruler === ruler);   // 망한 세력도 찾는다
  const ownerOf = (st, cityId) => st.cities[cityId].clan;
  const everHeld = (st, ci, cityId) => !!(mem(st).held[ci] && mem(st).held[ci][cityId]);
  const peakOf = (st, ci) => mem(st).peak[ci] || 0;
  /* taker 가 loser 에게서 이 성을 빼앗았는가 — 직전 주인이거나, loser 가 한때 가졌던 땅 */
  const tookFrom = (st, cityId, taker, loser) => {
    if (ownerOf(st, cityId) !== taker) return false;
    const r = mem(st).own[cityId];
    return (r && r.prev === loser) || everHeld(st, loser, cityId);
  };
  const sinceFell = (st, cityId) => { const r = mem(st).own[cityId]; return r ? now(st) - r.since : 999; };

  /* ── 세력의 힘 ─────────────────────────────────────────────────── */
  const troopsOf = (st, ci) => cities(st, ci).reduce((s, id) => s + st.cities[id].troops, 0);
  /* 세력이 무너진 상태인가 — 땅도 병사도 사람도 없다 */
  const broken = (st, ci) => {
    const cs = cities(st, ci);
    if (!cs.length) return true;
    return cs.length <= 1 && troopsOf(st, ci) < 9000 && clanGens(st, ci).length <= 4 &&
      cs.length < peakOf(st, ci);
  };
  /* 한때 컸다가 쪼그라들었는가 */
  const declined = (st, ci, ratio) => {
    const p = peakOf(st, ci); if (p < 2) return false;
    return cities(st, ci).length <= Math.max(1, Math.floor(p * (ratio === undefined ? 0.5 : ratio)));
  };

  /* ── 사람 ──────────────────────────────────────────────────────── */
  const serves = (st, name, ci) => alive(st, name) && st.gens[name].clan === ci && ci >= 0;
  const cityOf = (st, name) => (st.gens[name] ? st.gens[name].city : -1);
  const together = (st, a, b) => alive(st, a) && alive(st, b) &&
    st.gens[a].clan === st.gens[b].clan && st.gens[a].city === st.gens[b].city;
  /* 등장했다가 죽어 없어졌는가 (아직 등장 전인 인물과 구별한다) */
  const gone = (st, name) => !st.gens[name] && !!(LIFE[name] && LIFE[name][0] && LIFE[name][0] <= st.year);
  /* 포로인가 */
  const captive = (st, name) => CITIES.some(c => st.cities[c.id].prisoners.includes(name));

  /* ── 의형제 · 친분 ─────────────────────────────────────────────── */
  const bkey = (a, b) => [a, b].sort().join('|');
  const bondOf = (st, a, b) => mem(st).bond[bkey(a, b)] || 0;
  const addBond = (st, a, b, n) => {
    const m = mem(st), k = bkey(a, b);
    m.bond[k] = clamp((m.bond[k] || 0) + n, 0, 100);
    return m.bond[k];
  };
  const bondsOf = (st, name) => Object.keys(mem(st).bond)
    .filter(k => k.split('|').includes(name) && mem(st).bond[k] > 0)
    .map(k => ({ other: k.split('|').find(x => x !== name), lv: mem(st).bond[k] }));

  /* ─────────────────────────────────────────────────────────────────
   *  수명 — 등장 · 사망 · 군주 승계
   * ──────────────────────────────────────────────────────────────── */
  function deathMonth(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 131 + name.charCodeAt(i)) >>> 0;
    return (h % 12) + 1;
  }

  async function lifecycle(st, lines) {
    /* 등장 : 매년 1월 */
    if (st.month === 1) {
      for (const nm of Object.keys(GENERALS)) {
        const L = LIFE[nm]; if (!L || !L[0]) continue;
        if (L[0] !== st.year || st.gens[nm]) continue;
        if (L[1] && L[1] <= st.year) continue;
        const home = S(nm)[7];
        st.gens[nm] = { name: nm, clan: -1, city: st.cities[home] ? home : 1, acted: true, loyal: 0 };
        const s = S(nm);
        if (s[0] >= 85 || s[1] >= 88 || s[4] >= 88) {
          lines.push(`${UI.cy(CITIES[(st.cities[home] ? home : 1) - 1].name)}에 ` +
            `${UI.gr(nm)}(이)라는 인물이 있다는 소문이 돕니다`);
        }
      }
    }
    /* 사망 */
    for (const nm of Object.keys(st.gens)) {
      const L = LIFE[nm]; if (!L || !L[1]) continue;
      const mod = (st.lifeMod && st.lifeMod[nm]) || 0;
      if (L[1] + mod !== st.year || deathMonth(nm) !== st.month) continue;
      const g = st.gens[nm];
      const mine = g.clan === pc(st);
      const rulerOf = st.clans.find(c => c.alive && c.ruler === nm);
      if (mine || rulerOf) {
        await UI.speech(nm, `${UI.yl(nm)}(이)가 병을 얻어 세상을 떠났습니다.\n향년을 다하니 온 나라가 슬퍼했습니다.`, `${nm} 별세`);
      } else {
        lines.push(`${UI.gr(nm)}(이)가 세상을 떠났습니다`);
      }
      Game.killGen(nm);
      await mourn(st, nm, lines);
      if (rulerOf) await succeed(st, rulerOf.id, nm, lines);
    }
  }

  /* 정을 나눈 이가 죽으면 남은 쪽이 흔들린다 */
  async function mourn(st, dead, lines) {
    const ties = bondsOf(st, dead).filter(t => alive(st, t.other) && st.gens[t.other].clan >= 0);
    for (const t of ties) {
      const g = st.gens[t.other];
      const deep = t.lv >= 60;
      g.loyal = clamp(g.loyal - (deep ? 12 : 5), 0, 100);
      if (deep && g.clan === pc(st)) {
        await UI.speech(t.other,
          `${UI.yl(dead)}…\n그 사람과 술잔을 나눈 것이 어제 같은데.\n이제 누구와 더불어 창을 들겠습니까.`, `${t.other}의 슬픔`);
      } else if (deep) {
        lines.push(`${UI.gr(t.other)}(이)가 ${UI.gr(dead)}의 죽음을 듣고 곡했습니다`);
      }
      delete mem(st).bond[bkey(dead, t.other)];
    }
  }

  /* 군주 승계 */
  async function succeed(st, clanIdx, deadRuler, lines) {
    const cl = st.clans[clanIdx];
    if (!cl || !cl.alive) return;
    const pool = clanGens(st, clanIdx);
    if (!pool.length) {
      cl.alive = false;
      lines.push(`${UI.rd(deadRuler + ' 군')}은 뒤를 이을 사람이 없어 흩어졌습니다`);
      cities(st, clanIdx).forEach(id => { st.cities[id].clan = -1; });
      return;
    }
    let heir = HEIRS[deadRuler];
    if (!heir || !st.gens[heir] || st.gens[heir].clan !== clanIdx) {
      heir = pool.slice().sort((a, b) =>
        (S(b.name)[3] + S(b.name)[2] + b.loyal) - (S(a.name)[3] + S(a.name)[2] + a.loyal))[0].name;
    }
    cl.ruler = heir;
    st.gens[heir].loyal = 100;
    /* 충성 흔들림 */
    clanGens(st, clanIdx).forEach(g => {
      if (g.name !== heir) g.loyal = clamp(g.loyal - rr(4, 14), 0, 100);
    });
    if (clanIdx === pc(st)) {
      await UI.speech(heir, `${UI.yl(deadRuler)}님의 뒤를 이어\n${UI.gr(heir)}(이)가 군을 이끌게 되었습니다.`, `${heir} 계승`);
      UI.face(heir, true);
    } else {
      lines.push(`${UI.gr(deadRuler)}의 뒤를 ${UI.gr(heir)}(이)가 이었습니다`);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
   *  사서 이벤트
   * ──────────────────────────────────────────────────────────────── */

  /* ─────────────────────────────────────────────────────────────────
   *  임의 사건 (반복)
   * ──────────────────────────────────────────────────────────────── */
  const RANDOM = [
    {
      id: 'myeongsa', w: 3,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)];
        const sages = ['사마휘', '왕랑', '공융', '진규'].filter(n => alive(st, n));
        const sage = sages.length ? sages[rnd(sages.length)] : '사마휘';
        await UI.speech(sage, `${UI.yl(cname(cid))}의 정사가 맑다는 소문을 듣고 왔습니다.\n백성이 그 이름을 칭송하더군요.`, '명사의 방문');
        st.cities[cid].loyal = clamp(st.cities[cid].loyal + rr(6, 12), 0, 100);
        const pool = Object.values(st.gens).filter(g => g.clan === -1 && g.city === cid);
        if (pool.length) { pool[rnd(pool.length)].found = true; lines.push(`${UI.gr('재야의 인재')}가 이 고을에 있다 합니다`); }
      },
    },
    {
      id: 'sangin', w: 3,
      run: async (st, lines) => {
        const up = Math.random() < 0.5;
        const m = st.market;
        if (up) { m.riceBuy = clamp(Math.floor(m.riceBuy * 1.6), 55, 260); m.riceSell = Math.floor(m.riceBuy * 0.7); }
        else { m.riceBuy = clamp(Math.floor(m.riceBuy * 0.55), 40, 260); m.riceSell = Math.floor(m.riceBuy * 0.7); }
        lines.push(up
          ? `대상인이 쌀을 사재기해 ${UI.rd('쌀값이 폭등')}했습니다 (쌀팜 ${m.riceBuy})`
          : `풍작으로 ${UI.gr('쌀값이 폭락')}했습니다 (쌀팜 ${m.riceBuy})`);
      },
    },
    {
      id: 'hwangho', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        if (c.loyal > 70) { return; }
        const lost = Math.floor(c.troops * 0.12) + 300;
        c.troops = Math.max(0, c.troops - lost);
        c.loyal = clamp(c.loyal - 6, 0, 100);
        await UI.speech(pRuler(st), `${UI.yl(cname(cid))} 부근에 황건의 잔당이 일어나\n병사 ${UI.rd(lost)}명을 잃었습니다.`, '적도 봉기');
      },
    },
    {
      id: 'bomul', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)];
        const gold = rr(400, 1800);
        st.cities[cid].gold += gold;
        lines.push(`${UI.yl(cname(cid))}에서 옛 무덤이 발견되어 금 ${UI.gr(gold)}을 얻었습니다`);
      },
    },
    {
      id: 'nanmin', w: 3,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)];
        const n = rr(8000, 30000);
        st.cities[cid].pop += n;
        lines.push(`전란을 피한 유민 ${UI.gr(n)}명이 ${UI.yl(cname(cid))}로 흘러들었습니다`);
      },
    },
    {
      id: 'hyesung', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        cs.forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - rr(2, 6), 0, 100); });
        lines.push(`밤하늘에 ${UI.rd('혜성')}이 나타나 백성이 두려워합니다`);
      },
    },
    {
      id: 'pungnyeon', w: 2,
      run: async (st, lines) => {
        setFlag(st, 'pungnyeon_year', st.year);
        lines.push(`올해는 ${UI.gr('대풍년')}이 들 조짐입니다. 가을 수확이 늘 것입니다`);
      },
    },
    {
      id: 'iltal', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => g.loyal < 65 && g.name !== pRuler(st));
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        await UI.speech(g.name, '요즘 대접이 예전만 못하다는 생각이 듭니다…', `${g.name}의 불만`);
        g.loyal = clamp(g.loyal - rr(3, 8), 0, 100);
      },
    },

    /* ── 재해 ─────────────────────────────────────────────────────── */
    {
      id: 'locust', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        const lost = Math.floor(c.rice * (0.15 + Math.random() * 0.2));
        c.rice -= lost; c.loyal = clamp(c.loyal - 5, 0, 100);
        await UI.speech(c.governor || pRuler(st),
          `${UI.yl(cname(cid))}에 ${UI.rd('메뚜기 떼')}가 하늘을 덮었습니다.\n군량 ${lost}석을 잃었습니다.`, '황충의 해');
      },
    },
    {
      id: 'quake', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        c.wall = clamp(c.wall - rr(6, 15), 0, 100);
        c.pop = Math.floor(c.pop * 0.97);
        c.loyal = clamp(c.loyal - 6, 0, 100);
        lines.push(`${UI.yl(cname(cid))}에 ${UI.rd('지진')}이 나 성벽이 무너졌습니다`);
      },
    },
    {
      id: 'fire', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        const g = Math.floor(c.gold * 0.25), r = Math.floor(c.rice * 0.12);
        c.gold -= g; c.rice -= r;
        lines.push(`${UI.yl(cname(cid))}의 창고에 ${UI.rd('불')}이 나 금 ${g}, 군량 ${r}을 잃었습니다`);
      },
    },
    {
      id: 'desert', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => st.cities[id].loyal < 60 && st.cities[id].troops > 2000);
        if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        const lost = Math.floor(c.troops * 0.08) + 200;
        c.troops -= lost;
        lines.push(`${UI.yl(cname(cid))}에서 병사 ${UI.rd(lost)}명이 밤사이 달아났습니다`);
      },
    },
    {
      id: 'rot', w: 1,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => st.cities[id].rice > 40000);
        if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        const lost = Math.floor(c.rice * 0.1);
        c.rice -= lost;
        lines.push(`${UI.yl(cname(cid))}의 군량 ${UI.rd(lost)}석이 습기에 상했습니다`);
      },
    },
    {
      id: 'tiger', w: 1,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        const gens = c.gens.filter(n => S(n)[0] >= 70);
        if (gens.length && Math.random() < 0.6) {
          const who = gens[rnd(gens.length)];
          await UI.speech(who, `산에서 사람을 해치던 범을 잡았습니다.\n${UI.yl(cname(cid))}의 백성이 기뻐합니다.`, '맹호를 잡다');
          c.loyal = clamp(c.loyal + 6, 0, 100);
          st.gens[who].loyal = clamp(st.gens[who].loyal + 4, 0, 100);
        } else {
          c.pop = Math.floor(c.pop * 0.985);
          lines.push(`${UI.yl(cname(cid))} 근처에 맹수가 나타나 백성이 상했습니다`);
        }
      },
    },
    {
      id: 'eclipse', w: 1,
      run: async (st, lines) => {
        cities(st, pc(st)).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - rr(3, 7), 0, 100); });
        lines.push(`${UI.rd('일식')}이 일어나 백성이 흉조라며 술렁입니다`);
      },
    },

    /* ── 기연 ─────────────────────────────────────────────────────── */
    {
      id: 'find_horse', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[0] >= 75 && !(g.items || []).length);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        const horse = ['조황비전', '절영', '적로'].find(h =>
          !Object.values(st.gens).some(x => (x.items || []).includes(h)));
        if (!horse) return;
        await UI.banner('명마를 얻다');
        await grant(st, g.name, horse);
      },
    },
    {
      id: 'find_sword', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[0] >= 70);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        const sw = ['의천검', '칠성보도', '고정도', '청강검'].find(h =>
          !Object.values(st.gens).some(x => (x.items || []).includes(h)));
        if (!sw) return;
        await UI.banner('옛 무덤에서 나온 보검');
        await grant(st, g.name, sw);
      },
    },
    {
      id: 'find_book', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[1] >= 75);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        const bk = ['육도삼략', '손자병법', '태평요술서', '맹덕신서'].find(h =>
          !Object.values(st.gens).some(x => (x.items || []).includes(h)));
        if (!bk) return;
        await UI.banner('낡은 죽간');
        await grant(st, g.name, bk);
      },
    },
    {
      id: 'mine', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        if (Math.random() < 0.5) {
          c.tech = clamp(c.tech + rr(4, 9), 0, 100);
          lines.push(`${UI.yl(cname(cid))}에서 ${UI.gr('철광')}을 찾아 기술이 올랐습니다`);
        } else {
          c.comm = clamp(c.comm + rr(4, 9), 0, 100);
          lines.push(`${UI.yl(cname(cid))} 부근에서 ${UI.gr('소금 호수')}를 찾아 상업이 올랐습니다`);
        }
      },
    },
    {
      id: 'bandit_join', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        if (c.loyal < 55) return;
        const n = rr(800, 4000);
        c.troops += n;
        lines.push(`산에 숨어 살던 무리 ${UI.gr(n)}명이 ${UI.yl(cname(cid))}에 귀순했습니다`);
      },
    },
    {
      id: 'gift_gold', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => st.cities[id].loyal >= 75);
        if (!cs.length) return;
        const cid = cs[rnd(cs.length)];
        const g = rr(300, 1500);
        st.cities[cid].gold += g;
        lines.push(`${UI.yl(cname(cid))}의 호족들이 금 ${UI.gr(g)}을 바쳤습니다`);
      },
    },
    {
      id: 'trade', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => [16, 14, 15, 1, 44, 45, 43].includes(id));
        if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        c.horses += rr(300, 1200); c.bows += rr(200, 800);
        lines.push(`${UI.yl(cname(cid))}에 이민족 상인이 찾아와 ${UI.gr('군마와 활')}을 팔았습니다`);
      },
    },

    /* ── 사람 사이의 일 ────────────────────────────────────────────── */
    {
      id: 'feast', w: 3,
      run: async (st, lines) => {
        const cid = capital(st); if (!cid) return;
        const c = st.cities[cid];
        if (c.gold < 600) return;
        await UI.banner('연회를 베풀다');
        const gs = clanGens(st, pc(st));
        const who = gs.length ? gs[rnd(gs.length)].name : pRuler(st);
        await UI.speech(who, '오랜만에 술잔이 도니 군중의 웃음이 끊이지 않습니다.\n주공의 은덕입니다.', '연회');
        c.gold -= 600;
        gs.forEach(g => { g.loyal = clamp(g.loyal + rr(2, 6), 0, 100); });
      },
    },
    {
      id: 'quarrel', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => st.cities[id].gens.length >= 2);
        if (!cs.length) return;
        const c = st.cities[cs[rnd(cs.length)]];
        const a = c.gens[rnd(c.gens.length)];
        const b = c.gens.filter(n => n !== a)[0];
        if (!b) return;
        await UI.speech(a, `${UI.yl(b)}가 제 공을 가로챘습니다!\n한 성에 함께 있을 수 없습니다.`, '무장의 다툼');
        st.gens[a].loyal = clamp(st.gens[a].loyal - rr(3, 8), 0, 100);
        st.gens[b].loyal = clamp(st.gens[b].loyal - rr(3, 8), 0, 100);
      },
    },
    {
      id: 'recommend', w: 3,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[2] >= 70);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        const pool = Object.values(st.gens).filter(x => x.clan === -1 && x.city === g.city);
        if (!pool.length) return;
        const f = pool[rnd(pool.length)];
        f.found = true;
        await UI.speech(g.name, `${UI.mg(f.name)}이라는 사람이 이 고을에 숨어 삽니다.\n등용해 보시지요.`, `${g.name}의 천거`);
      },
    },
    {
      id: 'wound', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[0] >= 70);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        g.acted = true;
        g.loyal = clamp(g.loyal - 2, 0, 100);
        await UI.speech(g.name, '사냥길에 말에서 떨어져 다리를 다쳤습니다.\n한동안 군무를 볼 수 없겠습니다…', `${g.name}의 부상`);
      },
    },
    {
      id: 'birth', w: 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st));
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        g.loyal = clamp(g.loyal + rr(4, 9), 0, 100);
        lines.push(`${UI.gr(g.name)}의 집에 아이가 태어나 잔치가 열렸습니다`);
      },
    },
    {
      id: 'poet', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)];
        st.cities[cid].loyal = clamp(st.cities[cid].loyal + rr(3, 8), 0, 100);
        lines.push(`${UI.yl(cname(cid))}에 떠도는 악사가 들러 백성이 모처럼 웃었습니다`);
      },
    },
    {
      id: 'hunt', w: 2,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)); if (!cs.length) return;
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        c.train = clamp(c.train + rr(3, 8), 0, 100);
        c.rice += rr(500, 2500);
        lines.push(`${UI.yl(cname(cid))}에서 대규모 사냥을 벌여 훈련도가 올랐습니다`);
      },
    },
    {
      id: 'doctor', w: 1,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => LIFE[g.name] && LIFE[g.name][1]);
        if (!gs.length) return;
        const g = gs[rnd(gs.length)];
        st.lifeMod = st.lifeMod || {};
        st.lifeMod[g.name] = (st.lifeMod[g.name] || 0) + rr(1, 3);
        await UI.speech(g.name, '떠도는 명의를 만나 오랜 병을 고쳤습니다.\n한동안은 창을 들 수 있겠습니다.', '명의를 만나다');
      },
    },
    {
      id: 'spy', w: 2,
      run: async (st, lines) => {
        const foes = st.clans.filter(c => c.alive && c.id !== pc(st) && adjacentTo(st, c.id, pc(st)));
        if (!foes.length) return;
        const f = foes[rnd(foes.length)];
        if (Math.random() < 0.5) {
          const cid = anyCityOf(st, pc(st));
          if (cid) st.cities[cid].gold = Math.max(0, st.cities[cid].gold - rr(200, 800));
          lines.push(`${UI.rd(f.ruler)}의 간첩이 창고를 털고 달아났습니다`);
        } else {
          lines.push(`${UI.gr(f.ruler)}가 보낸 간첩을 붙잡았습니다`);
          f.relation[pc(st)] = clamp((f.relation[pc(st)] || 30) - 8, 0, 100);
        }
      },
    },
  ];

  /* ─────────────────────────────────────────────────────────────────
   *  외교 이벤트 — 다른 군주가 사자를 보내온다
   * ──────────────────────────────────────────────────────────────── */
  const DIPLO = [

    /* 동맹 요청 */
    {
      id: 'dip_ally',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && !me.allies[c.id] &&
          (c.relation[me.id] || 30) >= 45 && cities(st, c.id).length >= 2);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const mine = cities(st, me.id).length, his = cities(st, cl.id).length;
        const gift = rr(200, 900) + his * 60;
        await UI.banner(`${cl.ruler} 군의 사자`);
        await UI.speech(cl.ruler,
          `${UI.yl(pRuler(st))} 공의 위명은 익히 들었소.\n예물 ${UI.gr('금 ' + gift)}을 보내니 부디 ${UI.yl('동맹')}을 맺읍시다.\n` +
          (mine > his ? '뒤를 맡길 만한 이는 공뿐이오.' : '함께라면 두려울 것이 없소이다.'),
          `${cl.ruler}의 서신`);
        if (await UI.confirm('동맹을 받아들이겠습니까?')) {
          me.allies[cl.id] = 1; cl.allies[me.id] = 1;
          me.truce[cl.id] = 18; cl.truce[me.id] = 18;
          me.relation[cl.id] = clamp((me.relation[cl.id] || 40) + 25, 0, 100);
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 25, 0, 100);
          const cid = capital(st); if (cid) st.cities[cid].gold += gift;
          await UI.anyKey(`${UI.gr(cl.ruler)}와 동맹을 맺고 금 ${UI.yl(gift)}을 받았습니다`);
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) - 15, 0, 100);
          await UI.anyKey(`사자를 돌려보냈습니다`);
        }
      },
    },

    /* 정전 요청 */
    {
      id: 'dip_truce',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && !me.truce[c.id] &&
          cities(st, c.id).length < cities(st, me.id).length &&
          cities(st, c.id).some(a => Game.ADJ[a].some(b => st.cities[b].clan === me.id)));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const gold = rr(300, 1200), rice = rr(3000, 20000);
        await UI.banner(`${cl.ruler} 군의 사자`);
        await UI.speech(cl.ruler,
          `싸움이 길어 백성이 도탄에 빠졌소.\n금 ${UI.gr(gold)}과 군량 ${UI.gr(rice)}을 바치니\n부디 ${UI.yl('정전')}을 허락해 주시오.`,
          `${cl.ruler}의 청`);
        if (await UI.confirm('정전을 받아들이겠습니까?')) {
          me.truce[cl.id] = 12; cl.truce[me.id] = 12;
          cl.relation[me.id] = clamp((cl.relation[me.id] || 30) + 20, 0, 100);
          const cid = capital(st);
          if (cid) { st.cities[cid].gold += gold; st.cities[cid].rice += rice; }
          await UI.anyKey(`정전이 성립되고 금 ${UI.yl(gold)}, 군량 ${UI.yl(rice)}을 받았습니다`);
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 30) - 20, 0, 100);
          await UI.anyKey(`${UI.rd(cl.ruler)}의 청을 물리쳤습니다`);
        }
      },
    },

    /* 원군 요청 */
    {
      id: 'dip_aid',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && me.allies[c.id] &&
          cities(st, c.id).some(a => Game.ADJ[a].some(b => {
            const o = st.cities[b].clan;
            return o >= 0 && o !== c.id && o !== me.id && !c.allies[o];
          })));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const cid = capital(st);
        const need = rr(500, 2000);
        await UI.banner(`동맹국의 급보`);
        await UI.speech(cl.ruler,
          `적이 국경을 넘어 성이 위태롭소.\n동맹의 정을 생각해 ${UI.yl('금 ' + need)}만 보내 주시오.\n반드시 은혜를 갚겠소이다.`,
          `${cl.ruler}의 급보`);
        const have = cid ? st.cities[cid].gold : 0;
        if (have < need) { await UI.anyKey(UI.rd('보낼 금이 없어 사자를 돌려보냈습니다')); cl.relation[me.id] = clamp((cl.relation[me.id] || 50) - 10, 0, 100); return; }
        if (await UI.confirm(`금 ${need}을 보내겠습니까?`)) {
          st.cities[cid].gold -= need;
          cl.relation[me.id] = clamp((cl.relation[me.id] || 50) + 25, 0, 100);
          cities(st, cl.id).forEach(id => { st.cities[id].troops += Math.floor(need / 3); });
          await UI.speech(cl.ruler, '이 은혜는 잊지 않겠소.\n뒷날 반드시 갚으리다.', '동맹국의 감사');
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 50) - 30, 0, 100);
          if (Math.random() < 0.5) {
            delete me.allies[cl.id]; delete cl.allies[me.id];
            await UI.speech(cl.ruler, '동맹이 이런 것이었소?\n오늘로 우리 사이는 끝이오!', '동맹 파기');
          } else await UI.anyKey('사자를 빈손으로 돌려보냈습니다');
        }
      },
    },

    /* 협공 제안 */
    {
      id: 'dip_joint',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && (c.relation[me.id] || 30) >= 40 &&
          st.clans.some(t => t.alive && t.id !== c.id && t.id !== me.id &&
            cities(st, t.id).some(a => Game.ADJ[a].some(b => st.cities[b].clan === me.id))));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const targets = st.clans.filter(t => t.alive && t.id !== cl.id && t.id !== me.id &&
          cities(st, t.id).some(a => Game.ADJ[a].some(b => st.cities[b].clan === me.id)));
        if (!targets.length) return;
        const tg = targets[rnd(targets.length)];
        await UI.banner(`${cl.ruler} 군의 제안`);
        await UI.speech(cl.ruler,
          `${UI.rd(tg.ruler)}는 우리 두 집안의 근심거리요.\n동쪽에서 내가 치겠으니 공은 서쪽에서 쳐주시오.\n땅은 각자 얻은 만큼 가지면 될 것이오.`,
          `${cl.ruler}의 밀서`);
        if (await UI.confirm(`${tg.ruler}를 함께 치겠습니까?`)) {
          me.relation[cl.id] = clamp((me.relation[cl.id] || 40) + 15, 0, 100);
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 15, 0, 100);
          me.truce[cl.id] = 10; cl.truce[me.id] = 10;
          delete cl.truce[tg.id]; delete cl.allies[tg.id];
          cl.relation[tg.id] = 0;
          setFlag(st, 'joint_target', tg.id);
          /* 협공국이 실제로 군을 낸다 */
          cities(st, cl.id).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 8, 0, 100); });
          await UI.anyKey(`${UI.gr(cl.ruler)}가 ${UI.rd(tg.ruler)}에게 군을 일으켰습니다`);
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) - 8, 0, 100);
          await UI.anyKey('제안을 거절했습니다');
        }
      },
    },

    /* 조공 */
    {
      id: 'dip_tribute',
      pick: st => {
        const me = pClan(st);
        const mine = cities(st, me.id).length;
        return st.clans.filter(c => c.alive && c.id !== me.id && cities(st, c.id).length * 3 <= mine);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const gold = rr(200, 900), rice = rr(2000, 12000);
        await UI.banner(`${cl.ruler}의 조공`);
        await UI.speech(cl.ruler,
          `${UI.yl(pRuler(st))} 공의 위엄에 감복하였소.\n금 ${UI.gr(gold)}과 군량 ${UI.gr(rice)}을 바치니\n부디 우리 땅을 넘보지 말아 주시오.`,
          `${cl.ruler}의 사자`);
        const cid = capital(st);
        if (cid) { st.cities[cid].gold += gold; st.cities[cid].rice += rice; }
        me.relation[cl.id] = clamp((me.relation[cl.id] || 40) + 10, 0, 100);
        cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 10, 0, 100);
        if (await UI.confirm('예를 갖추어 답례하겠습니까? (정전 성립)')) {
          me.truce[cl.id] = 10; cl.truce[me.id] = 10;
          await UI.anyKey(`${UI.gr(cl.ruler)}와 정전했습니다`);
        } else {
          await UI.anyKey(`조공만 받아 두었습니다`);
        }
      },
    },

    /* 동맹 파기 통고 */
    {
      id: 'dip_break',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && me.allies[c.id] && (c.relation[me.id] || 50) < 35);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        await UI.banner(`${cl.ruler} 군의 통고`);
        await UI.speech(cl.ruler,
          `천하에 영원한 벗이 어디 있겠소.\n오늘로 맹약을 거두겠소이다.`, `${cl.ruler}의 사자`);
        delete me.allies[cl.id]; delete cl.allies[me.id];
        delete me.truce[cl.id]; delete cl.truce[me.id];
        await UI.anyKey(UI.rd(`${cl.ruler}와의 동맹이 깨졌습니다`));
      },
    },

    /* 항복 권고 */
    {
      id: 'dip_surrender',
      pick: st => {
        const me = pClan(st);
        if (cities(st, me.id).length > 1) return [];
        return st.clans.filter(c => c.alive && c.id !== me.id && cities(st, c.id).length >= 8 &&
          cities(st, c.id).some(a => Game.ADJ[a].some(b => st.cities[b].clan === me.id)));
      },
      run: async (st, cl) => {
        await UI.banner(`${cl.ruler}의 권고`);
        await UI.speech(cl.ruler,
          `외로운 성 하나로 무엇을 하겠소.\n항복한다면 예로써 대접하고 벼슬도 주겠소.`, `${cl.ruler}의 사자`);
        if (await UI.confirm(UI.rd('항복하겠습니까? (게임이 끝납니다)'))) {
          Game.surrenderTo(pc(st), cl.id);
          st.gameOver = 'surrender';
        } else {
          await UI.speech(pRuler(st), '한 자의 땅이라도 뜻을 굽힐 수는 없다.\n사자를 돌려보내라!', pRuler(st));
          clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 8, 0, 100); });
        }
      },
    },

    /* 적장 귀순 제의 */
    {
      id: 'dip_defect',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id &&
          clanGens(st, c.id).some(g => g.loyal < 45 && g.name !== c.ruler));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const cand = clanGens(st, cl.id).filter(g => g.loyal < 45 && g.name !== cl.ruler)
          .sort((a, b) => a.loyal - b.loyal)[0];
        if (!cand) return;
        const cid = capital(st); if (!cid) return;
        const price = rr(400, 1500);
        await UI.banner('은밀한 서신');
        await UI.speech(cand.name,
          `${UI.yl(cl.ruler)}는 사람을 알아보지 못합니다.\n금 ${UI.gr(price)}만 보내 주신다면\n성문을 열고 귀순하겠습니다.`,
          `${cand.name}의 밀서`);
        if (st.cities[cid].gold < price) { await UI.anyKey(UI.rd('금이 부족해 답을 보내지 못했습니다')); return; }
        if (await UI.confirm(`금 ${price}을 보내겠습니까?`)) {
          st.cities[cid].gold -= price;
          if (Math.random() < 0.75) {
            join(st, cand.name, me.id, cid, rr(55, 75));
            await UI.speech(cand.name, '이제부터 명을 받들겠습니다.', `${UI.yl(cand.name)} 귀순`);
          } else {
            await UI.speech(cl.ruler, '어리석은 것들, 그 서신은 미끼였다!\n금은 잘 쓰겠소이다.', '반간계였다');
            cities(st, cl.id).forEach(id => { st.cities[id].gold += Math.floor(price / cities(st, cl.id).length); });
          }
        }
      },
    },

    /* 혼인 동맹 */
    {
      id: 'dip_marry',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && (c.relation[me.id] || 30) >= 50 &&
          cities(st, c.id).length >= 3 && !me.allies[c.id]);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        await UI.banner('혼담이 오다');
        await UI.speech(cl.ruler,
          `우리 두 집안이 사돈을 맺으면\n창을 거두고 오래 편안할 것이오.\n${UI.yl('혼인으로 맹약')}을 삼읍시다.`,
          `${cl.ruler}의 청혼`);
        if (await UI.confirm('혼인 동맹을 맺겠습니까?')) {
          me.allies[cl.id] = 1; cl.allies[me.id] = 1;
          me.truce[cl.id] = 36; cl.truce[me.id] = 36;
          me.relation[cl.id] = 95; cl.relation[me.id] = 95;
          clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 3, 0, 100); });
          await UI.speech(cl.ruler, '이제 우리는 한 집안이오.\n등 뒤를 걱정하지 맙시다.', '혼례');
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) - 20, 0, 100);
          await UI.anyKey('혼담을 물렸습니다');
        }
      },
    },

    /* 최후통첩 */
    {
      id: 'dip_threat',
      pick: st => {
        const me = pClan(st);
        const mine = cities(st, me.id).length;
        return st.clans.filter(c => c.alive && c.id !== me.id && cities(st, c.id).length >= mine * 2 + 2 &&
          adjacentTo(st, c.id, me.id) && !c.allies[me.id]);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const cid = capital(st);
        const demand = rr(800, 2500);
        await UI.banner(`${cl.ruler}의 최후통첩`);
        await UI.speech(cl.ruler,
          `공의 땅은 좁고 병사는 적소.\n금 ${UI.rd(demand)}을 바치면 창을 거두겠으나,\n그렇지 않으면 이달 안에 성 아래로 가겠소.`,
          `${cl.ruler}의 사자`);
        if (await UI.confirm(`금 ${demand}을 바치겠습니까?`)) {
          if (cid && st.cities[cid].gold >= demand) {
            st.cities[cid].gold -= demand;
            me.truce[cl.id] = 8; cl.truce[me.id] = 8;
            cl.relation[me.id] = clamp((cl.relation[me.id] || 30) + 15, 0, 100);
            clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal - 3, 0, 100); });
            await UI.anyKey('굴욕을 삼키고 화를 면했습니다');
          } else await UI.anyKey(UI.rd('금이 모자라 청을 들어주지 못했습니다'));
        } else {
          cl.relation[me.id] = 0;
          cities(st, cl.id).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 6, 0, 100); });
          clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 6, 0, 100); });
          await UI.speech(pRuler(st), '한 자의 땅도 협박에 내주지 않는다.\n성벽을 높이고 기다려라!', pRuler(st));
        }
      },
    },

    /* 통행 요청 */
    {
      id: 'dip_pass',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && adjacentTo(st, c.id, me.id) &&
          st.clans.some(t => t.alive && t.id !== c.id && t.id !== me.id && adjacentTo(st, me.id, t.id)));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const targets = st.clans.filter(t => t.alive && t.id !== cl.id && t.id !== me.id && adjacentTo(st, me.id, t.id));
        if (!targets.length) return;
        const tg = targets[rnd(targets.length)];
        const pay = rr(400, 1600);
        await UI.banner('길을 빌려 달라');
        await UI.speech(cl.ruler,
          `${UI.rd(tg.ruler)}를 치려 하오.\n공의 땅을 지나가게 해 주시면 금 ${UI.gr(pay)}을 드리리다.`,
          `${cl.ruler}의 청`);
        if (await UI.confirm('길을 빌려주겠습니까?')) {
          const cid = capital(st);
          if (cid) st.cities[cid].gold += pay;
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 20, 0, 100);
          tg.relation[me.id] = clamp((tg.relation[me.id] || 40) - 25, 0, 100);
          delete cl.truce[tg.id]; delete cl.allies[tg.id];
          await UI.anyKey(`금 ${UI.yl(pay)}을 받고 길을 열었습니다`);
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) - 15, 0, 100);
          tg.relation[me.id] = clamp((tg.relation[me.id] || 40) + 15, 0, 100);
          await UI.anyKey('길을 막았습니다');
        }
      },
    },

    /* 군량 대여 */
    {
      id: 'dip_lend',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && (c.relation[me.id] || 30) >= 40 &&
          cities(st, c.id).some(id => st.cities[id].rice < 20000));
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const cid = capital(st); if (!cid) return;
        const need = rr(8000, 30000);
        await UI.banner('군량을 꾸다');
        await UI.speech(cl.ruler,
          `흉년으로 창고가 비었소.\n군량 ${UI.yl(need)}석만 빌려 주시면\n가을에 갑절로 갚겠소이다.`, `${cl.ruler}의 청`);
        if (st.cities[cid].rice < need) { await UI.anyKey(UI.rd('빌려줄 군량이 없습니다')); return; }
        if (await UI.confirm(`군량 ${need}석을 빌려주겠습니까?`)) {
          st.cities[cid].rice -= need;
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 25, 0, 100);
          setFlag(st, 'lend_' + cl.id, st.year * 12 + st.month);
          st.debts = st.debts || {};
          st.debts[cl.id] = { amount: Math.floor(need * 1.8), due: st.year * 12 + st.month + rr(6, 12) };
          await UI.speech(cl.ruler, '이 은혜는 반드시 갚겠소.', '차용 성립');
        } else {
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) - 12, 0, 100);
          await UI.anyKey('청을 물리쳤습니다');
        }
      },
    },

    /* 무장 교환 */
    {
      id: 'dip_swap',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && (c.relation[me.id] || 30) >= 45 &&
          clanGens(st, c.id).length >= 3 && clanGens(st, me.id).length >= 3);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const mine = clanGens(st, me.id).filter(g => g.name !== me.ruler)
          .sort((a, b) => a.loyal - b.loyal)[0];
        const theirs = clanGens(st, cl.id).filter(g => g.name !== cl.ruler)
          .sort((a, b) => (S(b.name)[0] + S(b.name)[1]) - (S(a.name)[0] + S(a.name)[1]))[0];
        if (!mine || !theirs) return;
        await UI.banner('무장을 맞바꾸다');
        await UI.speech(cl.ruler,
          `${UI.yl(theirs.name)}을 보낼 터이니\n${UI.yl(mine.name)}을 내어 주시오.\n서로에게 손해는 아닐 것이오.`,
          `${cl.ruler}의 제안`);
        if (await UI.confirm(`${mine.name} 과 ${theirs.name} 을 맞바꾸겠습니까?`)) {
          const myCity = mine.city, hisCity = theirs.city;
          join(st, theirs.name, me.id, myCity, rr(45, 70));
          join(st, mine.name, cl.id, hisCity, rr(45, 70));
          cl.relation[me.id] = clamp((cl.relation[me.id] || 40) + 10, 0, 100);
          await UI.speech(theirs.name, '이제부터 이곳의 녹을 먹겠습니다.', `${UI.yl(theirs.name)} 합류`);
        } else await UI.anyKey('제안을 물리쳤습니다');
      },
    },

    /* 사죄 사절 */
    {
      id: 'dip_sorry',
      pick: st => {
        const me = pClan(st);
        return st.clans.filter(c => c.alive && c.id !== me.id && (c.relation[me.id] || 30) < 25 &&
          cities(st, c.id).length < cities(st, me.id).length);
      },
      run: async (st, cl) => {
        const me = pClan(st);
        const gold = rr(300, 1200);
        await UI.banner('사죄의 사절');
        await UI.speech(cl.ruler,
          `지난 일은 아랫사람의 허물이오.\n금 ${UI.gr(gold)}을 보내니 노여움을 푸시오.`, `${cl.ruler}의 사죄`);
        const cid = capital(st);
        if (cid) st.cities[cid].gold += gold;
        if (await UI.confirm('노여움을 풀겠습니까?')) {
          me.relation[cl.id] = clamp((me.relation[cl.id] || 20) + 30, 0, 100);
          cl.relation[me.id] = clamp((cl.relation[me.id] || 20) + 30, 0, 100);
          me.truce[cl.id] = 8; cl.truce[me.id] = 8;
          await UI.anyKey('두 집안이 화해했습니다');
        } else {
          await UI.anyKey(`금 ${UI.yl(gold)}만 받아 두었습니다`);
          cl.relation[me.id] = clamp((cl.relation[me.id] || 20) - 10, 0, 100);
        }
      },
    },
  ];

  /* ─────────────────────────────────────────────────────────────────
   *  월별 처리
   * ──────────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────────
   *  이벤트 등급 — 판을 얼마나 흔드는가
   *    0 무해   대화 · 칭송 · 풍경.               조건이 느슨해도 좋다
   *    1 간접   충성 · 훈련 · 민심만 움직인다.     느슨해도 좋다
   *    2 재물   금 · 군량 · 병사 · 보물 · 땅의 값
   *    3 인재   장수가 오고 가고 주인이 바뀐다.    까다로워야 한다
   *    4 생사   사람이 죽고 군주가 갈린다.         가장 까다로워야 한다
   *
   *  warm : 시나리오 시작 후 이만큼 지나야 한다 (시작 직후 대사건 방지)
   *  gap  : 같은 등급 이상의 사건 사이 최소 간격
   *  mul  : 확률에 곱하는 값
   * ──────────────────────────────────────────────────────────────── */
  const TIER = {
    0: { warm: 0,  gap: 0,  mul: 1    },
    1: { warm: 0,  gap: 0,  mul: 1    },
    2: { warm: 2,  gap: 0,  mul: 1    },
    3: { warm: 8,  gap: 5,  mul: 0.8  },
    4: { warm: 12, gap: 15, mul: 0.65 },
  };
  /* 이 사건이 지금 터져도 되는 판인가 — 개별 cond 와 별개로 걸리는 자물쇠 */
  function tierOk(st, ev) {
    const t = TIER[ev.tier === undefined ? 2 : ev.tier];
    if (elapsed(st) < t.warm) return false;
    if (t.gap) {
      const m = mem(st);
      for (const lv of Object.keys(m.tier)) {
        if (+lv < (ev.tier || 0)) continue;
        if (now(st) - m.tier[lv] < t.gap) return false;
      }
    }
    return true;
  }

  async function monthly(st, lines) {
    if (st.gameOver) return;
    bookkeep(st);
    await lifecycle(st, lines);
    if (st.gameOver) return;

    /* 사서 이벤트 : 한 달에 최대 두 건, 판을 흔드는 사건은 한 건 */
    let fired = 0, heavy = 0;
    for (const ev of storyList()) {
      if (fired >= 2) break;
      const tier = ev.tier === undefined ? 2 : ev.tier;
      if (tier >= 3 && heavy) continue;
      if (!ev.repeat && flag(st, ev.id)) continue;
      if (ev.repeat && since(st, ev.id) >= 0 && since(st, ev.id) < (ev.cool || 12)) continue;
      if (!tierOk(st, ev)) continue;
      let ok = false;
      try { ok = ev.cond(st); } catch (e) { ok = false; }
      if (!ok) continue;
      const ch = typeof ev.chance === 'function' ? ev.chance(st) : (ev.chance === undefined ? 1 : ev.chance);
      if (Math.random() > ch * TIER[tier].mul) continue;
      setFlag(st, ev.id);
      mem(st).tier[tier] = now(st);
      (st.hist || (st.hist = [])).push([st.year, st.month, ev.title || ev.id]);
      try { await ev.run(st, lines); } catch (e) { /* 한 이벤트의 실패가 진행을 막지 않는다 */ }
      fired++;
      if (tier >= 3) heavy++;
      if (st.gameOver) return;
    }
    if (st.gameOver) return;

    /* 외교 : 확률적으로 하나 */
    if (cities(st, pc(st)).length && Math.random() < 0.3) {
      const bag = [];
      for (const d of DIPLO) {
        let list = [];
        try { list = d.pick(st) || []; } catch (e) { list = []; }
        list.forEach(cl => bag.push([d, cl]));
      }
      if (bag.length) {
        const [d, cl] = bag[rnd(bag.length)];
        (st.hist || (st.hist = [])).push([st.year, st.month, `${cl.ruler} 군의 사자가 오다`]);
        try { await d.run(st, cl); } catch (e) { /* 사자 하나가 넘어져도 진행 */ }
      }
    }
    if (st.gameOver) return;

    /* 빌려준 군량 회수 */
    if (st.debts) {
      Object.keys(st.debts).forEach(k => {
        const d = st.debts[k];
        if (now(st) < d.due) return;
        delete st.debts[k];
        const cl = st.clans[k];
        const cid = capital(st);
        if (!cl || !cl.alive || !cid) { lines.push(`빌려준 군량을 돌려받지 못했습니다`); return; }
        if (Math.random() < 0.75) {
          st.cities[cid].rice += d.amount;
          lines.push(`${UI.gr(cl.ruler)}가 빌린 군량 ${UI.yl(d.amount)}석을 갚았습니다`);
        } else {
          cl.relation[pc(st)] = clamp((cl.relation[pc(st)] || 40) - 20, 0, 100);
          lines.push(`${UI.rd(cl.ruler)}가 빌린 군량을 끝내 갚지 않았습니다`);
        }
      });
    }

    /* 의형제 · 친분이 저절로 깊어지고 옅어진다 */
    driftBonds(st);

    /* 임의 사건 — 한 달에 최대 두 건 */
    const bag = [];
    randomList().forEach(e => { for (let i = 0; i < (e.w || 2); i++) bag.push(e); });
    const rolls = Math.random() < 0.6 ? (Math.random() < 0.3 ? 2 : 1) : 0;
    const used = new Set();
    for (let k = 0; k < rolls; k++) {
      const e = bag[rnd(bag.length)];
      if (used.has(e.id)) continue;
      used.add(e.id);
      if (e.cond) { let ok = false; try { ok = e.cond(st); } catch (err) { ok = false; } if (!ok) continue; }
      try { await e.run(st, lines); } catch (err) { /* 사건 하나가 실패해도 진행 */ }
      if (st.gameOver) return;
    }
  }

  /* 같은 성에서 어깨를 맞대면 정이 붙고, 떨어져 지내면 옅어진다.
     정이 깊은 둘은 서로의 충성을 붙들어 준다 — 장수 보유에는 손대지 않는다. */
  function driftBonds(st) {
    const m = mem(st);
    Object.keys(m.bond).forEach(k => {
      const [a, b] = k.split('|');
      if (!alive(st, a) || !alive(st, b)) { return; }
      if (together(st, a, b)) {
        m.bond[k] = clamp(m.bond[k] + 1, 0, 100);
        if (m.bond[k] >= 40) {
          const ga = st.gens[a], gb = st.gens[b];
          const lift = m.bond[k] >= 70 ? 2 : 1;
          if (ga.clan >= 0) ga.loyal = clamp(ga.loyal + lift, 0, 100);
          if (gb.clan >= 0) gb.loyal = clamp(gb.loyal + lift, 0, 100);
        }
      } else if (st.gens[a].clan !== st.gens[b].clan) {
        m.bond[k] = clamp(m.bond[k] - 1, 0, 100);
      }
    });
  }

  /* AI 세력의 사서 진행 (플레이어가 유비가 아닐 때도 세상은 돈다) */
  function aiHistory(st, lines) {
    const liu = st.clans.find(c => c.alive && c.ruler === '유비' && c.id !== pc(st));
    if (liu && st.year >= 207 && isFree(st, '제갈량') && Math.random() < 0.06) {
      const cs = cities(st, liu.id);
      if (cs.length) {
        join(st, '제갈량', liu.id, cs[0], 100);
        lines.push(`${UI.gr('유비')}가 삼고초려 끝에 ${UI.yl('제갈량')}을 얻었다 합니다`);
      }
    }
    const sun = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler) && c.id !== pc(st));
    if (sun && st.year >= 208 && isFree(st, '방통') && Math.random() < 0.03) {
      const cs = cities(st, sun.id);
      if (cs.length) { join(st, '방통', sun.id, cs[0], 70); }
    }
  }

  const api = {
    flag, setFlag, since, clanOf, isFree, alive, pc, pClan, pRuler, cities, capital,
    clanByRuler, clanGens, join, leave, S, cname, rr, rnd, clamp, scenes, grant,
    adjacentTo, anyCityOf, notify, deathMonth,
    /* 조건을 까다롭게 쓰기 위한 것들 */
    mem, elapsed, startYear, clanAny, ownerOf, everHeld, peakOf, tookFrom, sinceFell,
    troopsOf, broken, declined, serves, cityOf, together, gone, captive,
    bondOf, addBond, bondsOf,
  };

  return {
    monthly, aiHistory, lifecycle, bookkeep, tierOk, TIER,
    get STORY() { return storyList(); }, get RANDOM_ALL() { return randomList(); },
    DIPLO, RANDOM, join, leave, api,
  };
})();
