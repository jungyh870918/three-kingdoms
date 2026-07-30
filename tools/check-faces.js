/* =========================================================================
 *  특징표 검수 —  node tools/check-faces.js
 *   ① 181명 전원 등재 여부   ② 해시 폴백 잔존 여부
 *   ③ 혈연 아닌 두 인물의 골격(headW·headH·jawWidthMul) + 이목구비 조합 동시 일치
 *   ④ 값 범위 이탈 · 오탈자(정의되지 않은 이름) 검사
 * ========================================================================= */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const sb = { console }; sb.globalThis = sb; vm.createContext(sb);
['data.js', 'faces.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sb));
const { GENERALS, FACES } = vm.runInContext('({ GENERALS, FACES })', sb);

/* 혈연·동족 — 골격을 공유해도 되는 묶음 */
const KIN = [
  ['조조', '조인', '조홍', '조휴', '조진', '조비', '조예'],
  ['하후돈', '하후연', '하후패'],
  ['사마의', '사마사', '사마소'],
  ['유비', '유선', '유봉'],
  ['관우', '관평', '관흥'], ['장비', '장포'],
  ['마등', '마초', '마대'],
  ['손견', '손책', '손권', '손유'],
  ['제갈량', '제갈근', '제갈각', '제갈탄'],
  ['육손', '육항'],
  ['원소', '원담', '원상', '원희', '원술'],
  ['공손찬', '공손탁', '공손강'],
  ['장각', '장보', '장량'],
  ['유표', '유기', '유종'], ['진등', '진규'], ['괴량', '괴월'],
];
const kinOf = n => KIN.findIndex(g => g.includes(n));

const VALID = {
  eye: ['open', 'big', 'thin', 'sharp', 'gentle', 'closed', 'smile', 'glare', 'sanpaku', 'sleepy',
        'patch', 'normal', 'fierce', 'phoenix', 'ring', 'narrow', 'droop', 'small'],
  brow: ['arch', 'flat', 'raised', 'drooped', 'thick'],
  nose: ['straight', 'hook', 'wide', 'long', 'small'],
  mouth: ['closed', 'firm', 'frown', 'open', 'smile'],
  beard: ['none', 'mustache', 'goatee', 'full', 'long', 'bushy', 'whitelong', 'whisker'],
  hat: ['topknot', 'gwan', 'helm', 'silk', 'warcloth', 'crown', 'daoist', 'feather',
        'phoenixhelm', 'wrap', 'fur', 'facehelm', 'bare'],
  shoulder: ['robe', 'scale', 'mail', 'pauldron', 'fur', 'court'],
  skin: ['red', 'dark', 'pale', 'tan', 'bronze', 'sallow'],
  hair: ['black', 'brown', 'gray', 'white'],
};
const COLORS = ['green', 'red', 'crimson', 'blue', 'teal', 'purple', 'gold', 'yellow',
                'white', 'black', 'brown', 'silver', 'iron', 'steel', 'bronze'];

let bad = 0;
const err = m => { console.log('  ✗ ' + m); bad++; };

/* ① 등재 */
const names = Object.keys(GENERALS);
const miss = names.filter(n => !FACES[n]);
const extra = Object.keys(FACES).filter(n => !GENERALS[n]);
console.log(`① 등재  무장 ${names.length} / 특징표 ${Object.keys(FACES).length}`);
if (miss.length) err('누락: ' + miss.join(' '));
if (extra.length) err('명단에 없는 항목: ' + extra.join(' '));

/* ② 해시 폴백 잔존 */
const src = fs.readFileSync(path.join(ROOT, 'js', 'portrait.js'), 'utf8');
console.log('② 해시 폴백');
if (/bit\s*\(/.test(src)) err('portrait.js 에 bit() 해시 분기가 남아 있다');
if (/hash\(name\)[\s\S]{0,200}bit/.test(src)) err('traitsOf 가 아직 해시를 쓴다');

/* ③ 값 검사 */
console.log('③ 값 범위 · 이름');
names.forEach(n => {
  const f = FACES[n]; if (!f) return;
  Object.entries(VALID).forEach(([k, list]) => {
    if (f[k] !== undefined && !list.includes(f[k])) err(`${n}.${k} = '${f[k]}' 는 정의되지 않은 이름`);
  });
  ['color', 'robe', 'bg'].forEach(k => {
    if (f[k] !== undefined && !COLORS.includes(f[k])) err(`${n}.${k} = '${f[k]}' 는 정의되지 않은 색`);
  });
  const rng = (k, lo, hi) => {
    if (f[k] !== undefined && (f[k] < lo || f[k] > hi)) err(`${n}.${k} = ${f[k]} 범위(${lo}~${hi}) 이탈`);
  };
  rng('headW', 38, 60); rng('headH', 42, 64); rng('jawWidthMul', 0.85, 1.15);
  rng('eyeSpacing', -3, 3); rng('browHeight', -2, 2); rng('cheekY', -0.04, 0.04);
  rng('yaw', -6, 6); rng('face', 0, 4); rng('jaw', 0, 2); rng('bgStyle', 0, 5);
  /* 뼈대 필드 최소 2개 명시 */
  const skel = ['headW', 'headH', 'jawWidthMul', 'eyeSpacing', 'browHeight', 'cheekY', 'noseLenOverride']
    .filter(k => f[k] !== undefined).length;
  if (skel < 2) err(`${n} 뼈대 필드가 ${skel}개뿐 (2개 이상 필요)`);
});

/* ④ 중복 */
console.log('④ 중복');
const key1 = n => { const f = FACES[n]; return [f.headW, f.headH, f.jawWidthMul].join('/'); };
const key2 = n => { const f = FACES[n]; return [f.eye, f.nose, f.mouth, f.beard, f.hat, f.face, f.jaw].join('/'); };
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const a = names[i], b = names[j];
  if (!FACES[a] || !FACES[b]) continue;
  const k = kinOf(a);
  if (k >= 0 && k === kinOf(b)) continue;                 // 혈연은 골격 공유 허용
  if (key1(a) === key1(b) && key2(a) === key2(b)) err(`${a} 와 ${b} 가 골격·이목구비 모두 일치`);
}
/* 참고용 통계 */
const cnt = f => { const m = {}; names.forEach(n => { const v = f(FACES[n]); m[v] = (m[v] || 0) + 1; }); return m; };
const top = m => Object.entries(m).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k}:${v}`).join(' ');
console.log('   눈 분포   ', top(cnt(f => f.eye)));
console.log('   관 분포   ', top(cnt(f => f.hat)));
console.log('   수염 분포 ', top(cnt(f => f.beard)));
console.log('   얼굴형    ', top(cnt(f => f.face)));
const hw = names.map(n => FACES[n].headW), hh = names.map(n => FACES[n].headH);
console.log(`   headW ${Math.min(...hw)}~${Math.max(...hw)} / headH ${Math.min(...hh)}~${Math.max(...hh)}`);

console.log(bad ? `\n✗ 문제 ${bad}건` : '\n✓ 모든 검사 통과');
process.exit(bad ? 1 : 0);
