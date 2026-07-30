/* =========================================================================
 *  정사(正史) 이벤트 —  진수 「삼국지」와 배송지 주(注)의 기록에서 가져온 사건들.
 *
 *  story.js 가 연의의 명장면을 다룬다면, 이 파일은 그 반대쪽이다.
 *   · 연의에는 아예 없는 기록  (구현령 · 둔전 · 탑상책 · 제하론 · 이궁의 변 …)
 *   · 연의와 사실이 다른 기록  (적벽의 패인은 화공이 아니라 역병,
 *                              양수는 계륵 때문에 죽지 않았다,
 *                              장합은 사마의의 추격 명령에 죽었다 …)
 *  연출의 마지막 줄에 「정사」로 무엇이 다른지 적어 둔다.
 *
 *  등급 규칙은 story.js 와 같다 (events.js 의 TIER 참조).
 *  등장인물이 무장 명단(181명)에 없는 경우에는 말풍선을 띄우지 않고
 *  명단에 있는 사람의 입으로 옮기거나 소식으로만 전한다.
 * ========================================================================= */
const ANNALS_EVENTS = (() => {
  const {
    flag, setFlag, since, clanOf, isFree, alive, pc, pClan, pRuler, cities, capital,
    clanByRuler, clanGens, join, leave, S, cname, rr, rnd, clamp, scenes, grant,
    adjacentTo, anyCityOf, notify,
    mem, elapsed, startYear, clanAny, ownerOf, everHeld, peakOf, tookFrom, sinceFell,
    troopsOf, broken, declined, serves, cityOf, together, gone, captive,
    bondOf, addBond, bondsOf,
  } = Events.api;

  const up = (st, id, k, n, lo, hi) => {
    const c = st.cities[id]; if (!c) return;
    c[k] = clamp(c[k] + n, lo === undefined ? 0 : lo, hi === undefined ? 100 : hi);
  };
  const allUp = (st, ci, k, n) => cities(st, ci).forEach(id => up(st, id, k, n));
  const bump = (st, n, v) => { if (st.gens[n] && st.gens[n].clan >= 0) st.gens[n].loyal = clamp(st.gens[n].loyal + v, 0, 100); };
  const mine = (st, ci) => ci === pc(st);
  /* 「정사에서는」 쪽지 — 연의와 무엇이 다른지 (ui.js 의 annalpane) */
  const annal = (text, title) => UI.annal(text, title);
  /* 손씨 · 조씨 · 유씨 세력 찾기 (군주가 대를 이어도 이어진다) */
  const sun = st => st.clans.find(c => c.alive && ['손견', '손책', '손권', '손량', '제갈각'].includes(c.ruler));
  const wei = st => st.clans.find(c => c.alive && ['조조', '조비', '조예', '사마의', '사마사', '사마소'].includes(c.ruler));
  const shu = st => st.clans.find(c => c.alive && ['유비', '유선', '제갈량', '강유'].includes(c.ruler));

  return [

    /* ═══════════════════════════════════════════════════════════════
     *  조조 — 연의가 지운 살림꾼의 면모
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_dunjeon', title: '둔전(屯田)', tier: 2,
      /* 건안 원년(196), 조지·한호가 건의하고 임준이 크게 벌였다 */
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && st.year >= 196 && cities(st, cao.id).length >= 4;
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('둔전을 열다');
        await scenes([
          ['조조', '해마다 군을 일으키나 군량이 먼저 떨어진다.\n원술은 마름을 캐 먹었고 원소는 뽕나무 열매로 버텼다.\n먼저 배를 채우는 자가 이긴다.', '조조'],
          ['순욱', '허도 근방의 빈 땅에 백성과 병사를 함께 붙이고,\n관에서 소와 씨앗을 대어 수확을 나누는 법이 있습니다.\n첫해에 곡식 백만 곡을 얻을 것입니다.', '순욱'],
        ]);
        cities(st, cao.id).forEach(id => {
          up(st, id, 'agri', rr(6, 12));
          st.cities[id].rice += rr(6000, 16000);
        });
        if (mine(st, cao.id)) await annal('둔전은 조지·한호가 건의하고 임준이 벌인 제도로, 위가 원씨와 촉·오를 압도한 힘의 뿌리였다.\n연의는 이 대목을 거의 다루지 않는다.');
        else lines.push(`${UI.gr('조조')}가 둔전을 열어 군량을 쌓기 시작했습니다`);
      },
    },
    {
      id: 'an_guhyeon', title: '구현령 — 오직 재주만 보고 뽑는다', tier: 2,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && st.year >= 208 && cities(st, cao.id).length >= 8 && elapsed(st) >= 6;
      },
      chance: () => 0.55,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('구현령(求賢令)');
        await scenes([
          ['조조', '이윤과 부열은 노비였고 관중은 죄인이었다.\n청렴한 선비만 쓰겠다면 제 환공이 어찌 패자가 되었겠는가.',
            '조조, 영을 내리기를'],
          ['조조', `${UI.yl('오직 재주만 보고 뽑아 올려라(唯才是舉).')}\n행실에 흠이 있어도, 이름이 없어도 좋다.\n내가 그를 써서 천하를 함께 다스리겠다.`, '구현령'],
        ]);
        /* 재야의 인재가 스스로 드러난다 */
        let found = 0;
        cities(st, cao.id).forEach(id => {
          Object.values(st.gens).filter(g => g.clan === -1 && g.city === id).forEach(g => {
            if (found >= 6) return;
            g.found = true; found++;
          });
        });
        allUp(st, cao.id, 'loyal', rr(2, 5));
        if (mine(st, cao.id)) {
          await UI.anyKey(`${UI.yl(found)}명의 재야 인재가 스스로 이름을 드러냈습니다`);
          await annal('건안 15년(210)과 이후 두 차례 더 내린 영이다. 문벌을 따지지 않은 이 방침이 위의 인재층을 두껍게 했다.');
        } else lines.push(`${UI.gr('조조')}가 구현령을 내려 인재를 널리 구합니다`);
      },
    },
    {
      id: 'an_seosin', title: '원소의 서신을 태우다', tier: 1,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && flag(st, 'gwando') && since(st, 'gwando') >= 1;
      },
      chance: () => 0.8,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('열어 보지 않고 태우다');
        await scenes([
          ['순욱', '원소의 진중에서 거둔 문서입니다.\n허도와 우리 군중의 사람들이 원소와 주고받은 서신이 섞여 있습니다.\n이름을 적어 올릴까요.', '순욱'],
          ['조조', '원소가 강할 때에는 나도 내 몸을 보전할 수 있을지 몰랐다.\n하물며 남들이야.', '조조'],
          ['조조', '열지 마라. 모두 태워라.\n그리고 이 일을 다시 입에 올리는 자는 벌하겠다.', '조조'],
        ]);
        clanGens(st, cao.id).forEach(g => { g.loyal = clamp(g.loyal + rr(6, 14), 0, 100); });
        allUp(st, cao.id, 'loyal', rr(2, 5));
        if (mine(st, cao.id)) await annal('무제기의 기록이다. 이 한 번의 처사로 하북의 인심이 조조에게 기울었다.');
        else lines.push(`${UI.gr('조조')}가 원소와 통한 서신을 열지 않고 태웠다 합니다`);
      },
    },
    {
      id: 'an_jeokbyeok_yeok', title: '적벽 — 배를 태운 것은 역병이었다', tier: 2,
      cond: st => {
        const cao = clanByRuler(st, '조조'); const sn = sun(st);
        if (!cao || !sn || st.year < 208) return false;
        /* 조조가 형주 물가에 내려와 손씨와 맞닿았을 때 */
        return [26, 30, 27].some(id => ownerOf(st, id) === cao.id) && adjacentTo(st, cao.id, sn.id);
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('강 위의 역병');
        await scenes([
          ['조조', '북방의 군사는 배를 타면 멀미로 눕는다.\n뭍의 병사를 배에 매어 두라.', '조조'],
          ['조조', '군중에 병이 돌아 눕는 자가 태반이다.\n아전과 병졸이 날마다 죽어 나간다…', '조조, 강릉의 진중에서'],
        ]);
        const lost = [];
        cities(st, cao.id).filter(id => [26, 30, 27, 19, 25].includes(id)).forEach(id => {
          const c = st.cities[id];
          const n = Math.floor(c.troops * (0.18 + Math.random() * 0.14));
          c.troops -= n; lost.push(n);
          up(st, id, 'train', -rr(5, 12));
        });
        setFlag(st, 'an_yeokbyeong');
        if (mine(st, cao.id)) {
          await UI.anyKey(`역병으로 병사 ${UI.rd(lost.reduce((a, b) => a + b, 0))}명을 잃었습니다`);
          await annal('무제기는 "역병이 크게 돌아 아전과 병사가 많이 죽으니 군을 이끌고 돌아왔다"고만 적는다.\n연환계·화공·동남풍은 연의의 각색이고, 실제 패인은 전염병과 수전 미숙이었다.');
        } else lines.push(`${UI.rd('조조군')}에 역병이 돌아 강을 건너지 못했다 합니다`);
      },
    },
    {
      id: 'an_sunuk', title: '빈 그릇', tier: 4,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        if (!cao || !serves(st, '순욱', cao.id)) return false;
        return st.year >= 212 && cities(st, cao.id).length >= 14 && elapsed(st) >= 12;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('순욱의 마지막');
        await scenes([
          ['순욱', '명공께서는 본래 한실을 바로 세우고자 의병을 일으키셨습니다.\n위공(魏公)의 자리는… 그 뜻이 아니었습니다.', '순욱, 간하기를'],
          ['조조', '(말없이 음식 그릇을 하나 보냈다)', '조조의 선물'],
          ['순욱', '(뚜껑을 열자 그릇은 비어 있었다)\n스물이 되기 전에 만나 이십 년을 함께 걸었는데,\n끝은 이 빈 그릇이구나…', '순욱, 수춘에서'],
        ]);
        Game.killGen('순욱');
        allUp(st, cao.id, 'loyal', -rr(3, 8));
        clanGens(st, cao.id).forEach(g => { g.loyal = clamp(g.loyal - rr(2, 7), 0, 100); });
        Game.checkRulers();
        if (mine(st, cao.id)) await annal('순욱전은 "병으로 수춘에서 죽었다"고 적고, 배송지가 인용한 위씨춘추에 빈 그릇 이야기가 실려 있다.\n조조의 왕업을 세운 첫째 공신이 그 왕업을 반대하다 죽었다.');
        else lines.push(`${UI.rd('순욱')}이 수춘에서 죽었습니다`);
      },
    },
    {
      id: 'an_choiyeom', title: '최염의 옥사', tier: 4,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && (flag(st, 'wiwang') || st.year >= 216) && cities(st, cao.id).length >= 14 &&
          elapsed(st) >= 12;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('말 한마디의 값');
        await scenes([
          ['조조', '최염이 내 뜻을 비꼬는 글을 썼다 한다.\n머리를 숙일 줄 모르는 자다.', '조조'],
          ['순유', '최염은 사람을 알아보아 조정의 인물 절반을 그가 골랐습니다.\n말 한마디로 그를 잃으시렵니까.', '옆에서 만류하기를'],
        ]);
        allUp(st, cao.id, 'loyal', -rr(2, 6));
        clanGens(st, cao.id).filter(g => S(g.name)[2] >= 70)
          .forEach(g => { g.loyal = clamp(g.loyal - rr(5, 12), 0, 100); });
        if (mine(st, cao.id)) await annal('최염전의 기록이다. 조조는 만년에 공융·최염·양수를 차례로 죽였다.\n양수를 죽인 것도 계륵 때문이 아니라 조식 편에 섰기 때문이며, 계륵 일화 몇 달 뒤였다.');
        else lines.push(`${UI.rd('조조')}가 최염을 옥에 가두어 죽였다 합니다`);
      },
    },
    {
      id: 'an_jochung', title: '창서(倉舒)', tier: 1,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && st.year >= 206 && st.year <= 214 && cities(st, cao.id).length >= 6;
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('코끼리의 무게');
        await scenes([
          ['조조', '이 큰 코끼리의 무게를 어찌 재겠는가.\n저울이 없으니 모두 답을 못 하는구나.', '조조'],
          ['조조', '(열세 살 아들이 나서서 답했다)\n"배에 태우고 물에 잠긴 자리를 표시한 뒤,\n같은 자리까지 돌을 실어 그 돌을 재면 됩니다."', '창서 조충'],
          ['조조', '이 아이가 내 뒤를 이었으면 좋았을 것을…\n(그 아이는 스물을 넘기지 못하고 병으로 죽었다)', '조조, 뒷날 곡하며'],
        ]);
        allUp(st, cao.id, 'tech', rr(2, 5));
        clanGens(st, cao.id).forEach(g => { g.loyal = clamp(g.loyal + rr(1, 4), 0, 100); });
        if (mine(st, cao.id)) await annal('조충전의 기록이다. 조조가 가장 아꼈으나 열세 살에 죽었고, 조조는 "내 큰 불행"이라 했다.\n연의에는 나오지 않는 아들이다.');
      },
    },
    {
      id: 'an_chaeyeom', title: '흉노에서 돌아온 붓', tier: 1,
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return !!cao && st.year >= 207 && cities(st, cao.id).some(id => [12, 13, 4].includes(id));
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('금과 옥으로 데려오다');
        await scenes([
          ['조조', '채옹은 내 벗이었다. 그 딸이 흉노에 끌려가 십이 년이라 한다.\n금과 옥을 보내 반드시 데려오라.', '조조'],
          ['조조', '아비의 서책 사천 권이 전란에 흩어졌으나\n그 딸이 사백 편을 외워 적어 냈다.\n무(武)로 얻은 것보다 값지다.', '조조'],
        ]);
        cities(st, cao.id).forEach(id => { up(st, id, 'tech', rr(2, 5)); up(st, id, 'loyal', rr(1, 4)); });
        if (mine(st, cao.id)) await annal('후한서 열녀전의 채염(문희) 이야기다. 조조는 문학을 국책으로 후원했고, 스스로도 시인이었다.');
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  번성과 우금 — 항복한 장수의 여생
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_beonseong', title: '번성 — 한수가 넘치다', tier: 3,
      cond: st => {
        const cao = clanByRuler(st, '조조'); if (!cao) return false;
        const lb = shu(st); if (!lb) return false;
        if (!serves(st, '관우', lb.id) || !serves(st, '우금', cao.id)) return false;
        if (st.year < 217 || flag(st, 'an_beonseong')) return false;
        /* 관우가 형주에서 북으로 올려다보는 자리에 있어야 한다 */
        const city = cityOf(st, '관우');
        return [26, 30, 27].includes(city) && Game.ADJ[city] &&
          Game.ADJ[city].some(id => ownerOf(st, id) === cao.id);
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조'), lb = shu(st);
        await UI.banner('가을 장마');
        await scenes([
          ['관우', '열흘 비에 한수가 넘쳤다.\n뭍에 진을 친 북군은 물에 갇혔을 것이다. 배를 내라.', '관우'],
          ['우금', '물이 진지를 삼켰다.\n삼만의 군사를 물에 빠뜨릴 수는 없다… 창을 놓겠다.', '우금, 항복하며'],
          ['방덕', '나는 위왕의 장수다.\n죽어도 적의 배에는 오르지 않는다!', '방덕, 끝까지 싸우며'],
        ]);
        /* 우금은 포로가 되고 방덕은 죽는다 */
        Game.removeFromCity('우금');
        st.gens['우금'].clan = -1; st.gens['우금'].loyal = 0;
        const city = cityOf(st, '관우');
        if (st.cities[city]) st.cities[city].prisoners.push('우금');
        st.gens['우금'].city = city;
        if (alive(st, '방덕')) Game.killGen('방덕');
        setFlag(st, 'an_ugeum_hang');
        Game.checkRulers();
        if (mine(st, lb.id) || mine(st, cao.id))
          await annal('관우전·우금전의 기록이다. 관우가 물을 끌어들인 것이 아니라 때마침 큰비가 내렸다.\n우금은 삼만 군사를 살리려 항복했고, 방덕은 순사했다.');
        lines.push(`${UI.gr('관우')}가 번성에서 ${UI.yl('우금')}을 항복시키고 방덕을 베었습니다`);
      },
    },
    {
      id: 'an_ugeum', title: '능묘의 벽화', tier: 4,
      cond: st => {
        if (!flag(st, 'an_ugeum_hang') || since(st, 'an_ugeum_hang') < 12) return false;
        if (!alive(st, '우금')) return false;
        const w = wei(st); if (!w) return false;
        /* 우금이 위로 돌아와 있어야 한다 */
        return serves(st, '우금', w.id) && st.year >= 220;
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const w = wei(st);
        await UI.banner('고릉으로 보내다');
        await scenes([
          ['우금', '오를 거쳐 겨우 돌아왔습니다.\n머리는 세고 얼굴은 여위었으나, 다시 갑주를 들겠습니다.', '우금, 돌아와 절하며'],
          ['조비', '수고했다. 먼저 선왕의 능에 참배하고 오라.', '조비'],
          ['우금', '(능묘의 벽에 그림이 그려져 있었다)\n관우가 이기고, 방덕이 성내어 죽고,\n내가 무릎을 꿇는 그림이…', '우금, 벽 앞에서'],
        ]);
        Game.killGen('우금');
        clanGens(st, w.id).forEach(g => { g.loyal = clamp(g.loyal - rr(2, 6), 0, 100); });
        Game.checkRulers();
        if (mine(st, w.id)) await annal('우금전의 기록이다. 조비는 미리 그 그림을 그려 두게 했고, 우금은 부끄러움과 분함으로 병들어 죽었다.\n시호는 여(厲) — 사납다는 뜻의 낮은 시호였다.');
        else lines.push(`${UI.rd('우금')}이 부끄러움에 병들어 죽었습니다`);
      },
    },
    {
      id: 'an_janghap', title: '목문도 — 장합을 보내다', tier: 4,
      cond: st => {
        if (!alive(st, '장합')) return false;
        const sm = clanOf(st, '사마의');
        const hap = clanOf(st, '장합');
        const ko = clanOf(st, '제갈량') >= 0 ? clanOf(st, '제갈량') : clanOf(st, '강유');
        if (sm < 0 || hap < 0 || ko < 0 || sm !== hap || sm === ko) return false;
        return st.year >= 229 && adjacentTo(st, sm, ko) && elapsed(st) >= 12;
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const sm = clanOf(st, '사마의');
        await UI.banner('돌아가는 적을 쫓다');
        await scenes([
          ['사마의', '촉군이 군량이 다해 물러난다.\n장합, 뒤를 쫓아라.', '사마의'],
          ['장합', '병법에 이르되 성을 에워쌀 때는 반드시 길을 열어 두고,\n돌아가는 군은 쫓지 말라 하였습니다.\n촉의 후미는 제갈량이 손수 맡습니다.', '장합, 말리기를'],
          ['사마의', '(그래도 가라 하였다)', '사마의'],
          ['장합', '목문의 좁은 길에 복병이…\n무릎에 화살을 맞았구나.', '장합, 목문도에서'],
        ]);
        Game.killGen('장합');
        cities(st, sm).forEach(id => { up(st, id, 'train', -rr(3, 7)); });
        clanGens(st, sm).forEach(g => { g.loyal = clamp(g.loyal - rr(3, 8), 0, 100); });
        Game.checkRulers();
        if (mine(st, sm)) await annal('장합전과 위략의 기록이다. 장합은 추격을 반대했으나 사마의가 굳이 명했고, 그 길에서 죽었다.\n연의에서는 장합이 공을 탐해 스스로 뛰어든 것으로 바뀌었다.');
        else lines.push(`${UI.rd('장합')}이 목문도에서 화살에 맞아 죽었습니다`);
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  위 후기 — 제도와 토목
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_gupin', title: '구품관인법', tier: 2,
      cond: st => {
        const w = st.clans.find(c => c.alive && ['조비', '조예'].includes(c.ruler));
        return !!w && st.year >= 220 && cities(st, w.id).length >= 12 && elapsed(st) >= 6;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const w = st.clans.find(c => c.alive && ['조비', '조예'].includes(c.ruler));
        await UI.banner('사람을 아홉 등급으로 나누다');
        await scenes([
          [w.ruler, '한이 무너진 뒤 향리의 추천이 끊겼다.\n주와 군에 중정관을 두어 인물을 아홉 품으로 매기게 하라.', w.ruler],
        ]);
        cities(st, w.id).forEach(id => { up(st, id, 'tech', rr(2, 6)); up(st, id, 'loyal', rr(1, 4)); });
        clanGens(st, w.id).forEach(g => { g.loyal = clamp(g.loyal + rr(1, 4), 0, 100); });
        if (mine(st, w.id)) await annal('진군이 세운 제도다. 관리 등용의 틀을 처음으로 문서화했으나,\n뒷날 문벌이 품계를 세습하는 통로가 되어 위진남북조의 귀족제로 굳었다.');
      },
    },
    {
      id: 'an_joye_tomok', title: '허창의 궁궐', tier: 2,
      cond: st => {
        const w = clanByRuler(st, '조예');
        return !!w && st.year >= 233 && cities(st, w.id).length >= 14 && elapsed(st) >= 8;
      },
      chance: () => 0.45, repeat: true, cool: 30,
      run: async (st, lines) => {
        const w = clanByRuler(st, '조예');
        await UI.banner('토목을 일으키다');
        await scenes([
          ['조예', '낙양에 소양전을 세우고 총장관을 올려라.\n흙을 쌓아 산을 만들고 나무를 옮겨 숲을 만들라.', '조예'],
          ['사마의', '농사철에 백성 수만을 부역에 쓰면\n가을에 거둘 것이 없습니다. 부디 늦추십시오.', '간하기를'],
        ]);
        const cs = cities(st, w.id);
        cs.forEach(id => {
          st.cities[id].gold = Math.max(0, st.cities[id].gold - rr(200, 700));
          up(st, id, 'loyal', -rr(3, 8));
          up(st, id, 'agri', -rr(1, 4));
        });
        const cap = capital(st) || cs[0];
        if (cap) up(st, cap, 'wall', rr(3, 8));
        if (mine(st, w.id)) await annal('명제기와 양부·고당륭의 간언 기록이다. 조예는 안으로는 유능했으나 만년의 토목이 국력을 깎았다.\n연의는 이 시기를 거의 다루지 않는다.');
        else lines.push(`${UI.rd('조예')}가 큰 토목을 일으켜 백성이 지쳤다 합니다`);
      },
    },
    {
      id: 'an_yodong_jeongbeol', title: '요동 정벌 — 사마의의 문답', tier: 3,
      cond: st => {
        const sm = clanOf(st, '사마의'); if (sm < 0) return false;
        const gs = st.clans.find(c => c.alive && ['공손강', '공손탁'].includes(c.ruler));
        if (!gs || gs.id === sm) return false;
        return st.year >= 236 && cities(st, sm).length >= 10 && elapsed(st) >= 10;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const sm = clanOf(st, '사마의');
        const gs = st.clans.find(c => c.alive && ['공손강', '공손탁'].includes(c.ruler));
        await UI.banner('요동으로 가는 사만');
        await scenes([
          ['사마의', '(조정에서 물었다) "적이 어떻게 나올 것 같은가."', '조정의 물음'],
          ['사마의', '성을 버리고 미리 달아나면 상책,\n요수에 의지해 큰 군을 막으면 중책,\n앉아서 양평을 지키면 사로잡히는 것 — 그가 택할 것은 마지막입니다.', '사마의의 대답'],
          ['사마의', '가는 데 백 일, 치는 데 백 일, 오는 데 백 일,\n쉬는 데 육십 일. 한 해면 넉넉합니다.', '사마의, 날수를 헤아리며'],
        ]);
        /* 요동이 실제로 흔들린다 */
        const cs = cities(st, gs.id);
        cs.forEach(id => {
          st.cities[id].troops = Math.floor(st.cities[id].troops * 0.7);
          up(st, id, 'loyal', -rr(5, 12));
        });
        if (cs.length > 1) {
          const take = cs[cs.length - 1];
          Game.captureCity(sm, take, Math.floor(st.cities[take].troops * 0.6), [], [], []);
        }
        Game.checkRulers();
        bump(st, '사마의', 4);
        if (mine(st, sm)) await annal('명제기·사마의전의 기록이다. 사마의는 예고한 그대로 양평을 함락시키고 공손연을 베었다.\n이 원정의 성공이 그의 병권을 굳혔고, 뒷날 고평릉의 변으로 이어졌다.');
        else lines.push(`${UI.gr('사마의')}가 요동을 쳐 공손씨를 꺾었습니다`);
      },
    },
    {
      id: 'an_jeharon', title: '제하론 — 회남의 물길', tier: 2,
      cond: st => {
        const ci = clanOf(st, '등애'); if (ci < 0) return false;
        return st.year >= 240 && cities(st, ci).some(id => [23, 28, 24].includes(id)) && elapsed(st) >= 6;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '등애');
        await UI.banner('제하론(濟河論)');
        await scenes([
          ['등애', '싸움에 이기고도 땅을 지키지 못하는 것은 군량을 배로 옮기기 때문입니다.\n회수와 영수에 수문을 열고 둔전병 오만을 두어\n둘씩 나누어 갈고 지키게 하십시오.', '등애, 글을 올리기를'],
          ['등애', '육칠 년이면 회수 위에 삼천만 곡을 쌓을 수 있습니다.\n그때는 오를 치는 데 배를 기다릴 일이 없습니다.', '등애'],
        ]);
        cities(st, ci).filter(id => [23, 28, 24, 20, 11].includes(id)).forEach(id => {
          up(st, id, 'agri', rr(8, 15)); up(st, id, 'flood', rr(5, 12));
          st.cities[id].rice += rr(8000, 20000);
        });
        bump(st, '등애', 6);
        if (mine(st, ci)) await annal('등애전에 실린 「제하론」이다. 그는 본래 말을 더듬는 하급 관리였고, 이 글로 사마의의 눈에 들었다.\n연의의 등애는 촉을 멸한 장군일 뿐이지만, 정사의 등애는 손꼽히는 경세가였다.');
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  오 — 연의가 가장 크게 지운 쪽
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_tapsang', title: '탑상책(榻上策)', tier: 1,
      cond: st => {
        const sn = sun(st); if (!sn) return false;
        return serves(st, '노숙', sn.id) && st.year >= 200 && cities(st, sn.id).length >= 3;
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const sn = sun(st);
        await UI.banner('평상에 걸터앉아');
        await scenes([
          ['손권', '한실이 기울었으니 나는 환공·문공의 자리를 바랄 뿐이오.\n그대는 어찌 나를 도울 수 있겠소.', '손권, 술상을 물리고'],
          ['노숙', `한실은 다시 일어날 수 없고, 조조는 하루아침에 없앨 수 없습니다.\n장군께서는 강동을 굳게 지키고 천하가 갈라지는 것을 기다리십시오.`, '노숙'],
          ['노숙', `황조를 치고 유표를 삼켜 ${UI.yl('장강 전체를 차지한 뒤')},\n제(帝)를 칭하여 천하를 도모하십시오.\n이것이 제업(帝業)의 길입니다.`, '노숙, 탑상책'],
        ]);
        setFlag(st, 'an_tapsang');
        bump(st, '노숙', 10);
        allUp(st, sn.id, 'loyal', rr(2, 5));
        cities(st, sn.id).forEach(id => up(st, id, 'train', rr(2, 5)));
        if (mine(st, sn.id)) await annal('노숙전의 기록으로, 제갈량의 천하삼분보다 일곱 해 앞선다.\n연의의 노숙은 우유부단한 호인이지만, 정사의 노숙은 오의 국가전략을 처음 그린 사람이다.\n손유동맹도 그가 먼저 유비에게 건너가 맺은 것이다.');
      },
    },
    {
      id: 'an_yeomong_book', title: '사흘을 두고 다시 보라', tier: 1,
      cond: st => {
        const sn = sun(st); if (!sn) return false;
        return serves(st, '여몽', sn.id) && st.year >= 208;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const sn = sun(st);
        await UI.banner('창을 놓고 책을 들다');
        await scenes([
          ['손권', '경은 이제 큰 일을 맡았으니 배워야 하오.\n나도 정무를 보면서 사서를 읽어 얻은 것이 많소.', '손권, 권하기를'],
          ['여몽', '군무가 바빠 책 볼 틈이 없다 여겼습니다.\n오늘부터 병서와 사서를 손에서 놓지 않겠습니다.', '여몽'],
          ['노숙', '경의 오늘 이야기는 옛 오하의 아몽이 아니오!\n(선비는 사흘을 두고 다시 볼 일이오)', '노숙, 놀라며'],
        ]);
        bump(st, '여몽', 10);
        addBond(st, '여몽', '노숙', 30);
        addBond(st, '여몽', '손권', 20);
        cities(st, sn.id).forEach(id => up(st, id, 'tech', rr(1, 4)));
        if (mine(st, sn.id)) await annal('강표전의 기록이다. 「괄목상대」가 여기서 나왔다.\n연의는 여몽을 관우를 죽인 무장으로만 그리지만, 정사의 여몽은 학교를 세우고 둔전을 벌인 인물이다.');
      },
    },
    {
      id: 'an_juyu_chwichok', title: '주유의 마지막 계책', tier: 4,
      cond: st => {
        const sn = sun(st); if (!sn) return false;
        if (!serves(st, '주유', sn.id) || st.year < 209) return false;
        return cities(st, sn.id).length >= 4 && elapsed(st) >= 10;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const sn = sun(st);
        await UI.banner('파구의 병상');
        await scenes([
          ['주유', '유비는 사나운 범이고 관우·장비는 그 이빨입니다.\n형주를 빌려 주는 것은 범에게 산을 주는 일입니다.', '주유, 반대하기를'],
          ['주유', `제게 군을 주시면 ${UI.yl('익주를 취하고 장로를 삼킨 뒤')}\n마초와 손잡고 북으로 조조를 치겠습니다.\n천하를 둘로 나누는 것이 우리 길입니다.`, '주유의 이분지계'],
          ['주유', '길을 떠나 파구에 이르러 병을 얻었습니다…\n뜻은 남았으나 몸이 먼저 다하는군요.', '주유, 서른여섯에'],
        ]);
        Game.killGen('주유');
        clanGens(st, sn.id).forEach(g => { g.loyal = clamp(g.loyal - rr(4, 10), 0, 100); });
        Game.checkRulers();
        setFlag(st, 'an_juyu_dead');
        if (mine(st, sn.id)) await annal('주유전의 기록이다. 주유는 형주 대여를 끝까지 반대하고 익주 공략을 준비하다 서른여섯에 병사했다.\n연의의 "제갈량에게 속아 화병으로 죽은 주유"는 없다. 정사의 주유는 적벽의 총사령관이자 오의 대전략가였다.');
        else lines.push(`${UI.rd('주유')}가 파구에서 병으로 죽었습니다`);
      },
    },
    {
      id: 'an_seokjeong', title: '석정 — 거짓 항복', tier: 3,
      cond: st => {
        const sn = sun(st); if (!sn) return false;
        if (!serves(st, '육손', sn.id) || !alive(st, '조휴')) return false;
        const w = clanOf(st, '조휴');
        return w >= 0 && w !== sn.id && adjacentTo(st, sn.id, w) && st.year >= 226;
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const sn = sun(st);
        const w = clanOf(st, '조휴');
        await UI.banner('환성의 서신');
        await scenes([
          ['육손', '주방이 위에 거짓 항복 서신을 보내어\n조휴를 환성 깊이 끌어들이겠다 합니다. 뒤를 끊으면 됩니다.', '육손'],
          ['조휴', '오의 태수가 스스로 성을 바친다니\n이 기회에 강동을 뿌리 뽑겠다!', '조휴, 십만을 이끌고'],
          ['육손', '석정의 좁은 길이다. 세 길로 나누어 앞뒤를 함께 치라!', '육손'],
        ]);
        cities(st, w).forEach(id => {
          st.cities[id].troops = Math.floor(st.cities[id].troops * 0.82);
          up(st, id, 'train', -rr(3, 8));
        });
        cities(st, sn.id).forEach(id => { up(st, id, 'train', rr(3, 7)); st.cities[id].bows += rr(300, 900); });
        bump(st, '육손', 8);
        if (alive(st, '조휴') && Math.random() < 0.6) {
          Game.killGen('조휴');
          lines.push(`${UI.rd('조휴')}가 석정의 패전 뒤 등창으로 죽었습니다`);
        }
        Game.checkRulers();
        if (mine(st, sn.id)) await annal('육손전·주방전의 기록이다. 주방은 머리를 잘라 진심을 보이며 위를 속였다.\n조휴는 만여를 잃고 돌아가 등창으로 죽었다. 연의에는 거의 나오지 않는 오의 대승이다.');
        else lines.push(`${UI.gr('육손')}이 석정에서 위군을 크게 깨뜨렸습니다`);
      },
    },
    {
      id: 'an_sonkwon_yodong', title: '요동에 보낸 사신', tier: 4,
      cond: st => {
        const sk = clanByRuler(st, '손권'); if (!sk) return false;
        const gs = st.clans.find(c => c.alive && ['공손강', '공손탁'].includes(c.ruler));
        if (!gs || gs.id === sk.id) return false;
        return st.year >= 232 && cities(st, sk.id).length >= 6 && elapsed(st) >= 10;
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const sk = clanByRuler(st, '손권');
        const gs = st.clans.find(c => c.alive && ['공손강', '공손탁'].includes(c.ruler));
        await UI.banner('만 리 밖의 동맹');
        await scenes([
          ['손권', '요동의 공손씨가 신하를 칭하며 사신을 보내왔다.\n금과 비단, 병사 만을 딸려 답례하겠다.', '손권'],
          ['장소', '만 리 바다 밖의 사람을 어찌 믿습니까.\n그가 마음을 바꾸면 사신의 목이 위로 갈 것입니다.\n부디 거두십시오!', '장소, 격하게 말리며'],
          ['손권', '(칼자루를 잡고 노했다)\n내 뜻이 정해졌다. 다시 말하지 말라!', '손권'],
        ]);
        const cs = cities(st, sk.id);
        cs.forEach(id => {
          st.cities[id].gold = Math.max(0, st.cities[id].gold - rr(300, 900));
        });
        const cap = capital(st) || cs[0];
        if (cap) st.cities[cap].troops = Math.max(0, st.cities[cap].troops - rr(2000, 6000));
        clanGens(st, sk.id).forEach(g => { g.loyal = clamp(g.loyal - rr(3, 9), 0, 100); });
        gs.relation[sk.id] = 0; sk.relation[gs.id] = 0;
        if (mine(st, sk.id)) {
          await UI.speech('장소', '공손연이 사신의 목을 베어 위로 보냈다 합니다.\n금과 병사도 모두 빼앗겼습니다…', '장소, 뒷날');
          await annal('오주전의 기록이다. 손권은 장소의 만류를 뿌리치고 사신 장미·허안을 보냈고, 공손연은 그 목을 베어 위에 바쳤다.\n손권은 뒤에 장소의 집 앞에서 사과했다. 만년의 판단 착오가 여기서 시작한다.');
        } else lines.push(`${UI.rd('손권')}이 요동에 보낸 사신이 목을 잃었습니다`);
      },
    },
    {
      id: 'an_igung', title: '이궁의 변', tier: 4,
      cond: st => {
        const sk = clanByRuler(st, '손권'); if (!sk) return false;
        return st.year >= 242 && serves(st, '육손', sk.id) &&
          cities(st, sk.id).length >= 5 && elapsed(st) >= 12;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const sk = clanByRuler(st, '손권');
        await UI.banner('두 궁의 다툼');
        await scenes([
          ['손권', '태자 손화와 노왕 손패, 두 아이가 각기 사람을 모으고 있다는 말이 들린다.', '손권'],
          ['육손', '적자와 서자의 분수가 흐려지면 나라가 갈라집니다.\n부디 태자를 굳게 세우고 노왕을 밖으로 내보내십시오.', '육손, 표를 올리기를'],
          ['손권', '(무창으로 사신을 보내 거듭 힐책했다)\n승상이 어찌 궁중의 일에 입을 대는가.', '손권의 힐책'],
          ['육손', '이릉에서 촉의 대군을 꺾고 석정에서 위의 십만을 깨뜨렸으나,\n끝은 이 힐책이구나…', '육손, 분을 삭이지 못하고'],
        ]);
        if (alive(st, '육손')) Game.killGen('육손');
        clanGens(st, sk.id).forEach(g => { g.loyal = clamp(g.loyal - rr(6, 14), 0, 100); });
        allUp(st, sk.id, 'loyal', -rr(3, 8));
        Game.checkRulers();
        if (mine(st, sk.id)) await annal('육손전·오주전의 기록이다. 태자당과 노왕당의 당쟁으로 오의 인재가 대거 숙청되고,\n승상 육손이 힐책을 받다 분사했다. 손패는 사약을 받고 손화는 폐위됐다.\n오가 촉보다 먼저 기울기 시작한 지점이며, 연의에는 거의 없다.');
        else lines.push(`${UI.rd('오')}에서 태자를 둘러싼 당쟁으로 육손이 죽었습니다`);
      },
    },
    {
      id: 'an_jegalgak', title: '신성의 이십만', tier: 4,
      cond: st => {
        const ci = clanOf(st, '제갈각'); if (ci < 0) return false;
        const sn = st.clans[ci];
        return !!sn && sn.alive && st.year >= 252 && cities(st, ci).length >= 5 && elapsed(st) >= 10;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '제갈각');
        await UI.banner('여름의 신성');
        await scenes([
          ['제갈각', '동흥에서 위군을 깨뜨린 기세를 몰아\n이십만으로 신성을 에워싸겠다.', '제갈각'],
          ['정봉', '한여름에 성 하나를 두고 달을 넘기면\n물이 상하고 병이 돕니다. 군을 물리십시오.', '만류하기를'],
          ['제갈각', '(간하는 자를 벌하고 포위를 풀지 않았다)\n성이 곧 떨어진다. 물러설 수 없다!', '제갈각'],
        ]);
        const cs = cities(st, ci);
        cs.forEach(id => {
          st.cities[id].troops = Math.floor(st.cities[id].troops * 0.72);
          up(st, id, 'loyal', -rr(5, 12));
          up(st, id, 'train', -rr(4, 9));
        });
        clanGens(st, ci).forEach(g => { g.loyal = clamp(g.loyal - rr(8, 18), 0, 100); });
        if (alive(st, '제갈각') && Math.random() < 0.7) {
          await UI.speech('제갈각', '연회에 부른다는 전갈이 왔다…\n칼날이 상 아래에 숨어 있었구나.', '제갈각의 최후');
          Game.killGen('제갈각');
          lines.push(`${UI.rd('제갈각')}이 연회에서 주살되었습니다`);
        }
        Game.checkRulers();
        if (mine(st, ci)) await annal('제갈각전의 기록이다. 신성에서 수만을 병으로 잃고 돌아온 그는 원망을 사서 연회에서 주살됐다.\n제갈량의 조카였으나 그 신중함은 물려받지 못했다.');
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  촉 — 연의가 부풀린 쪽과 지운 쪽
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_beopjeong', title: '법정 — 서천의 지도', tier: 3,
      cond: st => {
        const lb = clanByRuler(st, '유비'); if (!lb) return false;
        if (!alive(st, '법정') || serves(st, '법정', lb.id)) return false;
        const ly = clanByRuler(st, '유장'); if (!ly) return false;
        return st.year >= 209 && cities(st, lb.id).length >= 2 && elapsed(st) >= 8 &&
          (clanOf(st, '법정') === ly.id || isFree(st, '법정'));
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const lb = clanByRuler(st, '유비');
        const cid = capital(st) || cities(st, lb.id)[0];
        await UI.banner('익주의 허실');
        await scenes([
          ['법정', '유장은 어리석고 신하들은 제 배만 채웁니다.\n장로를 막는다는 명분으로 군을 들이면 익주는 절로 열립니다.', '법정, 몰래 찾아와'],
          ['법정', '험한 길과 창고의 수, 장수의 이름까지 여기 적었습니다.\n익주는 하늘이 내린 곳간입니다.', '법정, 지도를 내밀며'],
        ]);
        join(st, '법정', lb.id, cid, 90);
        setFlag(st, 'an_beopjeong');
        cities(st, lb.id).forEach(id => up(st, id, 'train', rr(3, 7)));
        await UI.speech('법정', '이제부터 서천의 길은 제가 열겠습니다.', `${UI.yl('법정')} 합류`);
        if (mine(st, lb.id)) await annal('법정전의 기록이다. 익주 탈취와 한중 공략을 설계한 사람은 제갈량이 아니라 법정이었다.\n유비는 군사 문제에서 그를 가장 신임했고, 그가 죽자 며칠을 울었다.\n연의는 그 공을 대부분 제갈량에게 옮겼다.');
      },
    },
    {
      id: 'an_jangbi_wagu', title: '와구 — 장비, 장합을 가두다', tier: 2,
      cond: st => {
        const lb = shu(st); if (!lb) return false;
        if (!serves(st, '장비', lb.id) || !alive(st, '장합')) return false;
        const hap = clanOf(st, '장합');
        if (hap < 0 || hap === lb.id) return false;
        return st.year >= 214 && adjacentTo(st, lb.id, hap) &&
          cities(st, lb.id).some(id => [42, 41, 17, 40].includes(id));
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const lb = shu(st);
        await UI.banner('오십 리의 좁은 길');
        await scenes([
          ['장비', '장합이 산길로 들어왔다.\n앞뒤가 좁아 군이 늘어설 수 없는 곳이다.', '장비, 지형을 살피고'],
          ['장비', '내가 만 명을 데리고 다른 길로 돌아 앞을 막는다.\n저들은 산에 붙어 서로를 구하지 못할 것이다.', '장비의 계'],
          ['장합', '말을 버리고 산을 넘어 겨우 열몇 사람만 데리고 돌아왔다…', '장합, 패하여'],
        ]);
        cities(st, lb.id).forEach(id => { up(st, id, 'train', rr(3, 8)); up(st, id, 'loyal', rr(2, 5)); });
        bump(st, '장비', 8);
        const hap = clanOf(st, '장합');
        if (hap >= 0) cities(st, hap).forEach(id => { st.cities[id].troops = Math.floor(st.cities[id].troops * 0.94); });
        if (mine(st, lb.id)) await annal('장비전의 기록이다. 장비는 지형을 읽어 위의 명장 장합을 완파했다.\n정사의 장비는 사대부를 존중하고 계략을 쓰는 장수였다 — 술과 만용은 연의의 각색이다.');
        else lines.push(`${UI.gr('장비')}가 와구에서 장합을 크게 깨뜨렸습니다`);
      },
    },
    {
      id: 'an_jegal_beopchi', title: '엄하되 원망이 없다', tier: 1,
      cond: st => {
        const ci = clanOf(st, '제갈량'); if (ci < 0) return false;
        return cities(st, ci).includes(41) && st.year >= 214;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '제갈량');
        await UI.banner('촉의 법');
        await scenes([
          ['법정', '고조는 관중에 들어가 법 세 조목만 두어 인심을 얻었습니다.\n어찌 형벌을 이토록 촘촘히 하십니까.', '법정, 묻기를'],
          ['제갈량', '유장이 어두워 은혜만 베풀다 위엄이 없어졌습니다.\n촉의 병은 너그러움이지 엄함이 아닙니다.\n법을 세워 은혜를 아는 자에게 상을 주면 위와 은혜가 함께 섭니다.', '제갈량'],
        ]);
        cities(st, ci).forEach(id => { up(st, id, 'loyal', rr(3, 7)); up(st, id, 'comm', rr(1, 4)); });
        clanGens(st, ci).forEach(g => { g.loyal = clamp(g.loyal + rr(1, 4), 0, 100); });
        if (mine(st, ci)) await annal('진수는 제갈량을 "형벌이 준엄했으나 원망하는 자가 없었으니, 마음을 공평히 쓰고 권하고 벌하는 것이 분명했기 때문"이라 평했다.\n연의의 신선 같은 술법가보다, 정사의 제갈량은 법과 행정의 사람이다.');
      },
    },
    {
      id: 'an_wangpyeong', title: '가정 — 왕평의 세 번째 만류', tier: 2,
      cond: st => {
        const ci = clanOf(st, '제갈량'); if (ci < 0) return false;
        if (!serves(st, '마속', ci) || !serves(st, '왕평', ci)) return false;
        return st.year >= 226 && flag(st, 'chulsa') && cities(st, ci).includes(17) && !flag(st, 'eupcham');
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const ci = clanOf(st, '제갈량');
        await UI.banner('산에 오르다');
        await scenes([
          ['마속', '높은 곳에 진을 치면 위에서 아래를 누른다.\n병법에 그렇게 있다.', '마속'],
          ['왕평', '산 위에는 물이 없습니다.\n길목에 성을 두고 우물을 지켜야 합니다. 세 번째 말씀드립니다!', '왕평, 거듭 말리며'],
          ['마속', '(듣지 않았다)', '마속'],
          ['왕평', '장합이 물길을 끊고 사방을 태웠습니다.\n제가 천 명으로 북을 울려 추격을 막았습니다…', '왕평, 후미를 지키며'],
        ]);
        setFlag(st, 'an_gajeong');
        cities(st, ci).forEach(id => {
          st.cities[id].troops = Math.floor(st.cities[id].troops * 0.88);
          up(st, id, 'train', -rr(3, 7));
        });
        bump(st, '왕평', 10); bump(st, '마속', -20);
        if (mine(st, ci)) await annal('왕평전과 장합전의 기록이다. 왕평은 여러 번 말렸으나 마속이 듣지 않았고, 물길이 끊겨 촉군이 흩어졌다.\n왕평은 천 명으로 북을 울려 추격을 늦춰 군을 살렸고, 이 공으로 참군에 올랐다.');
        else lines.push(`${UI.rd('촉군')}이 가정에서 물길을 끊겨 크게 패했습니다`);
      },
    },
    {
      id: 'an_jourun_gigok', title: '기곡 — 스스로 후미를 맡다', tier: 1,
      cond: st => {
        const ci = clanOf(st, '제갈량'); if (ci < 0) return false;
        return serves(st, '조운', ci) && flag(st, 'chulsa') && st.year >= 226;
      },
      chance: () => 0.55,
      run: async (st, lines) => {
        const ci = clanOf(st, '제갈량');
        await UI.banner('기곡의 후미');
        await scenes([
          ['제갈량', '조운·등지는 기곡으로 나가 조진의 대군을 붙들라.\n본군은 기산으로 간다.', '제갈량'],
          ['조운', '군이 적고 적이 많으니 물러날 수밖에 없습니다.\n허나 물자는 한 수레도 버리지 않겠습니다.', '조운'],
          ['제갈량', '기곡의 군은 패했으나 잃은 것이 적다.\n조운이 몸소 뒤를 막고 물러났기 때문이다.', '제갈량, 뒷날 이르기를'],
        ]);
        cities(st, ci).forEach(id => { up(st, id, 'train', rr(2, 5)); st.cities[id].rice += rr(1000, 4000); });
        bump(st, '조운', 8);
        if (mine(st, ci)) await annal('조운전의 기록이다. 패한 싸움에서도 물자와 병력을 온전히 물린 절제가 정사 조운의 미덕이다.\n칠진칠출과 오호대장군은 연의의 설정이고, 실제로는 오래 근위·호위 성격의 자리에 있었다.');
      },
    },
    {
      id: 'an_hwanggwon', title: '황권 — 돌아갈 길이 없다', tier: 3,
      cond: st => {
        if (!flag(st, 'iryeong') || since(st, 'iryeong') < 1) return false;
        const lb = clanByRuler(st, '유비'); if (!lb) return false;
        if (!serves(st, '황권', lb.id)) return false;
        const w = wei(st);
        return !!w && adjacentTo(st, lb.id, w.id);
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const lb = clanByRuler(st, '유비'), w = wei(st);
        await UI.banner('강 북쪽의 군');
        await scenes([
          ['황권', '강 북쪽을 맡았으나 본군이 무너져 돌아갈 길이 끊겼습니다.\n오에 항복할 수는 없으니 위로 가겠습니다.', '황권'],
          ['유비', '황권이 나를 저버린 것이 아니다.\n내가 황권을 저버렸다.', '유비'],
        ]);
        const cs = cities(st, w.id);
        if (cs.length) join(st, '황권', w.id, cs[0], 40);
        clanGens(st, lb.id).forEach(g => { g.loyal = clamp(g.loyal - rr(1, 4), 0, 100); });
        if (mine(st, lb.id)) await annal('황권전의 기록이다. 유비는 그의 가족을 벌하지 않았고, 위에서도 그를 후대했다.\n촉의 패전 뒤에도 서로를 헐뜯지 않은 드문 대목이다.');
        else lines.push(`${UI.gr('황권')}이 길이 끊겨 위에 항복했습니다`);
      },
    },
    {
      id: 'an_gangyu_yeom', title: '염병취곡 — 한중의 문을 열다', tier: 2,
      cond: st => {
        const ci = clanOf(st, '강유'); if (ci < 0) return false;
        return st.year >= 255 && cities(st, ci).includes(17) && elapsed(st) >= 8;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '강유');
        await UI.banner('진을 물리다');
        await scenes([
          ['강유', '한중의 관문마다 군을 흩어 두면 힘이 모이지 않는다.\n한성과 낙성으로 군을 모으고, 적이 들어오면 들에서 꺾겠다.', '강유'],
          ['요화', '승상께서 세운 방어선을 물리는 것입니다.\n적이 관문을 지나면 다시 닫을 수 없습니다…', '만류하기를'],
        ]);
        cities(st, ci).forEach(id => {
          if (id === 17) { up(st, id, 'wall', -rr(8, 16)); st.cities[id].troops += rr(2000, 5000); }
          else up(st, id, 'train', rr(2, 5));
        });
        setFlag(st, 'an_yeombyeong');
        if (mine(st, ci)) await annal('강유전의 기록이다. 「적을 들여 꺾는다」는 이 개편이 종회의 대군에게 한중을 그대로 내주는 결과가 됐다.\n연의는 촉의 멸망을 유선의 무능으로만 돌리지만, 정사는 이 전략 변경을 함께 적는다.');
        else lines.push(`${UI.rd('강유')}가 한중의 방어선을 뒤로 물렸습니다`);
      },
    },
    {
      id: 'an_chojoo', title: '성도의 마지막 회의', tier: 4,
      cond: st => {
        const ch = clanByRuler(st, '유선'); if (!ch) return false;
        if (!cities(st, ch.id).includes(41)) return false;
        /* 성도가 실제로 위협받고, 나라가 기울었을 때 */
        const foe = st.clans.find(c => c.alive && c.id !== ch.id && adjacentTo(st, c.id, ch.id) &&
          cities(st, c.id).length >= cities(st, ch.id).length * 2);
        return !!foe && st.year >= 258 && declined(st, ch.id, 0.6) && elapsed(st) >= 12;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ch = clanByRuler(st, '유선');
        await UI.banner('남으로 갈 것인가');
        await scenes([
          ['유선', '적이 이미 검각을 넘었다 한다.\n남중으로 물러날 것인가, 오로 갈 것인가.', '유선'],
          ['강유', '검각은 아직 제 손에 있습니다.\n한 달만 버티면 적의 군량이 다합니다!', '강유의 급보'],
          ['유선', '(초주가 나서서 말했다)\n"남중의 만족은 평소 세를 물지 않으니 의지할 수 없고,\n오에 가면 오가 망할 때 또 항복해야 합니다. 지금 항복하는 것이 낫습니다."', '초주의 권고'],
        ]);
        clanGens(st, ch.id).forEach(g => { g.loyal = clamp(g.loyal - rr(8, 18), 0, 100); });
        allUp(st, ch.id, 'loyal', -rr(5, 12));
        setFlag(st, 'an_chojoo');
        if (mine(st, ch.id)) {
          if (await UI.confirm(UI.rd('초주의 말을 따라 항복하겠습니까? (게임이 끝납니다)'), true) &&
              await UI.confirm(UI.rd('정말로 항복합니까? 되돌릴 수 없습니다'), true)) {
            const foe = st.clans.find(c => c.alive && c.id !== ch.id && adjacentTo(st, c.id, ch.id));
            if (foe) { Game.surrenderTo(ch.id, foe.id); st.gameOver = 'surrender'; }
          } else {
            await UI.speech('강유', '아직 검각이 있습니다.\n한 자의 땅이 남아 있는 한 창을 놓지 않겠습니다.', '강유');
            clanGens(st, ch.id).forEach(g => { g.loyal = clamp(g.loyal + rr(10, 20), 0, 100); });
          }
          await annal('후주전과 초주전의 기록이다. 성도에는 아직 군이 있었고 강유의 주력도 온전했으나,\n조정은 싸우지 않기로 결정했다. 초주는 그 결정을 이끈 사람으로 기록됐다.');
        } else lines.push(`${UI.rd('촉')}의 조정에서 항복을 논했다 합니다`);
      },
    },
    {
      id: 'an_jangwan_biui', title: '장완과 비의 — 수성의 이십 년', tier: 1,
      cond: st => {
        const ci = clanOf(st, '장완') >= 0 ? clanOf(st, '장완') : clanOf(st, '비의');
        if (ci < 0) return false;
        return flag(st, 'ojangwon') && cities(st, ci).includes(41) && st.year >= 235;
      },
      chance: () => 0.55,
      run: async (st, lines) => {
        const ci = clanOf(st, '장완') >= 0 ? clanOf(st, '장완') : clanOf(st, '비의');
        const who = serves(st, '장완', ci) ? '장완' : '비의';
        await UI.banner('승상이 없는 조정');
        await scenes([
          [who, '승상께서 가신 뒤 나라가 흔들릴까 모두 걱정했으나,\n나는 기뻐하지도 슬퍼하지도 않고 전날과 같이 앉아 있었습니다.', who],
          [who, '북벌을 서두르지 않겠습니다.\n창고를 채우고 백성을 쉬게 하는 것이 지금의 병법입니다.', who],
        ]);
        cities(st, ci).forEach(id => {
          up(st, id, 'agri', rr(3, 7)); up(st, id, 'comm', rr(2, 6)); up(st, id, 'loyal', rr(3, 7));
          st.cities[id].rice += rr(3000, 9000);
        });
        clanGens(st, ci).forEach(g => { g.loyal = clamp(g.loyal + rr(2, 6), 0, 100); });
        bump(st, who, 8);
        if (mine(st, ci)) await annal('장완전·비의전의 기록이다. 두 사람이 이십 년을 지킨 덕에 촉은 제갈량 사후에도 무너지지 않았다.\n연의는 오장원 다음을 거의 비워 두지만, 촉이 가장 안정된 시기가 이때였다.');
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  진(晉) — 마지막 장
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'an_jonghoe', title: '성도의 두 장수', tier: 4,
      cond: st => {
        if (!alive(st, '등애') || !alive(st, '종회')) return false;
        const ci = clanOf(st, '등애');
        if (ci < 0 || clanOf(st, '종회') !== ci) return false;
        /* 촉이 이미 무너졌거나 성도가 넘어갔을 때 */
        const ch = shu(st);
        return st.year >= 260 && ownerOf(st, 41) === ci && (!ch || broken(st, ch.id)) && elapsed(st) >= 12;
      },
      chance: () => 0.55,
      run: async (st, lines) => {
        const ci = clanOf(st, '등애');
        await UI.banner('공을 다투다');
        await scenes([
          ['등애', '음평의 샛길로 먼저 성도에 든 것은 나다.\n촉의 일은 내가 다스리겠다.', '등애'],
          ['종회', '십만을 이끌고 검각을 뚫은 것은 나다.\n등애가 조서 없이 일을 처단한다고 위에 알렸다.', '종회'],
          ['강유', '(종회를 부추기며) 장군의 공이 이미 너무 큽니다.\n돌아가면 무엇이 남겠습니까…', '강유의 마지막 계책'],
        ]);
        /* 둘 다 제 손에 죽는다 — 정사의 결말 */
        if (alive(st, '등애')) Game.killGen('등애');
        if (alive(st, '종회')) Game.killGen('종회');
        if (alive(st, '강유')) Game.killGen('강유');
        cities(st, ci).forEach(id => { up(st, id, 'loyal', -rr(5, 12)); });
        clanGens(st, ci).forEach(g => { g.loyal = clamp(g.loyal - rr(4, 10), 0, 100); });
        Game.checkRulers();
        if (mine(st, ci)) await annal('등애전·종회전·강유전의 기록이다. 촉을 멸한 두 장수는 서로를 고발하다 한 달 만에 함께 죽었고,\n강유도 그 난에 죽었다. 연의는 여기까지 따라가지 않는다.');
        else lines.push(`${UI.rd('등애와 종회')}가 성도에서 서로를 죽였습니다`);
      },
    },
  ];
})();
