/* =========================================================================
 *  인물 삽화 특징표
 *  이름 → 얼굴 특징. 여기 적힌 인물은 해시 대신 이 값으로 초상화를 그린다.
 *  적지 않은 인물은 지금처럼 이름 해시로 자동 생성된다.
 *
 *  skin  : red 홍안 / dark 흑면 / pale 백면 / tan 보통 / bronze 구릿빛 / sallow 누런
 *  hair  : black / brown / gray / white
 *  beard : none / mustache 팔자 / goatee 염소턱 / full 턱수염 / long 장수염 / bushy 범수염
 *  eye   : normal / fierce 부리부리 / phoenix 봉안 / ring 고리눈 / narrow 실눈 / patch 애꾸
 *  hat   : topknot 상투 / gwan 관모 / helm 투구 / silk 윤건 / warcloth 전건 /
 *          crown 왕관 / daoist 도관 / feather 남만관 / phoenixhelm 봉시투구
 *  face  : 0 둥근 / 1 긴 / 2 각진
 *  color : 모자·두건 색,  robe : 전포 색,  bg : 배경 색
 *  extra : ear 큰 귀 / fan 백우선 / scar 흉터 / young 젊은 얼굴
 * ========================================================================= */
const FACES = {
  /* ── 촉 ── */
  '유비':   { skin: 'pale', hair: 'black', beard: 'goatee', eye: 'normal', hat: 'crown',
              face: 0, color: 'gold', robe: 'gold', bg: 'blue', ear: 1 },
  '관우':   { skin: 'red', hair: 'black', beard: 'long', beardLen: 30, eye: 'phoenix',
              hat: 'warcloth', face: 1, color: 'green', robe: 'green', bg: 'green' },
  '장비':   { skin: 'dark', hair: 'black', beard: 'bushy', eye: 'ring', hat: 'helm',
              face: 2, color: 'iron', robe: 'black', bg: 'crimson' },
  '조운':   { skin: 'pale', hair: 'black', beard: 'none', eye: 'fierce', hat: 'phoenixhelm',
              face: 1, color: 'silver', robe: 'white', bg: 'teal', young: 1 },
  '제갈량': { skin: 'pale', hair: 'black', beard: 'goatee', eye: 'narrow', hat: 'silk',
              face: 1, color: 'white', robe: 'white', bg: 'teal', fan: 1 },
  '황충':   { skin: 'bronze', hair: 'white', beard: 'long', beardLen: 22, eye: 'fierce',
              hat: 'helm', face: 2, color: 'iron', robe: 'brown', bg: 'brown' },
  '마초':   { skin: 'pale', hair: 'brown', beard: 'none', eye: 'fierce', hat: 'phoenixhelm',
              face: 1, color: 'silver', robe: 'white', bg: 'blue', young: 1 },
  '강유':   { skin: 'pale', hair: 'black', beard: 'mustache', eye: 'normal', hat: 'helm',
              face: 1, color: 'silver', robe: 'blue', bg: 'teal', young: 1 },
  '위연':   { skin: 'bronze', hair: 'black', beard: 'full', eye: 'fierce', hat: 'helm',
              face: 2, color: 'iron', robe: 'crimson', bg: 'brown' },
  '방통':   { skin: 'sallow', hair: 'black', beard: 'bushy', eye: 'ring', hat: 'silk',
              face: 2, color: 'brown', robe: 'brown', bg: 'purple' },

  /* ── 위 ── */
  '조조':   { skin: 'tan', hair: 'black', beard: 'mustache', eye: 'narrow', hat: 'crown',
              face: 2, color: 'gold', robe: 'crimson', bg: 'crimson' },
  '하후돈': { skin: 'bronze', hair: 'black', beard: 'full', eye: 'patch', hat: 'helm',
              face: 2, color: 'iron', robe: 'black', bg: 'brown' },
  '사마의': { skin: 'pale', hair: 'gray', beard: 'long', beardLen: 20, eye: 'narrow',
              hat: 'gwan', face: 1, color: 'black', robe: 'purple', bg: 'purple' },
  '장료':   { skin: 'tan', hair: 'brown', beard: 'full', eye: 'fierce', hat: 'helm',
              face: 1, color: 'silver', robe: 'blue', bg: 'blue' },
  '서저':   { skin: 'bronze', hair: 'black', beard: 'bushy', eye: 'ring', hat: 'topknot',
              face: 2, color: 'brown', robe: 'brown', bg: 'brown' },
  '순욱':   { skin: 'pale', hair: 'black', beard: 'goatee', eye: 'normal', hat: 'gwan',
              face: 1, color: 'black', robe: 'white', bg: 'teal' },
  '곽가':   { skin: 'pale', hair: 'black', beard: 'none', eye: 'narrow', hat: 'silk',
              face: 1, color: 'white', robe: 'teal', bg: 'teal', young: 1 },

  /* ── 오 ── */
  '손견':   { skin: 'bronze', hair: 'black', beard: 'full', eye: 'fierce', hat: 'helm',
              face: 2, color: 'gold', robe: 'red', bg: 'red' },
  '손책':   { skin: 'pale', hair: 'black', beard: 'none', eye: 'fierce', hat: 'phoenixhelm',
              face: 1, color: 'gold', robe: 'red', bg: 'teal', young: 1 },
  '손권':   { skin: 'pale', hair: 'brown', beard: 'full', eye: 'normal', hat: 'crown',
              face: 2, color: 'gold', robe: 'purple', bg: 'purple' },
  '주유':   { skin: 'pale', hair: 'black', beard: 'mustache', eye: 'phoenix', hat: 'gwan',
              face: 1, color: 'black', robe: 'white', bg: 'blue', young: 1 },
  '여몽':   { skin: 'bronze', hair: 'black', beard: 'full', eye: 'normal', hat: 'helm',
              face: 2, color: 'iron', robe: 'teal', bg: 'teal' },
  '감녕':   { skin: 'dark', hair: 'black', beard: 'bushy', eye: 'fierce', hat: 'warcloth',
              face: 2, color: 'crimson', robe: 'crimson', bg: 'brown' },
  '육손':   { skin: 'pale', hair: 'black', beard: 'none', eye: 'narrow', hat: 'gwan',
              face: 1, color: 'black', robe: 'white', bg: 'green', young: 1 },

  /* ── 군웅 ── */
  '여포':   { skin: 'pale', hair: 'brown', beard: 'mustache', eye: 'fierce', hat: 'phoenixhelm',
              face: 2, color: 'gold', robe: 'crimson', bg: 'crimson' },
  '동탁':   { skin: 'sallow', hair: 'black', beard: 'full', eye: 'ring', hat: 'crown',
              face: 0, color: 'gold', robe: 'purple', bg: 'black', fat: 1 },
  '원소':   { skin: 'pale', hair: 'black', beard: 'long', beardLen: 18, eye: 'normal',
              hat: 'crown', face: 1, color: 'gold', robe: 'blue', bg: 'blue' },
  '장각':   { skin: 'sallow', hair: 'gray', beard: 'long', beardLen: 24, eye: 'narrow',
              hat: 'daoist', face: 1, color: 'yellow', robe: 'yellow', bg: 'black' },
  '맹획':   { skin: 'dark', hair: 'black', beard: 'bushy', eye: 'ring', hat: 'feather',
              face: 2, color: 'red', robe: 'brown', bg: 'green' },
  '사섭':   { skin: 'tan', hair: 'white', beard: 'long', beardLen: 20, eye: 'normal',
              hat: 'gwan', face: 1, color: 'black', robe: 'teal', bg: 'teal' },
  '공손찬': { skin: 'pale', hair: 'brown', beard: 'full', eye: 'fierce', hat: 'helm',
              face: 1, color: 'silver', robe: 'white', bg: 'blue' },
  '사마휘': { skin: 'pale', hair: 'white', beard: 'long', beardLen: 26, eye: 'narrow',
              hat: 'silk', face: 1, color: 'white', robe: 'white', bg: 'green' },
};
