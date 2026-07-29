/* =========================================================================
 *  사서 이벤트 —  조건이 맞으면 제목 배너와 함께 연출이 흐른다.
 *  events.js 의 Events.api 를 빌려 쓴다. (index.html 에서 events.js 다음에 읽는다)
 * ========================================================================= */
const STORY_EVENTS = (() => {
  const {
    flag, setFlag, since, clanOf, isFree, alive, pc, pClan, pRuler, cities, capital,
    clanByRuler, clanGens, join, leave, S, cname, rr, rnd, clamp, scenes, grant,
    adjacentTo, anyCityOf, notify,
  } = Events.api;

  return [


    /* ── 와룡봉추 : 수경선생 ─────────────────────────────────────── */
    {
      id: 'sugyeong', title: '수경선생',
      cond: st => pRuler(st) === '유비' && isFree(st, '제갈량') && alive(st, '사마휘') && !flag(st, 'sugyeong'),
      chance: st => cities(st, pc(st)).some(id => [25, 26, 27, 30, 19, 18, 31, 32].includes(id)) ? 0.5 : 0.12,
      run: async st => {
        await UI.banner('수경선생');
        await UI.speech('사마휘', '길 가는 나그네가 어찌 이런 산속까지 오셨소.\n허나 좌우에 인물이 없으니 그 고생이 끝이 없을 것이오.', '수경선생 사마휘');
        await UI.speech('사마휘', `${UI.yl('복룡(伏龍)')}과 ${UI.yl('봉추(鳳雛)')},\n둘 중 하나만 얻어도 능히 천하를 안정시킬 수 있소이다.`, '수경선생 사마휘');
        await UI.speech('유비', '그 두 분은 대체 어디에 계십니까?\n부디 이름을 일러 주십시오.', '유비 묻기를');
        await UI.speech('사마휘', '좋소, 좋소. 때가 되면 스스로 문을 두드릴 것이오.\n하하하…', '수경선생 사마휘');
      },
    },

    /* ── 단복 서서, 유비를 찾다 ──────────────────────────────────── */
    {
      id: 'seoseo_join', title: '단복(單福)',
      cond: st => pRuler(st) === '유비' && since(st, 'sugyeong') >= 2 && isFree(st, '서서') && capital(st),
      chance: () => 0.45,
      run: async st => {
        const cid = capital(st);
        await UI.banner('단복이라 하옵니다');
        await UI.speech('서서', '저잣거리에서 노래를 부르던 사람입니다.\n이름은 단복이라 하옵니다. 명공의 말이 참으로 좋은 말이더군요.', '나그네');
        await UI.speech('유비', '선생께서 제 말을 알아보시니 범상한 분이 아니십니다.\n부디 저를 도와주십시오.', '유비');
        join(st, '서서', pc(st), cid, 88);
        setFlag(st, 'seoseo_in');
        await UI.speech('서서', `삼가 명을 받들겠습니다.\n${UI.gr(cname(cid))}에서 군을 정비하시지요.`, `${UI.yl('서서')} 등용`);
        st.cities[cid].train = clamp(st.cities[cid].train + 12, 0, 100);
      },
    },

    /* ── 서서, 어머니 때문에 떠나며 제갈량을 천거하다 ─────────────── */
    {
      id: 'seoseo_leave', title: '서서주마천제갈',
      cond: st => clanOf(st, '서서') === pc(st) && since(st, 'seoseo_in') >= 6 &&
        st.clans.some(c => c.alive && c.ruler === '조조') && isFree(st, '제갈량'),
      chance: () => 0.4,
      run: async st => {
        await UI.banner('서서, 말을 달려 제갈량을 천거하다');
        await UI.speech('조조', '서서의 늙은 어미를 허창으로 모셔 오라.\n그 어미의 글씨를 본떠 아들을 부르면 될 것이다.', '조조 이르기를');
        await UI.speech('서서', '어머님께서 위중하시다는 서신이 왔습니다.\n효를 저버릴 수 없으니 이 몸은 떠나야겠습니다…', '서서 울며');
        await UI.speech('유비', '선생이 가시면 나는 누구와 더불어 대사를 도모합니까.\n저 숲이 가리지 않았다면 선생의 뒷모습이라도 더 보았을 것을.', '유비');
        await UI.speech('서서', `양양 융중에 ${UI.yl('와룡 제갈공명')}이 있습니다.\n그는 관중·악의에 견줄 인물이니, 반드시 몸소 찾아가 청하십시오.\n청컨대 부르지 마시고, 찾아가십시오.`, '서서 돌아와 이르기를');
        leave(st, '서서');
        const cao = clanByRuler(st, '조조');
        if (cao) {
          const cs = cities(st, cao.id);
          if (cs.length) join(st, '서서', cao.id, cs[0], 30);
        }
        setFlag(st, 'jegal_ready');
      },
    },

    /* ── 삼고초려 ────────────────────────────────────────────────── */
    {
      id: 'samgo', title: '삼고초려',
      cond: st => pRuler(st) === '유비' && flag(st, 'jegal_ready') && isFree(st, '제갈량') && capital(st),
      chance: () => 0.6,
      run: async st => {
        const cid = capital(st);
        await UI.banner('삼고초려');
        /* 1고 */
        await UI.speech('유비', '융중으로 가자. 와룡 선생을 뵈어야겠다.', '유비');
        await UI.speech('제갈량', '(동자) 선생께서는 오늘 아침 구름을 따라 나가셨습니다.\n언제 돌아오실지는 저도 모르옵니다.', '융중의 동자');
        if (!await UI.confirm(UI.cy('눈이 내립니다. 다시 찾아가겠습니까?'))) {
          await UI.speech('장비', '겨우 촌부 하나에 형님이 어찌 이러십니까!\n밧줄로 묶어 오면 그만인 것을.', '장비');
          return;
        }
        /* 2고 */
        await UI.speech('장비', '눈보라가 이 지경인데 또 가자시니…\n형님, 사람을 보내 부르면 될 일 아닙니까!', '장비 투덜대며');
        await UI.speech('관우', '아우는 참으라. 형님의 뜻이 계실 것이다.', '관우');
        await UI.speech('제갈량', '(제갈균) 형님은 벗과 더불어 강가에 나가셨습니다.\n헛걸음을 하셨습니다그려.', '제갈균');
        if (!await UI.confirm(UI.cy('세 번째로 융중을 찾아가겠습니까?'))) return;
        /* 3고 */
        await UI.speech('유비', '선생께서 낮잠을 주무시는구나.\n깨우지 마라. 뜰에서 기다리겠다.', '유비, 섬돌 아래 서서');
        await UI.speech('제갈량', '큰 꿈을 누가 먼저 깨닫는가.\n평생을 나는 스스로 아네…  귀한 손님이 오셨는데 결례하였습니다.', '제갈량 깨어나');
        await UI.speech('제갈량',
          `조조는 백만의 무리와 천자를 끼고 있으니 다툴 수 없고,\n손권은 삼대를 강동에 웅거하니 도울 수는 있어도 뺏을 수는 없습니다.\n` +
          `${UI.yl('형주를 취해 집을 삼고 익주를 얻어 발판을 삼은 뒤')},\n천하에 변이 있거든 두 길로 군을 내십시오. 이것이 ${UI.yl('천하삼분')}입니다.`,
          '융중대(隆中對)');
        join(st, '제갈량', pc(st), cid, 100);
        setFlag(st, 'jegal_in');
        await UI.speech('유비', '내가 공명을 얻은 것은\n물고기가 물을 만난 것과 같소.', `${UI.yl('제갈량')} 등용`);
        cities(st, pc(st)).forEach(id => {
          const c = st.cities[id];
          c.loyal = clamp(c.loyal + 8, 0, 100);
          c.train = clamp(c.train + 8, 0, 100);
        });
      },
    },

    /* ── 봉추 방통 ───────────────────────────────────────────────── */
    {
      id: 'bongchu', title: '봉추 방통',
      cond: st => flag(st, 'jegal_in') && clanOf(st, '제갈량') === pc(st) && isFree(st, '방통') && capital(st),
      chance: () => 0.3,
      run: async st => {
        const cid = capital(st);
        await UI.banner('봉추, 뇌양현에 오다');
        await UI.speech('방통', '작은 고을 하나 다스리는 데 무슨 백 일이 필요하겠습니까.\n반나절이면 족합니다.', '방통');
        await UI.speech('제갈량', '사원의 재주는 저의 열 배입니다.\n부디 큰 소임을 맡기십시오.', '제갈량 천거하기를');
        join(st, '방통', pc(st), cid, 92);
        await UI.speech('방통', '와룡과 봉추가 한 지붕 아래 모였으니,\n이제 천하를 도모할 만합니다.', `${UI.yl('방통')} 등용`);
      },
    },

    /* ── 오호대장군 ──────────────────────────────────────────────── */
    {
      id: 'ohoo', title: '오호대장군',
      cond: st => pRuler(st) === '유비' && cities(st, pc(st)).includes(41) &&
        ['관우', '장비', '조운', '마초', '황충'].filter(n => clanOf(st, n) === pc(st)).length >= 4,
      chance: () => 1,
      run: async st => {
        const five = ['관우', '장비', '조운', '마초', '황충'].filter(n => clanOf(st, n) === pc(st));
        await UI.banner('오호대장군을 봉하다');
        await UI.speech('유비', `${five.join('  ')}\n다섯 장수를 오호대장군에 봉하노라.`, '한중왕의 명');
        five.forEach(n => { st.gens[n].loyal = 100; });
        cities(st, pc(st)).forEach(id => {
          st.cities[id].train = clamp(st.cities[id].train + 10, 0, 100);
        });
        await UI.speech('관우', '노졸 황충과 어찌 나란히 서겠습니까…\n허나 주공의 명이시라면 받들겠습니다.', '관우');
      },
    },

    /* ── 출사표 ──────────────────────────────────────────────────── */
    {
      id: 'chulsa', title: '출사표',
      cond: st => clanOf(st, '제갈량') === pc(st) && cities(st, pc(st)).includes(17) && st.year >= 224,
      chance: () => 0.8,
      run: async st => {
        await UI.banner('출사표');
        await UI.speech('제갈량',
          '선제께서 창업하신 뜻의 반도 이루지 못한 채 중도에 붕어하시고,\n' +
          '이제 천하는 셋으로 나뉘어 익주는 지쳐 있으니 참으로 위급한 때입니다.\n' +
          '신은 삼군을 거느리고 북으로 중원을 정하고자 하옵니다.',
          '전출사표(前出師表)');
        cities(st, pc(st)).forEach(id => {
          const c = st.cities[id];
          c.train = clamp(c.train + 12, 0, 100);
          c.loyal = clamp(c.loyal + 6, 0, 100);
        });
        await UI.speech('제갈량', '이 몸이 죽은 뒤에야 그칠 것입니다.', '제갈량');
      },
    },

    /* ── 강유 귀순 ───────────────────────────────────────────────── */
    {
      id: 'gangyu', title: '기산의 젊은 장수',
      cond: st => clanOf(st, '제갈량') === pc(st) && cities(st, pc(st)).includes(15) && alive(st, '강유') &&
        clanOf(st, '강유') !== pc(st),
      chance: () => 0.7,
      run: async st => {
        await UI.banner('강유 귀순');
        await UI.speech('강유', '천수의 강백약이오.\n승상의 계책을 미리 읽어 병을 물린 것은 나였소.', '강유');
        await UI.speech('제갈량', '내 평생의 병법을 전할 사람을 이제야 만났구나.\n어서 이리로 오시오.', '제갈량 기뻐하며');
        join(st, '강유', pc(st), cities(st, pc(st)).includes(15) ? 15 : capital(st), 95);
      },
    },

    /* ── 연환계 ──────────────────────────────────────────────────── */
    {
      id: 'yeonhwan', title: '연환계',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && clanOf(st, '여포') === d.id && st.year >= 191 && alive(st, '왕윤');
      },
      chance: () => 0.3,
      run: async st => {
        const d = clanByRuler(st, '동탁');
        await UI.banner('왕윤의 연환계');
        await UI.speech('왕윤', '초선아, 나라의 운명이 네 손에 달렸다.\n동탁과 여포 사이를 갈라놓아야 한다.', '사도 왕윤');
        await UI.speech('여포', '태사가 나의 여인을 빼앗아 갔단 말이냐!\n늙은 도적놈…', '여포 노하여');
        st.gens['여포'].loyal = clamp(st.gens['여포'].loyal - 45, 0, 100);
        setFlag(st, 'yeonhwan');
        if (d.id === pc(st)) {
          await UI.speech('이유', '여포의 눈빛이 심상치 않습니다.\n초선을 내어주고 마음을 사십시오, 주공.', '이유 간하기를');
        }
      },
    },

    /* ── 동탁 주살 ───────────────────────────────────────────────── */
    {
      id: 'dongtak_dead', title: '동탁 주살',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && d.id !== pc(st) && flag(st, 'yeonhwan') && since(st, 'yeonhwan') >= 2 &&
          clanOf(st, '여포') === d.id;
      },
      chance: () => 0.7,
      run: async st => {
        const d = clanByRuler(st, '동탁');
        await UI.banner('동탁, 여포의 창에 쓰러지다');
        await UI.speech('여포', '조서를 받들어 역적을 친다!', '여포');
        const cs = cities(st, d.id);
        Game.killGen('동탁');
        if (alive(st, '이유')) Game.killGen('이유');
        d.ruler = '여포';
        if (st.gens['여포']) st.gens['여포'].loyal = 100;
        clanGens(st, d.id).forEach(g => { if (g.name !== '여포') g.loyal = clamp(g.loyal - 20, 0, 100); });
        /* 이각·곽사는 갈라져 나간다 */
        const rebels = ['이각', '곽사'].filter(n => clanOf(st, n) === d.id);
        if (rebels.length && cs.length > 1) {
          const nid = st.clans.length;
          const city = cs[cs.length - 1];
          st.clans.push({
            id: nid, ruler: rebels[0], color: CLAN_COLORS[nid % CLAN_COLORS.length],
            isPlayer: false, alive: true, emperor: false, allies: {}, truce: {}, relation: {},
          });
          st.clans.forEach((x, i) => { if (i !== nid) { x.relation[nid] = rr(15, 35); st.clans[nid].relation[i] = rr(15, 35); } });
          /* 그 성에 있던 여포 쪽 무장은 본국으로 물러난다 */
          st.cities[city].gens.slice().forEach(n => {
            if (rebels.includes(n)) return;
            const refuge = cs.filter(x => x !== city);
            if (refuge.length) Game.moveGen(n, refuge[0]);
            else leave(st, n);
          });
          st.cities[city].clan = nid;
          rebels.forEach(n => join(st, n, nid, city, 90));
          Game.assignOfficers(city);
        }
        await UI.speech('왕윤', '역적이 죽었으니 한실이 다시 서리라!\n허나 서량의 무리가 아직 남았소…', '사도 왕윤');
      },
    },

    /* ── 헌제 옹립 ───────────────────────────────────────────────── */
    {
      id: 'cheonja', title: '천자를 받들다',
      cond: st => st.year >= 196 && [20, 12].some(id => st.cities[id].clan === pc(st)),
      chance: () => 0.5,
      run: async st => {
        await UI.banner('천자를 받들어 제후를 호령하다');
        await UI.speech(pRuler(st), '천자를 모시고 제후를 호령하니\n대의는 우리에게 있소.', '헌제 봉대');
        setFlag(st, 'cheonja');
        cities(st, pc(st)).forEach(id => {
          st.cities[id].loyal = clamp(st.cities[id].loyal + 10, 0, 100);
        });
        clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 6, 0, 100); });
      },
    },

    /* ── 관도 : 오소의 불길 ──────────────────────────────────────── */
    {
      id: 'gwando', title: '오소를 불사르다',
      cond: st => {
        const cao = clanByRuler(st, '조조'), won = clanByRuler(st, '원소');
        if (!cao || !won || st.year < 199) return false;
        if (!alive(st, '허유') || clanOf(st, '허유') !== won.id) return false;
        return cities(st, cao.id).some(a => Game.ADJ[a].some(b => st.cities[b].clan === won.id));
      },
      chance: () => 0.35,
      run: async st => {
        const cao = clanByRuler(st, '조조'), won = clanByRuler(st, '원소');
        await UI.banner('관도대전 — 오소의 군량');
        await UI.speech('허유', '내 계책을 쓰지 않으니 더는 섬길 수 없다.\n맹덕에게 가리라.', '허유');
        await UI.speech('조조', '자원이 왔는가! 신을 신을 새도 없구나.\n오소를 치면 원소는 스스로 무너진다.', '조조 맨발로 뛰어나와');
        const cs = cities(st, cao.id);
        join(st, '허유', cao.id, cs[0], 60);
        cities(st, won.id).forEach(id => {
          const c = st.cities[id];
          c.rice = Math.floor(c.rice * 0.45);
          c.train = clamp(c.train - 15, 0, 100);
        });
        if (won.id === pc(st)) {
          await UI.speech('원소', '오소가 불탔다니…\n어찌 이런 일이…', '원소 피를 토하며');
        }
      },
    },

    /* ── 적벽 ────────────────────────────────────────────────────── */
    {
      id: 'jeokbyeok', title: '적벽대전',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        if (!cao || st.year < 207) return false;
        const sun = st.clans.find(c => c.alive && ['손권', '손책', '손견'].includes(c.ruler));
        if (!sun) return false;
        return [26, 30].some(id => st.cities[id].clan === cao.id);
      },
      chance: () => 0.4,
      run: async st => {
        const cao = clanByRuler(st, '조조');
        const sun = st.clans.find(c => c.alive && ['손권', '손책', '손견'].includes(c.ruler));
        await UI.banner('적벽 — 동남풍');
        await UI.speech('조조', '강을 뒤덮은 배가 천 리에 이었으니\n강동의 아이들은 손을 묶고 항복할 것이다.', '조조 창을 비껴들고');
        await UI.speech('주유', '북군은 물에 익숙지 않아 배를 쇠사슬로 묶었소.\n불을 놓으면 한 척도 남지 않으리다.', `${sun.ruler} 군 도독 주유`);
        await UI.speech('황개', '이 늙은 몸의 살가죽으로 조조를 속이겠소.\n오늘 밤 기름 실은 배가 강을 건너갈 것이오.', '황개의 고육계');
        cities(st, cao.id).filter(id => [26, 30, 27, 25, 19, 24, 23, 28].includes(id)).forEach(id => {
          const c = st.cities[id];
          c.troops = Math.floor(c.troops * 0.42);
          c.train = clamp(c.train - 20, 0, 100);
          c.loyal = clamp(c.loyal - 8, 0, 100);
        });
        if (cao.id === pc(st)) await UI.speech('조조', '내가 곽봉효를 잃은 탓이로다…\n화용도로 길을 잡아라!', '조조 웃다 울며');
        else await UI.speech(pRuler(st), '조조의 백만 대군이 하룻밤에 재가 되었다 합니다.', '전령');
      },
    },

    /* ── 손·유 동맹 (플레이어가 손씨 또는 유비일 때) ─────────────── */
    {
      id: 'sonyu', title: '손유동맹',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        if (!cao || st.year < 207) return false;
        const me = pClan(st); if (!me) return false;
        const other = st.clans.find(c => c.alive && c.id !== me.id &&
          (['손권', '손책'].includes(c.ruler) || c.ruler === '유비'));
        if (!other) return false;
        if (me.allies[other.id]) return false;
        return cities(st, cao.id).length >= 12 &&
          (['손권', '손책', '유비'].includes(me.ruler));
      },
      chance: () => 0.5,
      run: async st => {
        const me = pClan(st);
        const other = st.clans.find(c => c.alive && c.id !== me.id &&
          (['손권', '손책'].includes(c.ruler) || c.ruler === '유비'));
        await UI.banner('손유동맹');
        await UI.speech('노숙', '조조가 형주를 삼키고 강을 내려오고 있습니다.\n한 쪽이 무너지면 다른 쪽도 없습니다.', `${other.ruler} 군의 사자`);
        if (await UI.confirm(`${UI.yl(other.ruler)}와 동맹을 맺겠습니까?`)) {
          me.allies[other.id] = 1; other.allies[me.id] = 1;
          me.truce[other.id] = 24; other.truce[me.id] = 24;
          me.relation[other.id] = 90; other.relation[me.id] = 90;
          await UI.speech('제갈량', '북군을 함께 막는다면\n천하는 셋으로 나뉠 것입니다.', '동맹 성립');
        } else {
          await UI.speech('노숙', '뒷날 후회하지 않으시겠습니까…', '사자 물러가며');
        }
      },
    },

    /* ── 적로마 ──────────────────────────────────────────────────── */
    {
      id: 'jeokro', title: '적로, 단계를 뛰다',
      cond: st => pRuler(st) === '유비' && cities(st, pc(st)).some(id => [25, 26].includes(id)) && st.year >= 200,
      chance: () => 0.25,
      run: async st => {
        await UI.banner('적로가 단계를 뛰어넘다');
        await UI.speech('유비', '적로야, 적로야!\n오늘 나를 저버리지 마라!', '단계 앞에서');
        await UI.speech('유비', '말이 세 길을 단숨에 날아 강을 건넜다.\n하늘이 아직 나를 버리지 않았구나.', '유비');
        const cs = cities(st, pc(st));
        cs.forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 5, 0, 100); });
        clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 4, 0, 100); });
      },
    },

    /* ── 칠종칠금 ────────────────────────────────────────────────── */
    {
      id: 'chiljong', title: '칠종칠금',
      cond: st => clanOf(st, '제갈량') === pc(st) && alive(st, '맹획') &&
        cities(st, pc(st)).some(id => [43, 44].includes(id)) === false &&
        cities(st, pc(st)).includes(42) && st.year >= 220,
      chance: () => 0.3,
      run: async st => {
        await UI.banner('칠종칠금');
        await UI.speech('제갈량', '남방을 치는 것은 성을 얻자는 것이 아니라\n마음을 얻자는 것입니다.', '제갈량');
        await UI.speech('맹획', '일곱 번 잡히고 일곱 번 풀려났으니\n승상의 위엄에 남인은 다시는 배반하지 않겠습니다!', '맹획 무릎 꿇고');
        const mh = clanByRuler(st, '맹획');
        if (mh) {
          Game.surrenderTo(mh.id, pc(st));
          cities(st, pc(st)).filter(id => [43, 44].includes(id))
            .forEach(id => { st.cities[id].loyal = 70; Game.assignOfficers(id); });
        }
        if (alive(st, '맹획')) join(st, '맹획', pc(st), st.gens['맹획'].city, 80);
        Game.checkRulers();
      },
    },
  
    /* ═══════════════════════════════════════════════════════════════
     *  반동탁 연합 · 동탁의 낙양
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'yeonhap', title: '반동탁 연합',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && st.year <= 192 && pc(st) !== d.id && cities(st, pc(st)).length >= 1;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const d = clanByRuler(st, '동탁');
        await UI.banner('제후, 격문을 받다');
        await scenes([
          ['조조', '동탁이 천자를 끼고 백성을 도륙하니\n의로운 제후는 모두 일어나 역적을 치자!', '조조의 격문'],
          [pRuler(st), '천하가 함께 일어서는 때다.\n우리도 군을 내어 이름을 세우자.', `${pRuler(st)} 군`],
        ]);
        st.clans.forEach(c => {
          if (!c.alive || c.id === d.id) return;
          c.relation[pc(st)] = clamp((c.relation[pc(st)] || 30) + 15, 0, 100);
          if (c.id !== pc(st)) { c.truce[pc(st)] = 8; pClan(st).truce[c.id] = 8; }
        });
        cities(st, d.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - 12, 0, 100); });
        cities(st, pc(st)).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 6, 0, 100); });
        lines.push(`제후들이 ${UI.rd('동탁 토벌')}의 맹세를 나누었습니다`);
      },
    },
    {
      id: 'hwaung', title: '사수관의 화웅',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && flag(st, 'yeonhap') && alive(st, '화웅') && st.year <= 193 && pc(st) !== d.id;
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        await UI.banner('사수관의 화웅');
        await scenes([
          ['화웅', '관문 앞에 목을 늘어놓았거늘\n감히 나설 자가 또 있느냐!', '화웅 큰소리로'],
        ]);
        if (clanOf(st, '관우') === pc(st)) {
          await scenes([
            ['관우', '이 술을 데워 두시오.\n돌아와 마시겠소.', '관우 나서며'],
            ['관우', '화웅의 목이오.\n술이 아직 식지 않았구려.', '술이 식기 전에'],
          ]);
          Game.killGen('화웅');
          clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 6, 0, 100); });
          await grant(st, '관우', '청룡언월도');
        } else {
          const mine = anyCityOf(st, pc(st));
          if (mine) st.cities[mine].troops = Math.max(0, st.cities[mine].troops - rr(800, 2500));
          await UI.speech(pRuler(st), '연합의 장수들이 잇달아 목이 떨어졌다…\n저 관문을 어찌 넘을 것인가.', '연합군의 낭패');
        }
      },
    },
    {
      id: 'samyoung', title: '호로관 삼영전여포',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && flag(st, 'yeonhap') && clanOf(st, '여포') === d.id &&
          ['유비', '관우', '장비'].filter(n => clanOf(st, n) === pc(st)).length >= 2;
      },
      chance: () => 0.7,
      run: async (st, lines) => {
        await UI.banner('세 영웅이 여포와 싸우다');
        await scenes([
          ['여포', '천하에 나를 막을 자가 있느냐!', '여포 화극을 들고'],
          ['장비', '세 성 가진 종놈아, 연인 장익덕이 여기 있다!', '장비 달려나가'],
          ['유비', '두 아우를 도우라!\n셋이 하나를 치는 것이 부끄러우나 역적을 잡는 일이다.', '유비'],
          ['여포', '오늘은 물러가겠다…\n다음에 만나면 그 목을 가져가리라.', '여포 물러나며'],
        ]);
        st.gens['여포'].loyal = clamp(st.gens['여포'].loyal - 10, 0, 100);
        clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 8, 0, 100); });
        cities(st, pc(st)).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 6, 0, 100); });
        lines.push(`${UI.gr('유비 삼형제')}의 이름이 천하에 알려졌습니다`);
      },
    },
    {
      id: 'nakyang', title: '낙양 천도',
      cond: st => {
        const d = clanByRuler(st, '동탁');
        return d && st.cities[12].clan === d.id && (flag(st, 'yeonhap') || st.year >= 191);
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const d = clanByRuler(st, '동탁');
        await UI.banner('낙양이 불타다');
        await scenes([
          ['이유', '관동의 무리가 밀려옵니다.\n장안으로 옮기시고 낙양은 태워 버리십시오.', '이유 아뢰기를'],
          ['동탁', '궁실과 민가를 모두 불살라라.\n백성은 수레에 실어 서쪽으로 몰아라!', '동탁'],
        ]);
        const c = st.cities[12];
        c.pop = Math.floor(c.pop * 0.45);
        c.gold = Math.floor(c.gold * 0.3);
        c.rice = Math.floor(c.rice * 0.3);
        c.loyal = clamp(c.loyal - 30, 0, 100);
        c.comm = clamp(c.comm - 25, 0, 100);
        if (st.cities[13].clan === d.id) {
          st.cities[13].gold += Math.floor(c.gold * 0.6) + 3000;
          st.cities[13].pop += 40000;
        }
        setFlag(st, 'nakyang_fire');
        lines.push(`${UI.rd('낙양이 불타고')} 도읍이 장안으로 옮겨졌습니다`);
      },
    },
    {
      id: 'oksae', title: '전국옥새',
      cond: st => flag(st, 'nakyang_fire') && st.cities[12].clan >= 0 &&
        !Object.values(st.gens).some(g => (g.items || []).includes('전국옥새')),
      chance: () => 0.6,
      run: async (st, lines) => {
        const owner = st.cities[12].clan;
        const cl = st.clans[owner];
        const finder = st.cities[12].governor || cl.ruler;
        await UI.banner('우물 속의 옥새');
        if (owner === pc(st)) {
          await scenes([
            [finder, '불탄 궁터의 우물에서 오색 빛이 올라옵니다.\n건져 보니 여인의 시신과 함께 상자가 있었습니다.', '낙양의 우물'],
            [cl.ruler, `「수명어천 기수영창」…\n${UI.yl('전국옥새')}로구나. 하늘의 뜻인가.`, '옥새를 손에 넣다'],
          ]);
        } else {
          lines.push(`${UI.gr(cl.ruler)}가 낙양의 우물에서 ${UI.yl('전국옥새')}를 얻었다는 소문이 돕니다`);
        }
        await grant(st, cl.ruler, '전국옥새', owner !== pc(st));
        cities(st, owner).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 6, 0, 100); });
        st.clans.forEach(c => { if (c.alive && c.id !== owner) c.relation[owner] = clamp((c.relation[owner] || 30) - 10, 0, 100); });
      },
    },
    {
      id: 'igak', title: '이각·곽사의 난',
      cond: st => flag(st, 'dongtak_dead') && since(st, 'dongtak_dead') >= 2 && alive(st, '왕윤'),
      chance: () => 0.7,
      run: async (st, lines) => {
        await UI.banner('장안의 피');
        await scenes([
          ['가후', '흩어지면 정장 하나에게도 잡힙니다.\n차라리 장안을 치는 것이 낫습니다.', '가후 이르기를'],
          ['왕윤', '역적을 없애고 한실을 세우려 했더니…\n하늘이 한을 버리시는가!', '왕윤 성루에서'],
        ]);
        Game.killGen('왕윤');
        const cs = [13, 12].filter(id => st.cities[id].clan >= 0);
        cs.forEach(id => {
          const c = st.cities[id];
          c.loyal = clamp(c.loyal - 22, 0, 100);
          c.pop = Math.floor(c.pop * 0.85);
          c.gold = Math.floor(c.gold * 0.6);
        });
        setFlag(st, 'igak_nan');
        lines.push(`${UI.rd('이각과 곽사')}가 장안을 짓밟았습니다`);
      },
    },
    {
      id: 'heonje', title: '헌제, 동쪽으로',
      cond: st => flag(st, 'igak_nan') && since(st, 'igak_nan') >= 3 && !flag(st, 'cheonja') &&
        [12, 20, 11, 7].some(id => st.cities[id].clan === pc(st)),
      chance: () => 0.6,
      run: async (st, lines) => {
        await UI.banner('천자가 동쪽으로 달아나다');
        await scenes([
          ['가후', '천자께서 낡은 수레를 타고 동쪽으로 달아나고 있습니다.\n뒤를 쫓는 서량군이 코앞입니다.', '급보'],
        ]);
        if (await UI.confirm(UI.yl('군을 내어 천자를 맞이하겠습니까? (금 1000)'))) {
          const cid = capital(st);
          if (cid && st.cities[cid].gold >= 1000) {
            st.cities[cid].gold -= 1000;
            setFlag(st, 'cheonja');
            cities(st, pc(st)).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 12, 0, 100); });
            clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 8, 0, 100); });
            await UI.speech(pRuler(st), '천자를 모시고 제후를 호령하니\n대의는 우리에게 있다!', '천자 봉대');
          } else await UI.anyKey(UI.rd('금이 모자라 뜻을 이루지 못했습니다'));
        } else {
          await UI.speech(pRuler(st), '헛된 이름에 매일 것 없다.\n실속을 챙기자.', pRuler(st));
        }
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  여포와 서주
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'wonmun', title: '원문사극',
      cond: st => {
        const y = clanByRuler(st, '여포'), w = clanByRuler(st, '원술'), l = clanByRuler(st, '유비');
        return y && w && l && adjacentTo(st, y.id, l.id) && [y.id, w.id, l.id].includes(pc(st));
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const y = clanByRuler(st, '여포'), w = clanByRuler(st, '원술'), l = clanByRuler(st, '유비');
        await UI.banner('원문사극');
        await scenes([
          ['여포', '두 집안이 싸우는 것을 내 어찌 보고만 있겠소.\n저 화극의 곁가지를 맞히면 화해하시오.', '여포 활을 들고'],
          ['여포', '백오십 보… 맞았다!\n하늘의 뜻이니 두 분은 창을 거두시오.', '적중'],
        ]);
        w.truce[l.id] = 10; l.truce[w.id] = 10;
        w.relation[y.id] = clamp((w.relation[y.id] || 30) + 10, 0, 100);
        l.relation[y.id] = clamp((l.relation[y.id] || 30) + 10, 0, 100);
        await grant(st, '여포', '방천화극', y.id !== pc(st));
        lines.push(`${UI.gr('여포')}의 활 솜씨에 두 집안이 창을 거두었습니다`);
      },
    },
    {
      id: 'baekmun', title: '백문루',
      cond: st => {
        const y = clanByRuler(st, '여포');
        return y && cities(st, y.id).length <= 1 && st.clans.some(c => c.alive && c.ruler === '조조' && adjacentTo(st, c.id, y.id));
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const y = clanByRuler(st, '여포'), cao = clanByRuler(st, '조조');
        await UI.banner('백문루');
        await scenes([
          ['여포', '나를 살려 준다면 천하는 어렵지 않소.\n공은 보병을 맡고 나는 기병을 맡으면 되오.', '여포 결박당해'],
          ['유비', '공은 정원과 동탁의 일을 잊으셨소?', '유비 한마디'],
          ['조조', '…끌어내어라.', '조조'],
          ['진궁', '살기를 구걸하지 않겠소.\n어서 목을 치시오.', '진궁 형장으로'],
        ]);
        ['여포', '진궁', '고순'].forEach(n => { if (alive(st, n) && clanOf(st, n) === y.id) Game.killGen(n); });
        if (alive(st, '장료') && cao) {
          const cs = cities(st, cao.id);
          if (cs.length) { join(st, '장료', cao.id, cs[0], 75); }
          lines.push(`${UI.gr('장료')}가 조조에게 항복했습니다`);
        }
        if (cao) Game.surrenderTo(y.id, cao.id);
        else y.alive = false;
        if (alive(st, '관우')) await grant(st, '관우', '적토마', clanOf(st, '관우') !== pc(st));
        Game.checkRulers();
      },
    },
    {
      id: 'cheongmae', title: '청매자주론영웅',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return cao && pRuler(st) === '유비' && cities(st, pc(st)).length <= 2 &&
          (adjacentTo(st, cao.id, pc(st)) || pClan(st).truce[cao.id]);
      },
      chance: () => 0.35,
      run: async (st, lines) => {
        await UI.banner('청매자주로 영웅을 논하다');
        await scenes([
          ['조조', '매실이 익었으니 술을 데워 한잔합시다.\n지금 천하의 영웅은 누구라 보시오?', '조조 젓가락을 들고'],
          ['유비', '원술은 무덤 속의 마른 뼈요,\n원소는 겉만 사나울 뿐입니다. 유표, 손책, 유장…', '유비'],
          ['조조', '천하의 영웅은 사군과 이 조조뿐이오.', '조조 손가락으로 가리키며'],
          ['유비', '(우레가 치자 젓가락을 떨어뜨리며)\n천둥 소리에 놀랐습니다. 부끄럽습니다.', '유비 몸을 숙여'],
        ]);
        const cao = clanByRuler(st, '조조');
        cao.relation[pc(st)] = clamp((cao.relation[pc(st)] || 30) + 20, 0, 100);
        pClan(st).truce[cao.id] = 8; cao.truce[pc(st)] = 8;
        clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 5, 0, 100); });
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  조조
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'seoju_bok', title: '서주의 원한',
      cond: st => {
        const cao = clanByRuler(st, '조조'), do_ = clanByRuler(st, '도겸');
        return cao && do_ && adjacentTo(st, cao.id, do_.id) && st.year >= 193;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조'), do_ = clanByRuler(st, '도겸');
        await UI.banner('서주의 원한');
        await scenes([
          ['조조', '아버님이 서주 땅에서 해를 입으셨다.\n성을 도륙하여 그 원한을 갚으리라!', '조조 상복을 입고'],
          ['도겸', '노부의 죄가 아니거늘…\n백성이 무슨 잘못이란 말인가.', '도겸 성 위에서'],
        ]);
        cities(st, do_.id).forEach(id => {
          const c = st.cities[id];
          c.pop = Math.floor(c.pop * 0.8);
          c.loyal = clamp(c.loyal - 15, 0, 100);
        });
        st.clans.forEach(c => { if (c.alive && c.id !== cao.id) c.relation[cao.id] = clamp((c.relation[cao.id] || 30) - 12, 0, 100); });
        cao.relation[do_.id] = 0;
        delete cao.truce[do_.id];
        lines.push(`${UI.rd('조조')}가 서주를 짓밟았습니다`);
      },
    },
    {
      id: 'wanseong', title: '완성의 밤',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return cao && cities(st, cao.id).includes(19) && alive(st, '전위') && st.year >= 196;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('완성의 밤');
        await scenes([
          ['조조', '항복한 성이니 술이나 한잔하자.', '조조 방심하여'],
          ['전위', '주공, 어서 말에 오르십시오!\n제가 문을 막겠습니다!', '전위 쌍철극을 들고'],
          ['조조', '전위가… 전위가 죽었다는 말이냐.\n내 아들과 조카를 잃은 것보다 아프구나!', '조조 통곡하며'],
        ]);
        Game.killGen('전위');
        const c = st.cities[19];
        c.troops = Math.floor(c.troops * 0.6);
        c.train = clamp(c.train - 15, 0, 100);
        if (cao.id === pc(st)) await grant(st, '조조', '절영');
        lines.push(`완성에서 ${UI.rd('전위')}가 조조를 구하고 전사했습니다`);
      },
    },
    {
      id: 'dongjak', title: '동작대',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return cao && cities(st, cao.id).length >= 14 && st.year >= 208 && cities(st, cao.id).includes(7);
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('동작대가 서다');
        const c = st.cities[7];
        if (cao.id === pc(st) && c.gold < 4000) { lines.push('업의 금이 모자라 동작대를 세우지 못했습니다'); return; }
        c.gold = Math.max(0, c.gold - 4000);
        await scenes([
          ['조조', '장하의 물가에 대를 세우고\n천하의 문사를 불러 시를 짓게 하라.', '동작대'],
          ['조조', '달 밝고 별 성긴데 까막까치 남으로 나네…\n주공근이 살아 있다면 이 노래를 들었으랴.', '단가행'],
        ]);
        cities(st, cao.id).forEach(id => {
          st.cities[id].loyal = clamp(st.cities[id].loyal + 8, 0, 100);
          st.cities[id].comm = clamp(st.cities[id].comm + 4, 0, 100);
        });
        if (cao.id === pc(st)) await grant(st, '조조', '맹덕신서');
        lines.push(`업에 ${UI.yl('동작대')}가 세워졌습니다`);
      },
    },
    {
      id: 'wiwang', title: '위왕 즉위',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return cao && cities(st, cao.id).length >= 18 && st.year >= 212 && flag(st, 'cheonja');
      },
      chance: () => 0.7,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('위왕에 오르다');
        if (alive(st, '순욱') && clanOf(st, '순욱') === cao.id) {
          await scenes([
            ['순욱', '본디 의로운 군사를 일으켜 한실을 바로 세우자 하셨습니다.\n왕을 칭하는 것은 옳지 않습니다.', '순욱 간하기를'],
            ['조조', '…빈 찬합을 보내라.', '조조 낯빛을 굳히며'],
          ]);
          Game.killGen('순욱');
          lines.push(`${UI.rd('순욱')}이 빈 찬합을 받고 스스로 목숨을 끊었습니다`);
        }
        cao.emperor = true;
        cities(st, cao.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 5, 0, 100); });
        clanGens(st, cao.id).forEach(g => { g.loyal = clamp(g.loyal + 6, 0, 100); });
        st.clans.forEach(c => { if (c.alive && c.id !== cao.id) c.relation[cao.id] = clamp((c.relation[cao.id] || 30) - 12, 0, 100); });
        lines.push(`${UI.gr('조조')}가 ${UI.yl('위왕')}에 올랐습니다`);
      },
    },
    {
      id: 'hwata', title: '화타',
      cond: st => {
        const cao = clanByRuler(st, '조조');
        return cao && st.year >= 207 && alive(st, '조조');
      },
      chance: () => 0.35,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조');
        await UI.banner('신의 화타');
        await scenes([
          ['조조', '두통이 갈수록 심하다.\n천하의 명의를 찾아오라.', '조조 머리를 싸매고'],
          ['화타', '바람이 뇌 속에 들었습니다.\n도끼로 머리를 열어 뿌리를 없애야 합니다.', '화타 진맥하고'],
        ]);
        let believe = cao.id === pc(st)
          ? await UI.confirm(UI.yl('화타의 말을 믿고 치료를 맡기겠습니까?'))
          : Math.random() < 0.3;
        if (believe) {
          st.lifeMod = st.lifeMod || {};
          st.lifeMod['조조'] = (st.lifeMod['조조'] || 0) + 6;
          await UI.speech('화타', '두풍의 뿌리를 걷어냈습니다.\n몸을 아끼시면 수를 더 누리실 것입니다.', '치료 성공');
          if (cao.id === pc(st)) await grant(st, st.cities[capital(st) || 1].governor || '조조', '청낭서');
          lines.push(`${UI.gr('조조')}의 두풍이 나았습니다`);
        } else {
          await scenes([
            ['조조', '머리를 열자니, 나를 죽이려는 수작이 아니냐!\n옥에 가두어라.', '조조 노하여'],
            ['화타', '평생의 의술을 적은 「청낭서」가\n이대로 재가 되는구나…', '화타 옥중에서'],
          ]);
          if (alive(st, '화타')) Game.killGen('화타');
          lines.push(`${UI.rd('화타')}가 옥에서 죽고 청낭서가 불탔습니다`);
        }
      },
    },
    {
      id: 'yodong_head', title: '요동의 선물',
      cond: st => {
        const cao = clanByRuler(st, '조조'), gs = clanByRuler(st, '공손강');
        return cao && gs && st.year >= 206 && ['원상', '원희'].some(n => alive(st, n));
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const cao = clanByRuler(st, '조조'), gs = clanByRuler(st, '공손강');
        await UI.banner('요동에서 온 상자');
        await scenes([
          ['곽가', '급히 치면 그들이 손을 잡고,\n두면 서로를 죽입니다. 기다리십시오.', '곽가의 마지막 계책'],
          ['공손강', '원씨 형제를 살려 두면 화가 요동에 미친다.\n목을 베어 허창으로 보내라.', '공손강'],
        ]);
        ['원상', '원희'].forEach(n => { if (alive(st, n)) Game.killGen(n); });
        gs.relation[cao.id] = clamp((gs.relation[cao.id] || 30) + 30, 0, 100);
        cao.relation[gs.id] = clamp((cao.relation[gs.id] || 30) + 30, 0, 100);
        gs.truce[cao.id] = 24; cao.truce[gs.id] = 24;
        Game.checkRulers();
        lines.push(`${UI.gr('공손강')}이 원씨 형제의 목을 조조에게 보냈습니다`);
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  원가
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'wonsul_ching', title: '원술 칭제',
      cond: st => {
        const w = clanByRuler(st, '원술');
        return w && st.year >= 196 && cities(st, w.id).length >= 2;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const w = clanByRuler(st, '원술');
        await UI.banner('중씨(仲氏)를 칭하다');
        await scenes([
          ['원술', '옥새가 내게 있고 사세삼공의 가문이 나를 낳았다.\n오늘부터 황제를 칭하리라!', '원술'],
          ['기령', '아직 인심이 따르지 않습니다, 폐하…', '기령 근심하며'],
        ]);
        w.emperor = true;
        st.clans.forEach(c => { if (c.alive && c.id !== w.id) { c.relation[w.id] = 0; delete c.truce[w.id]; delete c.allies[w.id]; } });
        cities(st, w.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - 22, 0, 100); });
        setFlag(st, 'wonsul_ching');
        lines.push(`${UI.rd('원술')}이 스스로 황제를 칭해 천하가 등을 돌렸습니다`);
      },
    },
    {
      id: 'wonsul_end', title: '원술의 최후',
      cond: st => {
        const w = clanByRuler(st, '원술');
        return w && flag(st, 'wonsul_ching') && (cities(st, w.id).length <= 1 || st.year >= 199);
      },
      chance: () => 0.6,
      run: async (st, lines) => {
        const w = clanByRuler(st, '원술');
        await UI.banner('꿀물 한 그릇');
        await scenes([
          ['원술', '목이 마르다. 꿀물을 다오.', '원술 수레 위에서'],
          ['원술', '피 섞인 물뿐이라니…\n내가 어쩌다 이 지경에 이르렀는가!', '원술 피를 토하며'],
        ]);
        Game.killGen('원술');
        cities(st, w.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - 10, 0, 100); });
        Game.checkRulers();
        lines.push(`${UI.rd('원술')}이 피를 토하고 죽었습니다`);
      },
    },
    {
      id: 'won_split', title: '원씨 형제의 분열',
      cond: st => {
        const cl = st.clans.find(c => c.alive && ['원상', '원담'].includes(c.ruler));
        if (!cl) return false;
        const other = cl.ruler === '원상' ? '원담' : '원상';
        return alive(st, other) && clanOf(st, other) === cl.id && cities(st, cl.id) >= 2;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const cl = st.clans.find(c => c.alive && ['원상', '원담'].includes(c.ruler));
        const other = cl.ruler === '원상' ? '원담' : '원상';
        const cs = cities(st, cl.id);
        if (cs.length < 2) return;
        await UI.banner('형제의 칼');
        await scenes([
          [other, '아버님의 뒤는 마땅히 내가 이어야 하거늘!', other],
          [cl.ruler, '집안 싸움이 적보다 무섭구나…', cl.ruler],
        ]);
        const nid = st.clans.length, city = cs[cs.length - 1];
        st.clans.push({
          id: nid, ruler: other, color: CLAN_COLORS[nid % CLAN_COLORS.length],
          isPlayer: false, alive: true, emperor: false, allies: {}, truce: {}, relation: {},
        });
        st.clans.forEach((x, i) => { if (i !== nid) { x.relation[nid] = rr(10, 30); st.clans[nid].relation[i] = rr(10, 30); } });
        st.cities[city].gens.slice().forEach(n => {
          if (n === other) return;
          const refuge = cs.filter(x => x !== city);
          if (refuge.length) Game.moveGen(n, refuge[0]); else leave(st, n);
        });
        st.cities[city].clan = nid;
        join(st, other, nid, city, 100);
        Game.assignOfficers(city);
        Game.checkRulers();
        lines.push(`${UI.rd(other)}가 갈라져 나가 스스로 군주가 되었습니다`);
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  손씨
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'taesaja', title: '신정의 겨룸',
      cond: st => {
        const sn = st.clans.find(c => c.alive && ['손책', '손견', '손권'].includes(c.ruler));
        return sn && alive(st, '태사자') && clanOf(st, '태사자') !== sn.id && st.year >= 194;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const sn = st.clans.find(c => c.alive && ['손책', '손견', '손권'].includes(c.ruler));
        await UI.banner('손책과 태사자');
        await scenes([
          ['태사자', '소패왕이라 하였느냐.\n오늘 그 목을 가져가겠다!', '태사자 창을 겨누고'],
          ['손책', '투구를 빼앗겼으나 나는 그대의 창을 잡았소.\n하루 종일 싸워도 승부가 나지 않는구려.', '손책 웃으며'],
          ['태사자', '나를 죽이지 않고 풀어 준다면\n흩어진 병사를 거두어 돌아오겠소.', '태사자'],
          ['손책', '그대의 말을 믿겠소.\n내일 해가 중천에 뜰 때까지 기다리리다.', '손책'],
        ]);
        const cs = cities(st, sn.id);
        if (cs.length) join(st, '태사자', sn.id, cs[0], 92);
        lines.push(`${UI.gr('태사자')}가 손씨에 몸을 맡겼습니다`);
      },
    },
    {
      id: 'ugil', title: '우길의 저주',
      cond: st => {
        const sn = clanByRuler(st, '손책');
        return sn && st.year >= 199;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const sn = clanByRuler(st, '손책');
        await UI.banner('우길을 베다');
        await scenes([
          ['손책', '요망한 도사가 인심을 홀린다.\n목을 베어 저잣거리에 걸어라!', '손책'],
          ['손책', '거울 속에 그 도사가 서 있다…\n으윽, 상처가!', '손책 거울을 던지며'],
        ]);
        st.lifeMod = st.lifeMod || {};
        st.lifeMod['손책'] = -1;
        cities(st, sn.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - 6, 0, 100); });
        if (sn.id === pc(st)) await UI.speech('장소', '주공의 상처가 덧났습니다.\n부디 몸을 아끼십시오…', '장소 근심하며');
        lines.push(`${UI.rd('손책')}의 상처가 덧났다는 소문이 돕니다`);
      },
    },
    {
      id: 'gamnyeong_night', title: '감녕의 백기 야습',
      cond: st => {
        const g = st.gens['감녕'];
        return g && g.clan >= 0 && Game.ADJ[g.city] &&
          Game.ADJ[g.city].some(id => st.cities[id].clan >= 0 && st.cities[id].clan !== g.clan);
      },
      chance: () => 0.35, repeat: true, cool: 24,
      run: async (st, lines) => {
        const g = st.gens['감녕'];
        const foes = Game.ADJ[g.city].filter(id => st.cities[id].clan >= 0 && st.cities[id].clan !== g.clan);
        const tgt = foes[rnd(foes.length)];
        await UI.banner('백 기로 영채를 뚫다');
        await scenes([
          ['감녕', '백 기만 주십시오.\n오늘 밤 적진을 휘젓고 한 사람도 잃지 않고 돌아오겠습니다.', '감녕'],
          ['감녕', '흰 거위 깃을 투구에 꽂아라.\n북을 울리지 말고 소리 없이 든다.', '한밤의 습격'],
        ]);
        const c = st.cities[tgt];
        const lost = Math.floor(c.troops * 0.12) + 500;
        c.troops = Math.max(0, c.troops - lost);
        c.train = clamp(c.train - 10, 0, 100);
        g.loyal = clamp(g.loyal + 5, 0, 100);
        lines.push(`${UI.gr('감녕')}이 ${UI.yl(cname(tgt))}의 영채를 뚫어 병사 ${lost}명을 흩었습니다`);
      },
    },
    {
      id: 'baekui', title: '백의도강',
      cond: st => {
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        if (!sn || !alive(st, '여몽') || clanOf(st, '여몽') !== sn.id) return false;
        const gw = st.gens['관우'];
        if (!gw || gw.clan < 0 || gw.clan === sn.id) return false;
        return [26, 30, 27].includes(gw.city) && adjacentTo(st, sn.id, gw.clan);
      },
      chance: () => 0.35,
      run: async (st, lines) => {
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        const gw = st.gens['관우'];
        const city = gw.city, owner = gw.clan;
        await UI.banner('흰 옷의 장사꾼');
        await scenes([
          ['여몽', '병을 핑계로 자리를 비우고\n육손을 내세우면 관우는 마음을 놓을 것입니다.', '여몽의 계책'],
          ['육손', '장군의 위엄은 진秦·한漢을 넘습니다…\n(그 글에 관우가 크게 웃었다)', '육손의 서신'],
          ['여몽', '정예를 흰 옷 입혀 장삿배에 숨겨라.\n봉화대부터 소리 없이 거둔다.', '백의도강'],
        ]);
        const c = st.cities[city];
        const surv = Math.floor(c.troops * 0.4);
        Game.captureCity(sn.id, city, surv, [], [], []);
        if (alive(st, '관우')) {
          await UI.speech('관우', '형주를 잃고 맥성에 갇혔구나…\n하늘이 나를 버리시는가.', '맥성');
          Game.killGen('관우');
          if (alive(st, '관평')) Game.killGen('관평');
        }
        Game.checkRulers();
        setFlag(st, 'gwanwoo_dead');
        if (owner === pc(st)) await UI.speech(pRuler(st), '운장을 잃었다…\n이 원한을 어찌 갚으랴!', '비보');
        lines.push(`${UI.rd('관우')}가 형주를 잃고 목숨을 잃었습니다`);
      },
    },
    {
      id: 'iryeong', title: '이릉대전',
      cond: st => {
        if (!flag(st, 'gwanwoo_dead')) return false;
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        return lb && sn && adjacentTo(st, lb.id, sn.id);
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        await UI.banner('이릉의 불');
        await scenes([
          ['유비', '아우의 원수를 갚지 못하면\n천하를 얻은들 무엇하랴. 전군 동쪽으로!', '유비 친정'],
          ['육손', '칠백 리에 늘어선 영채가 모두 나무 그늘 아래 있습니다.\n바람이 불면 하룻밤에 끝납니다.', '육손'],
        ]);
        let go = true;
        if (lb.id === pc(st)) go = await UI.confirm(UI.rd('그래도 동쪽으로 군을 내겠습니까?'));
        if (!go) {
          await UI.speech('제갈량', '참으셨습니다.\n나라의 복입니다.', '제갈량 안도하며');
          cities(st, lb.id).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 5, 0, 100); });
          return;
        }
        cities(st, lb.id).forEach(id => {
          const c = st.cities[id];
          c.troops = Math.floor(c.troops * 0.55);
          c.train = clamp(c.train - 18, 0, 100);
        });
        cities(st, sn.id).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 8, 0, 100); });
        lb.relation[sn.id] = 0; sn.relation[lb.id] = 0;
        delete lb.allies[sn.id]; delete sn.allies[lb.id];
        setFlag(st, 'iryeong');
        await UI.speech('유비', '내가 육손 따위에게 꺾이다니…\n무슨 낯으로 성도로 돌아가랴.', '패주');
        lines.push(`${UI.rd('이릉')}에서 유비의 대군이 불탔습니다`);
      },
    },
    {
      id: 'baekje', title: '백제성 탁고',
      cond: st => flag(st, 'iryeong') && alive(st, '유비') && alive(st, '제갈량') &&
        clanOf(st, '제갈량') === clanOf(st, '유비'),
      chance: () => 0.5,
      run: async (st, lines) => {
        const cl = st.clans[clanOf(st, '유비')];
        await UI.banner('백제성 탁고');
        await scenes([
          ['유비', '그대의 재주는 조비의 열 배요.\n아들이 도울 만하면 돕고, 아니면 그대가 스스로 취하시오.', '유비 병상에서'],
          ['제갈량', '신은 온 힘을 다해 충절을 바치고\n죽은 뒤에야 그칠 것입니다!', '제갈량 머리를 조아리며'],
        ]);
        st.lifeMod = st.lifeMod || {};
        st.lifeMod['유비'] = -1;
        clanGens(st, cl.id).forEach(g => { g.loyal = clamp(g.loyal + 10, 0, 100); });
        lines.push(`${UI.gr('유비')}가 백제성에서 뒷일을 제갈량에게 맡겼습니다`);
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  유비 · 촉
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'jangpan', title: '장판파',
      cond: st => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        if (!lb || cities(st, lb.id).length > 2) return false;
        const cao = clanByRuler(st, '조조');
        return cao && adjacentTo(st, cao.id, lb.id) && clanOf(st, '조운') === lb.id;
      },
      chance: () => 0.4,
      run: async (st, lines) => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        await UI.banner('장판파');
        await scenes([
          ['조운', '주공의 아드님을 품에 안았습니다.\n길을 열겠습니다!', '조운 단기로'],
          ['조조', '저 장수가 누구냐! 활을 쏘지 마라.\n산 채로 얻고 싶다.', '조조 산 위에서'],
          ['유비', '이 아이 하나 때문에\n하마터면 나의 대장을 잃을 뻔했다!', '아두를 내던지며'],
          ['장비', '연인 장익덕이 여기 있다!\n목숨이 아깝지 않은 자는 건너오라!', '장판교 위에서'],
        ]);
        clanGens(st, lb.id).forEach(g => { g.loyal = clamp(g.loyal + 10, 0, 100); });
        st.gens['조운'].loyal = 100;
        await grant(st, '조운', '청강검', lb.id !== pc(st));
        if (alive(st, '장비')) await grant(st, '장비', '장팔사모', lb.id !== pc(st));
        cities(st, lb.id).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 10, 0, 100); });
        lines.push(`장판파에서 ${UI.gr('조운')}이 홀로 아두를 구해 냈습니다`);
      },
    },
    {
      id: 'hyeongju_dae', title: '형주를 빌리다',
      cond: st => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        if (!lb || !sn || !lb.allies[sn.id]) return false;
        return cities(st, sn.id).includes(30) && (lb.id === pc(st) || sn.id === pc(st));
      },
      chance: () => 0.45,
      run: async (st, lines) => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const sn = st.clans.find(c => c.alive && ['손권', '손책'].includes(c.ruler));
        await UI.banner('형주 대여');
        await scenes([
          ['노숙', '유황숙이 몸 붙일 곳이 없으니\n강릉을 잠시 빌려 주는 것이 어떻겠습니까.', '노숙 아뢰기를'],
          ['제갈량', '서천을 얻는 대로 반드시 돌려드리겠습니다.\n증서에 손을 찍겠습니다.', '제갈량'],
        ]);
        let ok = true;
        if (sn.id === pc(st)) ok = await UI.confirm(UI.yl('강릉을 유비에게 빌려주겠습니까?'));
        if (!ok) {
          lb.relation[sn.id] = clamp((lb.relation[sn.id] || 50) - 20, 0, 100);
          await UI.anyKey('청을 물리쳤습니다');
          return;
        }
        Game.captureCity(lb.id, 30, Math.floor(st.cities[30].troops * 0.7), [], [], []);
        st.cities[30].loyal = clamp(st.cities[30].loyal + 15, 0, 100);
        sn.relation[lb.id] = clamp((sn.relation[lb.id] || 50) + 10, 0, 100);
        setFlag(st, 'hyeongju_dae');
        Game.checkRulers();
        lines.push(`${UI.gr('유비')}가 ${UI.yl('강릉')}을 빌렸습니다`);
      },
    },
    {
      id: 'seocheon', title: '서천으로',
      cond: st => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const ly = clanByRuler(st, '유장');
        return lb && ly && st.year >= 211 && cities(st, lb.id).length >= 2;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const lb = st.clans.find(c => c.alive && c.ruler === '유비');
        const ly = clanByRuler(st, '유장');
        await UI.banner('유장, 유비를 부르다');
        await scenes([
          ['유장', '장로가 한중에서 노리고 있소.\n같은 종친이니 부디 와서 도와주시오.', '유장의 청'],
          ['방통', '이는 하늘이 주는 것입니다.\n받지 않으면 도리어 재앙이 됩니다.', '방통 아뢰기를'],
          ['유비', '내가 종친의 땅을 뺏는다면\n천하가 나를 무어라 하겠는가…', '유비 망설이며'],
        ]);
        let go = true;
        if (lb.id === pc(st)) go = await UI.confirm(UI.yl('익주로 들어가겠습니까?'));
        if (!go) { await UI.anyKey('군을 내지 않았습니다'); return; }
        const gate = cities(st, ly.id).filter(id => [39, 40, 42].includes(id));
        if (gate.length) {
          Game.captureCity(lb.id, gate[0], Math.floor(st.cities[gate[0]].troops * 0.6), [], [], []);
          Game.checkRulers();
          lines.push(`${UI.gr('유비')}가 ${UI.yl(cname(gate[0]))}에 들어섰습니다`);
        }
        ly.relation[lb.id] = 0; delete ly.truce[lb.id];
        setFlag(st, 'seocheon');
      },
    },
    {
      id: 'hanjungwang', title: '한중왕',
      cond: st => pRuler(st) === '유비' && cities(st, pc(st)).includes(17) && cities(st, pc(st)).length >= 8,
      chance: () => 0.8,
      run: async (st, lines) => {
        await UI.banner('한중왕에 오르다');
        await scenes([
          ['제갈량', '한중을 얻으셨으니 이제 왕위에 오르시어\n천하의 인심을 모으십시오.', '제갈량 권하기를'],
          ['유비', '한실의 신하로서 부끄러운 일이나\n대의를 위해 받겠소.', '유비'],
        ]);
        pClan(st).emperor = true;
        clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 10, 0, 100); });
        cities(st, pc(st)).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 8, 0, 100); });
        lines.push(`${UI.gr('유비')}가 ${UI.yl('한중왕')}에 올랐습니다`);
      },
    },
    {
      id: 'eupcham', title: '읍참마속',
      cond: st => clanOf(st, '제갈량') === pc(st) && clanOf(st, '마속') === pc(st) &&
        cities(st, pc(st)).includes(17) && st.year >= 226,
      chance: () => 0.5,
      run: async (st, lines) => {
        await UI.banner('가정을 잃다');
        await scenes([
          ['마속', '산 위에 진을 치면 아래를 굽어보며 칠 수 있습니다.', '마속'],
          ['왕평', '물길이 끊기면 어찌하시렵니까!\n승상의 분부대로 길목을 지켜야 합니다.', '왕평 말리며'],
          ['제갈량', '가정을 잃었으니 북벌이 무너졌다.\n군율을 세우지 않으면 무엇으로 삼군을 다스리랴.', '제갈량'],
        ]);
        let kill = true;
        if (pc(st) === clanOf(st, '제갈량')) kill = await UI.confirm(UI.rd('마속을 군율로 다스리겠습니까?'));
        if (kill) {
          await UI.speech('제갈량', '(눈물을 흘리며) 끌어내어 목을 베어라.', '읍참마속');
          Game.killGen('마속');
          cities(st, pc(st)).forEach(id => { st.cities[id].train = clamp(st.cities[id].train + 10, 0, 100); });
          clanGens(st, pc(st)).forEach(g => { g.loyal = clamp(g.loyal + 4, 0, 100); });
        } else {
          st.gens['마속'].loyal = 100;
          cities(st, pc(st)).forEach(id => { st.cities[id].train = clamp(st.cities[id].train - 8, 0, 100); });
          await UI.speech('마속', '승상의 은혜를 목숨으로 갚겠습니다…', '마속 살아남다');
        }
      },
    },
    {
      id: 'mokwoo', title: '목우유마',
      cond: st => clanOf(st, '제갈량') === pc(st) && cities(st, pc(st)).includes(17) && st.year >= 230,
      chance: () => 0.6,
      run: async (st, lines) => {
        await UI.banner('목우유마');
        await scenes([
          ['제갈량', '험한 잔도에 소와 말이 지쳐 쓰러진다.\n나무로 소와 말을 만들어 군량을 나르게 하라.', '제갈량'],
        ]);
        cities(st, pc(st)).forEach(id => { st.cities[id].rice += rr(6000, 18000); });
        await UI.speech('위연', '나무 소가 저 혼자 걷습니다!\n이제 군량 걱정은 덜었습니다.', '진중의 놀라움');
        lines.push(`${UI.yl('목우유마')}로 군량이 넉넉해졌습니다`);
      },
    },
    {
      id: 'ojangwon', title: '오장원',
      cond: st => alive(st, '제갈량') && clanOf(st, '제갈량') >= 0 && st.year >= 233 &&
        cities(st, clanOf(st, '제갈량')).includes(17),
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '제갈량');
        await UI.banner('별이 떨어지다');
        await scenes([
          ['제갈량', '내 별이 어둡구나.\n장성이 떨어지면 나의 명이 다한 것이다.', '오장원의 밤'],
          ['제갈량', '강백약, 이 병법 스물네 편을 그대에게 전한다.\n뒷일을 부탁하네…', '병법을 전하며'],
        ]);
        if (alive(st, '강유') && clanOf(st, '강유') === ci) {
          await grant(st, '강유', '손자병법', ci !== pc(st));
          st.gens['강유'].loyal = 100;
        }
        cities(st, ci).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal - 6, 0, 100); });
        setFlag(st, 'ojangwon');
        lines.push(`오장원에서 ${UI.rd('제갈량')}의 별이 떨어졌습니다`);
      },
    },
    {
      id: 'gopyeong', title: '고평릉의 변',
      cond: st => {
        const ci = clanOf(st, '사마의');
        return ci >= 0 && st.year >= 245 && st.clans[ci] && st.clans[ci].ruler !== '사마의' &&
          cities(st, ci).length >= 6;
      },
      chance: () => 0.5,
      run: async (st, lines) => {
        const ci = clanOf(st, '사마의');
        const cl = st.clans[ci];
        await UI.banner('고평릉의 변');
        await scenes([
          ['사마의', '늙고 병들어 정신이 흐리다 하였더니\n오늘에야 낙수의 다리를 건너는구나.', '사마의'],
          [cl.ruler, '병권이 이미 저들 손에 넘어갔다…', cl.ruler],
        ]);
        const old = cl.ruler;
        cl.ruler = '사마의';
        st.gens['사마의'].loyal = 100;
        clanGens(st, ci).forEach(g => { if (g.name !== '사마의') g.loyal = clamp(g.loyal - rr(5, 20), 0, 100); });
        cities(st, ci).forEach(id => Game.assignOfficers(id));
        lines.push(`${UI.rd('사마의')}가 정권을 잡고 ${old}를 밀어냈습니다`);
      },
    },

    /* ═══════════════════════════════════════════════════════════════
     *  기연 · 이민족
     * ══════════════════════════════════════════════════════════════ */
    {
      id: 'jeokto_bul', title: '적토마',
      cond: st => clanOf(st, '여포') >= 0 && !((st.gens['여포'].items || []).includes('적토마')) && st.year <= 198,
      chance: () => 0.5,
      run: async (st, lines) => {
        await UI.banner('하루 천 리를 달리는 말');
        await scenes([
          ['이유', '여포의 마음을 사려면 적토마만 한 것이 없습니다.', '이유 아뢰기를'],
          ['여포', '이런 말을 주시다니…\n무엇으로 은혜를 갚으리까!', '여포 기뻐하며'],
        ]);
        await grant(st, '여포', '적토마', clanOf(st, '여포') !== pc(st));
        st.gens['여포'].loyal = clamp(st.gens['여포'].loyal + 15, 0, 100);
      },
    },
    {
      id: 'gwanro', title: '관로의 점',
      cond: st => st.year >= 200 && cities(st, pc(st)).length >= 3,
      chance: () => 0.25, repeat: true, cool: 36,
      run: async (st, lines) => {
        const good = Math.random() < 0.5;
        await UI.banner('점쟁이가 오다');
        await UI.speech('사마휘',
          good ? '올해는 별이 밝고 바람이 순하니\n곳간이 넘칠 것입니다.'
               : '서쪽에 붉은 기운이 서렸습니다.\n칼과 불을 조심하십시오.',
          '떠도는 점쟁이');
        if (good) {
          setFlag(st, 'pungnyeon_year', st.year);
          cities(st, pc(st)).forEach(id => { st.cities[id].loyal = clamp(st.cities[id].loyal + 4, 0, 100); });
        } else {
          const cid = anyCityOf(st, pc(st));
          if (cid) st.cities[cid].loyal = clamp(st.cities[cid].loyal - 5, 0, 100);
        }
      },
    },
    {
      id: 'ohwan', title: '오환의 침입',
      cond: st => cities(st, pc(st)).some(id => [1, 2, 3, 16, 14].includes(id)),
      chance: () => 0.3, repeat: true, cool: 24,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => [1, 2, 3, 16, 14].includes(id));
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        await UI.banner('북방의 기병');
        await UI.speech(c.governor || pRuler(st),
          `오환의 기병이 국경을 넘었습니다.\n${UI.yl(cname(cid))}의 마을이 불타고 있습니다.`, '변경의 급보');
        if (await UI.confirm('금 800을 풀어 국경을 달래겠습니까?')) {
          if (c.gold >= 800) {
            c.gold -= 800;
            c.horses += rr(400, 900);
            await UI.anyKey(`화친의 대가로 ${UI.gr('군마')}를 얻었습니다`);
          } else await UI.anyKey(UI.rd('금이 모자랐습니다'));
        } else {
          const lost = Math.floor(c.troops * 0.1) + 400;
          c.troops = Math.max(0, c.troops - lost);
          c.pop = Math.floor(c.pop * 0.96);
          await UI.anyKey(`병사 ${UI.rd(lost)}명과 백성을 잃었습니다`);
        }
      },
    },
    {
      id: 'namman_chim', title: '남만의 봉기',
      cond: st => alive(st, '맹획') && cities(st, pc(st)).some(id => [41, 42, 43, 44, 45, 46, 37, 38].includes(id)),
      chance: () => 0.3, repeat: true, cool: 30,
      run: async (st, lines) => {
        const cs = cities(st, pc(st)).filter(id => [41, 42, 43, 44, 45, 46, 37, 38].includes(id));
        const cid = cs[rnd(cs.length)], c = st.cities[cid];
        await UI.banner('남만이 일어나다');
        await UI.speech('맹획', '한인의 관리가 우리를 업신여긴다!\n남중의 부족을 모두 일으켜라!', '남만왕 맹획');
        const lost = Math.floor(c.troops * 0.15) + 600;
        c.troops = Math.max(0, c.troops - lost);
        c.loyal = clamp(c.loyal - 10, 0, 100);
        lines.push(`${UI.yl(cname(cid))}에서 남만의 봉기로 병사 ${UI.rd(lost)}명을 잃었습니다`);
      },
    },
  ];
})();
