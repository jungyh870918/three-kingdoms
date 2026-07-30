/* =========================================================================
 *  난이도 검수 —  node tools/check-difficulty.js [시나리오당 회차] [개월]
 *
 *  실제 game.js 의 aiPhase 를 그대로 돌려, 난이도마다
 *   · 플레이어가 한 해에 몇 번 침공을 받는지
 *   · 천하 전체의 전쟁이 얼마나 일어나는지 (AI 끼리도 싸우는지)
 *   · 유예기간(grace) 안에 플레이어가 공격받지 않는지
 *  를 센다. 난이도가 순서대로 사나워지지 않으면 실패로 잡는다.
 * ========================================================================= */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ROUNDS = +(process.argv[2] || 3);
const MONTHS = +(process.argv[3] || 120);

let bad = 0;
const err = m => { console.log('  ✗ ' + m); bad++; };

const sb = { console, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error, isNaN };
sb.globalThis = sb;
vm.createContext(sb);
const load = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
const grab = e => vm.runInContext(e, sb);

/* ── 껍데기 ────────────────────────────────────────────────────────── */
let invade = 0, wars = 0, graceBreak = 0;  /* 플레이어 피침공 / 전투 / 유예 위반 */
const id = s => s;
sb.UI = {
  msg: () => {}, cmdbar: () => {}, market: () => {}, date: () => {}, face: () => {},
  cityPane: () => {}, fit: () => {}, banner: async () => {}, speech: async () => {},
  annal: async () => {}, bio: async () => {}, report: async () => {},
  anyKey: async (h) => {
    if (typeof h !== 'string' || h.indexOf('공격해 옵니다') < 0) return;
    invade++;
    /* 게임 스스로 셈하는 경과 개월로 판정한다 */
    if (Game.monthsIn() < Game.diff().grace) graceBreak++;
  },
  confirm: async () => false, menu: async () => null, table: async () => null,
  topCommand: async () => 0, pickNum: async () => null, pickCity: async () => null,
  pickGeneral: async () => null, nextInput: async () => ({ t: 'key', k: 'Escape' }),
  isCancel: () => true, isOk: () => false,
  cy: id, yl: id, gr: id, mg: id, og: id, rd: id, $: () => null,
};
sb.Render = { bind: () => {}, now: () => {} };
sb.GameMap = { draw: () => {} };
sb.Portrait = { draw: () => {}, preload: async () => {} };
/* 전투는 전력비로 즉결 판정한다 — 난이도의 '출병 빈도'만 보는 시험이다 */
sb.Battle = {
  run: async (st, o) => {
    wars++;
    const a = o.atkUnits.reduce((s, u) => s + u.troops, 0);
    const d = o.defUnits.reduce((s, u) => s + u.troops, 0);
    const win = a > d * 1.1 ? 'A' : 'D';
    const keep = u => ({ ...u, troops: Math.floor(u.troops * (win === 'A' ? 0.6 : 0.35)) });
    return {
      winner: win,
      survivors: { A: o.atkUnits.map(keep), D: o.defUnits.filter(u => u.name).map(keep) },
      dead: { A: [], D: [] }, captured: [],
    };
  },
};
/* 사서 이벤트는 끈다 — 이 시험의 관심사가 아니다 */
sb.Events = { monthly: async () => {}, aiHistory: () => {}, bookkeep: () => {}, api: {} };

load('js/data.js');
load('js/game.js');
const { Game, SCENARIOS, DIFFICULTY, CITIES } = grab('({ Game, SCENARIOS, DIFFICULTY, CITIES })');

/* ── 한 판 굴리기 ──────────────────────────────────────────────────── */
async function run(scenIdx, clanIdx, diffIdx) {
  invade = 0; wars = 0;
  const st = Game.newGame(scenIdx, clanIdx, diffIdx);
  const owner = {};
  CITIES.forEach(c => { owner[c.id] = st.cities[c.id].clan; });
  let flips = 0, lived = 0;
  for (let m = 0; m < MONTHS; m++) {
    try { await Game.aiPhase(); } catch (e) { err(`aiPhase 예외 (${SCENARIOS[scenIdx].title}): ${e.message}`); break; }
    try { await Game.endOfMonth(); } catch (e) { /* 월말 처리는 이 시험의 관심사가 아니다 */ }
    CITIES.forEach(c => {
      if (st.cities[c.id].clan !== owner[c.id]) { flips++; owner[c.id] = st.cities[c.id].clan; }
    });
    lived++;
    if (!Game.clanCities(st.playerClan).length) break;   /* 멸망하면 그만둔다 */
  }
  return { invade, flips, months: lived };
}

(async () => {
  console.log(`난이도 ${DIFFICULTY.length}종 × 시나리오 ${SCENARIOS.length}종 × ${ROUNDS}회 × ${MONTHS}개월\n`);
  const rows = [];
  for (let di = 0; di < DIFFICULTY.length; di++) {
    const D = DIFFICULTY[di];
    graceBreak = 0;
    let inv = 0, flips = 0, months = 0, wiped = 0;
    for (let si = 0; si < SCENARIOS.length; si++) {
      for (let r = 0; r < ROUNDS; r++) {
        const ci = r % SCENARIOS[si].clans.length;
        const res = await run(si, ci, di);
        inv += res.invade; flips += res.flips; months += res.months;
        if (!Game.clanCities(Game.get().playerClan).length) wiped++;
      }
    }
    const perYear = inv / (months / 12);
    rows.push({ key: D.key, perYear, flipPerYear: flips / (months / 12), wiped });
    console.log(`  ${D.key.padEnd(4)}  플레이어 피침공 ${perYear.toFixed(2)}회/년` +
      `   성 주인 교체 ${(flips / (months / 12)).toFixed(1)}회/년` +
      `   유예 위반 ${graceBreak}   멸망 ${wiped}/${SCENARIOS.length * ROUNDS}`);
    if (graceBreak) err(`${D.key}: 유예기간(${D.grace}개월) 안에 플레이어가 공격받은 경우 ${graceBreak}건`);
  }

  console.log('');
  /* 난이도가 순서대로 사나워져야 한다 */
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].perYear < rows[i - 1].perYear)
      err(`${rows[i - 1].key}(${rows[i - 1].perYear.toFixed(2)}) 보다 ` +
          `${rows[i].key}(${rows[i].perYear.toFixed(2)}) 가 덜 사납다`);
  }
  /* 세상이 멈춰서도 안 된다 — 초급에서도 AI 끼리는 싸워야 한다 */
  if (rows[0].flipPerYear < 0.5)
    err(`초급에서 성 주인 교체가 연 ${rows[0].flipPerYear.toFixed(2)}회뿐이다 (세상이 멈췄다)`);
  /* 중급에서 사방에서 몰려오면 실패 */
  const mid = rows[1];
  if (mid.perYear > 3)
    err(`중급 피침공이 연 ${mid.perYear.toFixed(2)}회로 지나치게 많다`);

  console.log(bad ? `✗ 문제 ${bad}건` : '✓ 모든 검사 통과');
  process.exit(bad ? 1 : 0);
})();
