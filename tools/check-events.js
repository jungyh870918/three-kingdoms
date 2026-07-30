/* =========================================================================
 *  이벤트 발생 조건 검수 —  node tools/check-events.js [반복횟수]
 *
 *  게임을 실제로 굴려 보고, 사서 이벤트가 '있을 수 없는 판'에서 터지지 않는지
 *  확인한다. 특히 다음 불변식을 감시한다.
 *
 *   ① 사서 이벤트로는, 유비가 서주(소패)에 멀쩡히 앉아 있는 동안 관우가 조조에게 가지 않는다
 *      (외교의 무장 교환처럼 플레이어가 스스로 넘기는 것은 별개다)
 *   ② 삼형제 이산 → 관우 의탁 → 천리행 → 고성 재회 의 순서가 뒤집히지 않는다
 *   ③ 등급 3·4(인재 이동 · 생사) 사건은 시나리오 시작 직후에 터지지 않는다
 *   ④ 한 달에 등급 3 이상은 한 건만 터진다
 *   ⑤ 등급 4 사건 사이에는 최소 간격이 있다
 *   ⑥ 모든 사서 이벤트에 등급이 붙어 있고, 조건문이 예외를 던지지 않는다
 * ========================================================================= */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ROUNDS = +(process.argv[2] || 12);

let bad = 0;
const err = m => { console.log('  ✗ ' + m); bad++; };

/* ── 판을 굴리기 위한 최소한의 껍데기 ──────────────────────────────── */
const sb = { console, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error };
sb.globalThis = sb;
vm.createContext(sb);
const load = f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sb, { filename: f });

/* UI · Game 을 말없는 인형으로 바꿔 끼운다 */
const seen = [];                                   /* 이번 달에 터진 연출 */
sb.UI = {
  speech: async () => {}, banner: async () => {}, anyKey: async () => {},
  confirm: async () => Math.random() < 0.5, face: () => {},
  yl: s => s, gr: s => s, rd: s => s, cy: s => s, mg: s => s,
};
load('data.js');
const grab = expr => vm.runInContext(expr, sb);
const { CITIES, GENERALS, LIFE, SCENARIOS, ROUTES } =
  grab('({ CITIES, GENERALS, LIFE, SCENARIOS, ROUTES })');

/* 인접 표 */
const ADJ = {};
CITIES.forEach(c => { ADJ[c.id] = []; });
ROUTES.forEach(([a, b]) => { ADJ[a].push(b); ADJ[b].push(a); });

const S = n => GENERALS[n] || [40, 40, 40, 40, 40, 40, 5, 1];
const rr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let st = null;
sb.Game = {
  ADJ,
  grant: (name, item) => {
    const g = st.gens[name]; if (!g) return false;
    g.items = g.items || []; if (g.items.includes(item)) return false;
    g.items.push(item); return true;
  },
  removeFromCity: name => {
    const g = st.gens[name]; if (!g) return;
    CITIES.forEach(c => {
      const a = st.cities[c.id].gens, i = a.indexOf(name);
      if (i >= 0) a.splice(i, 1);
    });
  },
  assignOfficers: cid => {
    const c = st.cities[cid];
    c.governor = c.gens.length ? c.gens[0] : null;
  },
  killGen: name => {
    sb.Game.removeFromCity(name);
    CITIES.forEach(c => {
      const a = st.cities[c.id].prisoners, i = a.indexOf(name);
      if (i >= 0) a.splice(i, 1);
    });
    delete st.gens[name];
  },
  checkRulers: () => {
    st.clans.forEach(cl => {
      if (!cl.alive) return;
      if (st.gens[cl.ruler] && st.gens[cl.ruler].clan === cl.id) return;
      const pool = Object.values(st.gens).filter(g => g.clan === cl.id);
      if (!pool.length) {
        cl.alive = false;
        CITIES.forEach(c => { if (st.cities[c.id].clan === cl.id) st.cities[c.id].clan = -1; });
      } else { cl.ruler = pool[0].name; }
    });
  },
  captureCity: (ci, cid, troops) => {
    const c = st.cities[cid];
    c.gens.slice().forEach(n => { if (st.gens[n]) { st.gens[n].clan = -1; sb.Game.removeFromCity(n); } });
    c.clan = ci; c.troops = Math.max(500, troops | 0); c.governor = null;
  },
  surrenderTo: (from, to) => {
    CITIES.forEach(c => { if (st.cities[c.id].clan === from) st.cities[c.id].clan = to; });
    Object.values(st.gens).forEach(g => { if (g.clan === from) g.clan = to; });
    st.clans[from].alive = false;
  },
};
load('events.js');
load('story.js');
load('human.js');
const { Events, STORY_EVENTS, HUMAN_EVENTS } =
  grab('({ Events, STORY_EVENTS, HUMAN_EVENTS })');

/* ── 판 만들기 (game.js newGame 의 요지만) ────────────────────────── */
function newGame(scenIdx, playerClanIdx) {
  const sc = SCENARIOS[scenIdx];
  st = {
    scen: scenIdx, year: sc.year, month: sc.month, playerClan: playerClanIdx,
    clans: [], cities: {}, gens: {}, hist: [], flags: {},
    market: { riceBuy: 100, riceSell: 70 },
  };
  CITIES.forEach(d => {
    const k = d.size;
    st.cities[d.id] = {
      id: d.id, clan: -1, gens: [], prisoners: [], governor: null,
      pop: rr(60000, 130000) * k, gold: rr(700, 2200) * k, rice: rr(25000, 62000) * k,
      troops: rr(4000, 11000) * k, loyal: rr(58, 84), agri: rr(20, 34) + k * 12,
      comm: rr(18, 32) + k * 12, tech: rr(20, 40) + k * 8, flood: rr(35, 60),
      wall: rr(45, 70) + k * 6, train: rr(35, 60),
      bows: rr(2, 8) * 500 * k, cbows: 0, horses: rr(1, 5) * 400 * k,
    };
  });
  sc.clans.forEach(([ruler, cityIds, place], i) => {
    st.clans.push({ id: i, ruler, alive: true, isPlayer: i === playerClanIdx,
                    allies: {}, truce: {}, relation: {} });
    cityIds.forEach(cid => { if (st.cities[cid]) { st.cities[cid].clan = i; st.cities[cid].gens = []; } });
    (place || []).forEach(([cid, names]) => {
      names.split(' ').filter(Boolean).forEach(nm => {
        if (!GENERALS[nm] || st.gens[nm]) return;
        const L = LIFE[nm];
        if (L && L[1] && L[1] < st.year) return;
        st.gens[nm] = { name: nm, clan: i, city: cid, acted: false,
                        loyal: nm === ruler ? 100 : clamp(60 + S(nm)[6] * 3 + rr(-6, 8), 40, 99) };
        if (st.cities[cid]) st.cities[cid].gens.push(nm);
      });
    });
    if (!st.gens[ruler]) {
      const cid = cityIds[0];
      st.gens[ruler] = { name: ruler, clan: i, city: cid, acted: false, loyal: 100 };
      st.cities[cid].gens.push(ruler);
    }
    cityIds.forEach(cid => { if (st.cities[cid] && st.cities[cid].gens.length) sb.Game.assignOfficers(cid); });
  });
  Object.keys(GENERALS).forEach(nm => {
    if (st.gens[nm]) return;
    const L = LIFE[nm] || [0, 0];
    if (L[0] && L[0] > st.year) return;
    if (L[1] && L[1] < st.year) return;
    const home = S(nm)[7];
    st.gens[nm] = { name: nm, clan: -1, city: st.cities[home] ? home : 1, acted: false, loyal: 0 };
  });
  st.clans.forEach((a, i) => st.clans.forEach((b, j) => { if (i !== j) a.relation[j] = rr(30, 55); }));
  return st;
}

/* 전쟁 흉내 — 인접한 성을 이따금 빼앗아 판이 흐르게 한다 */
function warTick() {
  if (Math.random() > 0.5) return;
  const owned = CITIES.map(c => c.id).filter(id => st.cities[id].clan >= 0);
  if (!owned.length) return;
  const src = owned[Math.floor(Math.random() * owned.length)];
  const me = st.cities[src].clan;
  const tgt = ADJ[src].filter(id => st.cities[id].clan !== me);
  if (!tgt.length) return;
  const dst = tgt[Math.floor(Math.random() * tgt.length)];
  sb.Game.captureCity(me, dst, Math.floor(st.cities[src].troops * 0.4));
  st.cities[dst].gens.forEach(n => {});
  /* 빼앗은 성에 장수 하나를 옮겨 둔다 */
  const pool = st.cities[src].gens;
  if (pool.length > 1) {
    const n = pool[pool.length - 1];
    sb.Game.removeFromCity(n);
    st.gens[n].city = dst; st.cities[dst].gens.push(n);
  }
  sb.Game.checkRulers();
}

/* ── 정적 검사 ───────────────────────────────────────────────────── */
console.log(`① 등급 · 조건문 (${STORY_EVENTS.length}건 사서 + ${HUMAN_EVENTS.length}건 인정)`);
STORY_EVENTS.forEach(e => {
  if (e.tier === undefined) err(`${e.id} 에 tier 가 없다`);
  else if (e.tier < 0 || e.tier > 4) err(`${e.id}.tier = ${e.tier} 는 0~4 밖이다`);
  if (typeof e.cond !== 'function') err(`${e.id} 에 cond 가 없다`);
  if (typeof e.run !== 'function') err(`${e.id} 에 run 이 없다`);
});
HUMAN_EVENTS.forEach(e => {
  if (typeof e.run !== 'function') err(`인정 ${e.id} 에 run 이 없다`);
  if (!e.w) err(`인정 ${e.id} 에 가중치 w 가 없다`);
});

/* 이름이 겹치면 하나가 영원히 묻힌다 */
const ids = STORY_EVENTS.map(e => e.id).concat(HUMAN_EVENTS.map(e => e.id));
ids.forEach((id, i) => { if (ids.indexOf(id) !== i) err(`이벤트 id 중복: ${id}`); });

/* ── 시작 직후 검사 : 첫 달에 판을 흔드는 사건이 서면 안 된다 ────────── */
console.log('② 시나리오 시작 직후 (16종 × 전 세력)');
SCENARIOS.forEach((sc, si) => {
  sc.clans.forEach((cl, ci) => {
    newGame(si, ci);
    Events.bookkeep(st);
    STORY_EVENTS.forEach(e => {
      if ((e.tier || 0) < 3) return;
      let ok = false;
      try { ok = e.cond(st); } catch (ex) { err(`${e.id}.cond 이 예외를 던졌다 (${sc.title}/${cl[0]}): ${ex.message}`); return; }
      if (ok && Events.tierOk(st, e)) err(`${sc.title} · ${cl[0]} 첫 달에 [${e.title || e.id}] 가 발생 가능하다`);
    });
  });
});

/* ── 관우 불변식 : 손으로 만든 판으로 확인 ─────────────────────────── */
console.log('③ 관우 귀순 조건');
{
  /* 군웅할거(190) 에서 유비가 서주·소패를 쥐고 멀쩡한 상태 */
  const si = SCENARIOS.findIndex(s => /군웅|반동탁/.test(s.title));
  newGame(si < 0 ? 0 : si, 0);
  const lb = st.clans.find(c => c.ruler === '유비');
  const cao = st.clans.find(c => c.ruler === '조조');
  if (!lb || !cao) err('유비 또는 조조 세력을 찾지 못했다');
  else {
    [21, 22].forEach(id => {
      st.cities[id].clan = lb.id;
      st.cities[id].troops = 20000;
    });
    ['유비', '관우', '장비'].forEach(n => {
      if (!st.gens[n]) return;
      sb.Game.removeFromCity(n);
      st.gens[n].clan = lb.id; st.gens[n].city = 22; st.cities[22].gens.push(n);
    });
    for (let k = 0; k < 40; k++) { st.month = (st.month % 12) + 1; if (st.month === 1) st.year++; Events.bookkeep(st); }
    const chain = ['sam_isan', 'gwanwoo_uitak', 'cheollihang'];
    chain.forEach(id => {
      const e = STORY_EVENTS.find(x => x.id === id);
      let ok = false; try { ok = e.cond(st); } catch (ex) { ok = false; }
      if (ok) err(`유비가 서주를 쥐고 있는데 [${e.title}] 가 발생 가능하다`);
    });

    /* 이번엔 조조가 서주·소패를 빼앗고 유비를 소패 하나로 몰아넣는다 */
    [21, 22].forEach(id => { st.cities[id].clan = cao.id; });
    st.cities[24].clan = lb.id; st.cities[24].troops = 3000;
    Object.values(st.gens).filter(g => g.clan === lb.id).forEach(g => {
      if (g.name !== '유비') { g.clan = -1; sb.Game.removeFromCity(g.name); }
    });
    sb.Game.removeFromCity('유비'); st.gens['유비'].city = 24; st.cities[24].gens = ['유비'];
    sb.Game.removeFromCity('관우'); st.gens['관우'].clan = -1; st.gens['관우'].city = 22;
    for (let k = 0; k < 3; k++) { st.month = (st.month % 12) + 1; if (st.month === 1) st.year++; Events.bookkeep(st); }
    const isan = STORY_EVENTS.find(x => x.id === 'sam_isan');
    let ok = false; try { ok = isan.cond(st); } catch (ex) { err('sam_isan.cond 예외: ' + ex.message); }
    if (!ok) err('서주가 조조에게 넘어가 유비군이 흩어졌는데도 [서주 함락] 이 서지 않는다');
    /* 이산 없이 의탁이 먼저 서면 안 된다 */
    const uitak = STORY_EVENTS.find(x => x.id === 'gwanwoo_uitak');
    let ok2 = false; try { ok2 = uitak.cond(st); } catch (ex) { ok2 = false; }
    if (ok2) err('[삼형제 이산] 을 거치지 않고 [관우 의탁] 이 서 버린다');
  }
}

/* ── 도달 가능성 : 조건을 조이다가 길을 아예 막아 버리지 않았는가 ────── */
console.log('④ 이벤트 사슬의 도달 가능성');
/* 등장 연도가 된 인물을 재야로 내보낸다 (lifecycle 의 1월 처리를 흉내낸다) */
const spawn = () => {
  Object.keys(GENERALS).forEach(nm => {
    if (st.gens[nm]) return;
    const L = LIFE[nm] || [0, 0];
    if (L[0] && L[0] > st.year) return;
    if (L[1] && L[1] < st.year) return;
    const home = S(nm)[7];
    st.gens[nm] = { name: nm, clan: -1, city: st.cities[home] ? home : 1, acted: false, loyal: 0 };
  });
};
const tick = (n) => {
  for (let k = 0; k < n; k++) {
    st.month++;
    if (st.month > 12) { st.month = 1; st.year++; spawn(); }
    Events.bookkeep(st);
  }
};
const ev = id => STORY_EVENTS.find(e => e.id === id);
const can = id => { try { return !!ev(id).cond(st) && Events.tierOk(st, ev(id)); } catch (e) { return false; } };
const must = (id, why) => { if (!can(id)) err(`[${ev(id).title}] 에 이를 길이 없다 — ${why}`); };
const put = (name, ci, cid) => {
  if (!st.gens[name]) st.gens[name] = { name, clan: -1, city: cid, acted: false, loyal: 50 };
  sb.Game.removeFromCity(name);
  st.gens[name].clan = ci; st.gens[name].city = cid;
  if (ci >= 0) st.cities[cid].gens.push(name);
};

/* (가) 관우 사슬 — 서주 함락에서 고성 재회까지 */
{
  const si = SCENARIOS.findIndex(s => /반동탁/.test(s.title));
  newGame(si < 0 ? 0 : si, 0);
  const lb = st.clans.find(c => c.ruler === '유비'), cao = st.clans.find(c => c.ruler === '조조');
  st.playerClan = lb.id;
  [21, 22].forEach(id => { st.cities[id].clan = lb.id; st.cities[id].troops = 15000; });
  ['유비', '관우', '장비'].forEach(n => put(n, lb.id, 22));
  tick(24);
  /* 조조가 서주를 삼키고 유비는 여남 한 성으로 밀려난다 */
  [21, 22].forEach(id => { st.cities[id].clan = cao.id; });
  st.cities[24].clan = lb.id; st.cities[24].troops = 2500;
  Object.values(st.gens).filter(g => g.clan === lb.id && g.name !== '유비').forEach(g => {
    g.clan = -1; sb.Game.removeFromCity(g.name);
  });
  put('유비', lb.id, 24);
  put('관우', -1, 22); st.gens['관우'].city = 22;
  put('장비', -1, 24); st.gens['장비'].city = 24;
  tick(3);
  must('sam_isan', '서주가 조조에게 넘어가고 유비군이 흩어진 판');
  st.flags['sam_isan'] = st.flags['sam_scatter'] = st.year * 12 + st.month;
  tick(2);
  must('gwanwoo_uitak', '이산 뒤 관우가 조조 군 속에 홀로 남은 판');
  /* 관우가 조조에게 가고, 유비는 다시 성을 얻는다 */
  put('관우', cao.id, 21); st.gens['관우'].loyal = 30;
  st.flags['gwanwoo_cao'] = st.year * 12 + st.month;
  tick(8);
  must('cheollihang', '관우가 조조 밑에 있고 유비가 성을 되찾은 판');
  put('관우', lb.id, 24); st.gens['관우'].loyal = 100;
  st.flags['gwanwoo_back'] = st.year * 12 + st.month;
  put('장비', lb.id, 24);
  tick(1);
  must('goseong', '관우와 장비가 한 성에서 만난 판');
}

/* (나) 와룡 사슬 — 형주의 작은 유비만이 제갈량을 얻는다 */
{
  const si = SCENARIOS.findIndex(s => /반동탁/.test(s.title));
  newGame(si < 0 ? 0 : si, 0);
  const lb = st.clans.find(c => c.ruler === '유비'), cao = st.clans.find(c => c.ruler === '조조');
  st.playerClan = lb.id;
  /* 유비는 신야 하나에 관우·장비와 함께 있고, 조조는 커졌다 */
  CITIES.forEach(c => { if (st.cities[c.id].clan === lb.id) st.cities[c.id].clan = -1; });
  st.cities[25].clan = lb.id;
  ['유비', '관우', '장비'].forEach(n => put(n, lb.id, 25));
  for (let i = 0; i < 8; i++) st.cities[CITIES[i].id].clan = cao.id;
  st.year = 201; tick(12);
  must('sugyeong', '유비가 신야에 머물고 관우·장비를 데리고 있는 판');
  st.flags['sugyeong'] = st.year * 12 + st.month;
  tick(3);
  must('seoseo_join', '수경선생을 만난 뒤');
  put('서서', lb.id, 25);
  st.flags['seoseo_in'] = st.year * 12 + st.month;
  tick(7);
  must('seoseo_leave', '서서가 여섯 달 섬기고 조조가 커진 뒤');
  put('서서', cao.id, 1);
  st.flags['jegal_ready'] = st.year * 12 + st.month;
  tick(2);
  must('samgo', '서서의 천거를 받은 뒤');
}

/* (다) 반대 방향 — 크게 자란 유비에게는 와룡이 오지 않아야 한다 */
{
  const si = SCENARIOS.findIndex(s => /반동탁/.test(s.title));
  newGame(si < 0 ? 0 : si, 0);
  const lb = st.clans.find(c => c.ruler === '유비');
  st.playerClan = lb.id;
  for (let i = 0; i < 10; i++) st.cities[CITIES[i].id].clan = lb.id;   // 하북을 삼킨 유비
  st.cities[22].clan = lb.id;
  ['유비', '관우', '장비'].forEach(n => put(n, lb.id, 22));
  st.year = 202; tick(24);
  if (can('sugyeong')) err('열 성을 가진 유비에게 수경선생이 찾아온다');
}

/* (라) 장각으로 플레이할 때 첫해에 장각이 죽어 판이 끝나지 않아야 한다 */
{
  const si = SCENARIOS.findIndex(s => /황건|장각/.test(s.title));
  if (si >= 0) {
    const ci = SCENARIOS[si].clans.findIndex(c => c[0] === '장각');
    if (ci >= 0) {
      newGame(si, ci);
      tick(12);
      if (can('janggak_death')) err('장각으로 플레이하는 첫해에 장각이 병사할 수 있다');
      /* 세력이 반 이상 깎이고 두 해가 지나면 그때는 죽어야 한다 */
      const jg = st.clans[ci];
      const own = CITIES.map(c => c.id).filter(id => st.cities[id].clan === jg.id);
      own.slice(1).forEach(id => { st.cities[id].clan = -1; });
      tick(24);
      if (!can('janggak_death')) err('두 해가 지나 세력이 무너져도 [장각의 죽음] 이 서지 않는다');
    }
  }
}

/* (마) 여포 · 공손찬 — 한때 컸다가 무너졌을 때에만 최후를 맞는다 */
[['여포', 'baekmun', 197], ['공손찬', 'yeokgyeong', 198]].forEach(([ruler, id, year]) => {
  const si = SCENARIOS.findIndex(s => s.clans.some(c => c[0] === ruler));
  if (si < 0) return;
  newGame(si, 0);
  const cl = st.clans.find(c => c.ruler === ruler);
  const cao = st.clans.find(c => c.ruler === (ruler === '여포' ? '조조' : '원소'));
  if (!cl || !cao) return;
  st.year = year - 3; tick(6);
  if (can(id)) err(`${ruler} 가 멀쩡한데 [${ev(id).title}] 가 설 수 있다`);
  /* 한때 넉 성을 쥐었다가 한 성으로 몰리고, 강적이 국경에 붙는다 */
  const near = ADJ[st.gens[ruler] ? st.gens[ruler].city : 1] || [];
  [1, 2, 3, 4].forEach(k => { if (CITIES[k]) st.cities[CITIES[k].id].clan = cl.id; });
  st.year = year; tick(12);
  const keep = CITIES.map(c => c.id).filter(x => st.cities[x].clan === cl.id)[0];
  CITIES.forEach(c => { if (st.cities[c.id].clan === cl.id && c.id !== keep) st.cities[c.id].clan = cao.id; });
  st.cities[keep].troops = 2000;
  Object.values(st.gens).filter(g => g.clan === cl.id && g.name !== ruler).slice(3)
    .forEach(g => { g.clan = -1; sb.Game.removeFromCity(g.name); });
  (ADJ[keep] || []).slice(0, 2).forEach(x => { st.cities[x].clan = cao.id; });
  for (let k = 0; k < 10; k++) st.cities[CITIES[k].id].clan = cao.id;
  st.cities[keep].clan = cl.id;
  put(ruler, cl.id, keep);
  tick(3);
  if (!can(id)) err(`${ruler} 가 한 성으로 몰렸는데도 [${ev(id).title}] 가 서지 않는다`);
});

/* ── 굴려 보기 ───────────────────────────────────────────────────── */
console.log(`⑤ 모의 진행 (시나리오 ${SCENARIOS.length}종 × ${ROUNDS}회 × 240개월)`);
const fireCount = {};
let heavyPerMonth = 0, earlyHeavy = 0, tooClose = 0, ordering = 0, gwanBad = 0;

(async () => {
  for (let si = 0; si < SCENARIOS.length; si++) {
    for (let r = 0; r < ROUNDS; r++) {
      const ci = r % SCENARIOS[si].clans.length;
      newGame(si, ci);
      const start = st.year * 12 + st.month;
      let lastT4 = -999;
      for (let mo = 0; mo < 240; mo++) {
        const before = st.hist.length;
        const t4before = lastT4;
        try { await Events.monthly(st, []); } catch (ex) {
          err(`${SCENARIOS[si].title} ${st.year}/${st.month} monthly 예외: ${ex.message}`);
          break;
        }
        /* 이번 달에 터진 사서 이벤트를 헤아린다 */
        const fresh = st.hist.slice(before).map(h => h[2]);
        const evs = fresh.map(t => STORY_EVENTS.find(e => (e.title || e.id) === t)).filter(Boolean);
        evs.forEach(e => { fireCount[e.id] = (fireCount[e.id] || 0) + 1; });
        const heavy = evs.filter(e => (e.tier || 0) >= 3);
        if (heavy.length > 1) heavyPerMonth++;
        const now = st.year * 12 + st.month;
        heavy.forEach(e => {
          const warm = Events.TIER[e.tier].warm;
          if (now - start < warm) earlyHeavy++;
          if (e.tier === 4) {
            if (now - lastT4 < Events.TIER[4].gap) tooClose++;
            lastT4 = now;
          }
        });
        /* 불변식 : 사서 이벤트로 관우가 조조에게 넘어가는 순간,
           유비는 서주권을 잃은 상태여야 하고 이산이 먼저 있었어야 한다.
           (외교의 무장 교환처럼 플레이어가 스스로 넘긴 경우는 이 검사의 대상이 아니다) */
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        if (evs.some(e => e.id === 'gwanwoo_uitak')) {
          if (!st.flags['sam_scatter']) gwanBad++;
          if (lb && [21, 22].some(id => st.cities[id].clan === lb.id)) gwanBad++;
        }
        /* 사서 경로로 조조 밑에 있는 동안 유비가 서주를 되찾았다면 그건 정상 (뒤에 천리행이 온다) */
        if (st.flags['gwanwoo_cao'] && !st.flags['sam_scatter']) gwanBad++;
        /* 불변식 : 순서 */
        if (st.flags['gwanwoo_uitak'] && !st.flags['sam_isan']) ordering++;
        if (st.flags['cheollihang'] && !st.flags['gwanwoo_uitak']) ordering++;
        if (st.flags['goseong'] && !st.flags['gwanwoo_back']) ordering++;
        if (st.gameOver) break;
        st.month++;
        if (st.month > 12) { st.month = 1; st.year++; }
        warTick();
      }
    }
  }

  if (heavyPerMonth) err(`한 달에 등급 3 이상이 두 건 이상 터진 경우 ${heavyPerMonth}회`);
  if (earlyHeavy) err(`시작 직후 유예기간 안에 판을 흔드는 사건이 터진 경우 ${earlyHeavy}회`);
  if (tooClose) err(`등급 4 사건이 최소 간격보다 촘촘히 터진 경우 ${tooClose}회`);
  if (ordering) err(`이벤트 순서가 뒤집힌 경우 ${ordering}회`);
  if (gwanBad) err(`사서 경로로 관우가 조조에게 간 조건이 어긋난 경우 ${gwanBad}회`);

  /* 참고용 — 한 번도 터지지 않는 이벤트는 조건이 지나치게 좁다는 신호 */
  const never = STORY_EVENTS.filter(e => !fireCount[e.id]);
  console.log(`   발생 확인 ${STORY_EVENTS.length - never.length}/${STORY_EVENTS.length}종`);
  if (never.length) console.log('   한 번도 발생하지 않음: ' + never.map(e => e.id).join(' '));
  const top = Object.entries(fireCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log('   가장 자주:  ' + top.map(([k, v]) => `${k}:${v}`).join('  '));

  console.log(bad ? `\n✗ 문제 ${bad}건` : '\n✓ 모든 검사 통과');
  process.exit(bad ? 1 : 0);
})();
