/* =========================================================================
 *  갑작스런 종료 추적 —  node tools/check-crash.js [회차] [개월]
 *
 *  "잘 플레이되다가 갑자기 타이틀로 돌아간다" 의 원인을 찾는다.
 *  타이틀로 돌아가는 길은 Game.loop() 이 값을 돌려주는 네 가지뿐이다.
 *    'quit'  9.기능 → 타이틀로 (확인 절차 있음)
 *    'end'   st.gameOver 가 섰다
 *    'lose'  내 도시가 0이 되었다
 *    'win'   천하통일
 *  그래서 이 검수기는 매달
 *   ① endOfMonth 가 예외를 던지는지
 *   ② st.gameOver 가 언제 · 무엇 때문에 서는지
 *   ③ 도시를 가지고 있었는데 갑자기 0이 되는지 (세력 해산 버그)
 *  를 기록한다.
 *
 *  '연타 플레이어' 모드 — 사람이 메시지를 넘기려고 키를 연타하면 확인 창의
 *  기본 커서가 눌린다. UI.confirm 이 늘 '예' 를 돌려주는 상황을 흉내낸다.
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

let masher = true;                 /* 확인 창에서 늘 '예' 를 누르는 사람 */
let asked = [];                    /* 이번 달에 물어본 확인 창 */
const id = s => s;
sb.UI = {
  msg: () => {}, cmdbar: () => {}, market: () => {}, date: () => {}, face: () => {},
  cityPane: () => {}, fit: () => {}, banner: async () => {}, speech: async () => {},
  annal: async () => {}, bio: async () => {}, report: async () => {}, anyKey: async () => {},
  /* 연타하는 사람은 '미리 놓인 커서' 를 누른다.
     위험한 확인창(danger)은 커서가 '아니오' 에 있으므로 아니오가 눌린다. */
  confirm: async (p, danger) => { asked.push(String(p).replace(/<[^>]*>/g, '')); return danger ? false : masher; },
  menu: async () => null, table: async () => null, topCommand: async () => 0,
  pickNum: async () => null, pickCity: async () => null, pickGeneral: async () => null,
  nextInput: async () => ({ t: 'key', k: 'Enter' }), isCancel: () => false, isOk: () => true,
  cy: id, yl: id, gr: id, mg: id, og: id, rd: id, $: () => null, padMode: () => {},
};
sb.Render = { bind: () => {}, now: () => {} };
sb.GameMap = { draw: () => {} };
sb.Portrait = { draw: () => {}, preload: async () => {} };
sb.Battle = {
  run: async (st, o) => {
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

load('js/data.js');
load('js/game.js');
load('js/events.js');
load('js/story.js');
load('js/annals.js');
load('js/renown.js');
load('js/human.js');
const { Game, SCENARIOS, CITIES, DIFFICULTY } = grab('({ Game, SCENARIOS, CITIES, DIFFICULTY })');

/* ── 원인별 집계 ───────────────────────────────────────────────────── */
const why = {};            /* 종료 사유 → 횟수 */
const note = m => { why[m] = (why[m] || 0) + 1; };
const crashes = {};

async function run(scenIdx, clanIdx, diffIdx) {
  const st = Game.newGame(scenIdx, clanIdx, diffIdx);
  let prevList = Game.clanCities(st.playerClan);
  let prevCities = prevList.length;
  for (let m = 0; m < MONTHS; m++) {
    asked = [];
    /* 플레이어는 아무 명령도 하지 않는다 — 세상만 돌린다 */
    try { await Game.aiPhase(); } catch (e) {
      crashes['aiPhase: ' + e.message] = (crashes['aiPhase: ' + e.message] || 0) + 1;
      return 'crash';
    }
    try { await Game.endOfMonth(); } catch (e) {
      crashes['endOfMonth: ' + e.message] = (crashes['endOfMonth: ' + e.message] || 0) + 1;
      return 'crash';
    }
    const nowList = Game.clanCities(st.playerClan);
    const now = nowList.length;
    /* 불변식 : 세력이 '해산' 되어 성이 공백지로 바뀌어서는 안 된다.
       (적에게 빼앗기는 것은 정상이다 — 주인이 다른 세력으로 바뀐 것과 구별한다) */
    const vanished = prevList.filter(id => st.cities[id].clan === -1);
    if (vanished.length && now === 0) {
      const cl = st.clans[st.playerClan];
      err(`${SCENARIOS[scenIdx].title} ${st.year}/${st.month} — ${prevCities}성을 가진 세력이 해산되어 ` +
        `${vanished.length}성이 공백지가 되었다 (군주 ${cl.ruler} / 남은 장수 ${Game.clanGens(st.playerClan).length})`);
    }

    if (st.gameOver) {
      note(`gameOver='${st.gameOver}'  ← 확인창: ${asked.length ? asked.join(' | ').slice(0, 90) : '(없음)'}`);
      return 'end';
    }
    const e = Game.checkEnd();
    if (e === 'lose') {
      /* 한 달 전에는 성이 여럿이었는데 갑자기 0이면 해산 버그 냄새가 난다 */
      note(vanished.length ? `lose — 세력 해산으로 ${prevCities}성이 공백지가 되었다`
        : prevCities >= 2 ? `lose — 한 달에 ${prevCities}성을 모두 빼앗겼다` : 'lose — 마지막 성을 잃었다');
      return 'lose';
    }
    if (e === 'win') { note('win'); return 'win'; }
    prevList = nowList; prevCities = now;
  }
  return null;
}

(async () => {
  for (const mode of [true, false]) {
    masher = mode;
    Object.keys(why).forEach(k => delete why[k]);
    Object.keys(crashes).forEach(k => delete crashes[k]);
    let ended = 0, total = 0;
    for (let si = 0; si < SCENARIOS.length; si++) {
      for (let r = 0; r < ROUNDS; r++) {
        const ci = r % SCENARIOS[si].clans.length;
        const res = await run(si, ci, 1);
        total++;
        if (res) ended++;
      }
    }
    console.log(`\n■ ${mode ? '확인창을 늘 예로 누르는 사람 (키 연타)' : '확인창을 늘 아니오로 누르는 사람'}` +
      `  — ${total}판 중 ${ended}판이 끝났다`);
    Object.entries(why).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${String(v).padStart(3)}회  ${k}`));
    Object.entries(crashes).forEach(([k, v]) => err(`예외 ${v}회 — ${k}`));
  }

  console.log('');
  console.log(bad ? `✗ 문제 ${bad}건` : '✓ 예외로 죽는 길은 없다');
  process.exit(bad ? 1 : 0);
})();
