/* =========================================================================
 *  사람 사이의 일 —  장수 보유에는 손대지 않고, 사람의 마음과 고을의 살림으로만
 *  판에 스며드는 사건들. 등급 0~2 이므로 조건이 느슨해도 판이 망가지지 않는다.
 *
 *  의형제·친분(bond)은 여기서 맺어지고, events.js 가 매월 그것을 굴린다.
 *    · 정이 40을 넘은 둘이 한 성에 있으면 서로의 충성을 매월 끌어올린다
 *    · 정이 깊은 쪽이 죽으면 남은 쪽의 충성이 크게 흔들린다
 *  장수를 얻거나 잃게 하지 않으면서 플레이에 이자가 붙는 구조다.
 * ========================================================================= */
const HUMAN_EVENTS = (() => {
  const {
    flag, setFlag, since, clanOf, isFree, alive, pc, pClan, pRuler, cities, capital,
    clanByRuler, clanGens, S, cname, rr, rnd, clamp, scenes, grant,
    mem, elapsed, serves, cityOf, together, bondOf, addBond, bondsOf,
  } = Events.api;

  const c_ = (st, id) => st.cities[id];
  const up = (st, id, k, n, lo, hi) => { c_(st, id)[k] = clamp(c_(st, id)[k] + n, lo === undefined ? 0 : lo, hi === undefined ? 100 : hi); };
  const myCities = st => cities(st, pc(st));
  const pick = a => a[rnd(a.length)];
  const anyCity = st => { const cs = myCities(st); return cs.length ? pick(cs) : null; };
  /* 내 세력에서 한 성에 둘 이상 모여 있는 곳을 찾는다 */
  const pairCity = (st, f) => {
    const cs = myCities(st).filter(id => c_(st, id).gens.filter(n => !f || f(n)).length >= 2);
    return cs.length ? pick(cs) : null;
  };
  const twoIn = (st, id, f) => {
    const g = c_(st, id).gens.filter(n => !f || f(n));
    if (g.length < 2) return null;
    const a = pick(g), b = pick(g.filter(n => n !== a));
    return b ? [a, b] : null;
  };
  const gov = (st, id) => c_(st, id).governor || pRuler(st);
  /* 이 인물이 아직 젊은가 — 등장 연도가 늦은 쪽을 젊다고 본다 */
  const young = (st, n) => {
    const L = LIFE[n];
    return !!(L && L[0] && st.year - L[0] <= 8) || (L && L[1] && L[1] - st.year >= 25);
  };
  const bump = (st, n, v) => { if (st.gens[n] && st.gens[n].clan >= 0) st.gens[n].loyal = clamp(st.gens[n].loyal + v, 0, 100); };

  return [

    /* ══════════════════════════════════════════════════════════════════
     *  의형제와 친분 — 이 마당의 뼈대
     * ═════════════════════════════════════════════════════════════════ */
    {
      /* 의형제 결의 — 무장 둘이 한 성에서 오래 어깨를 맞대었을 때 */
      id: 'sworn', w: 3, tier: 1,
      cond: st => !!pairCity(st, n => S(n)[0] >= 68),
      run: async (st, lines) => {
        const cid = pairCity(st, n => S(n)[0] >= 68); if (!cid) return;
        const two = twoIn(st, cid, n => S(n)[0] >= 68); if (!two) return;
        const [a, b] = two;
        if (bondOf(st, a, b) >= 55) return;
        await UI.banner('의형제를 맺다');
        await scenes([
          [a, `${UI.yl(b)} 공과 술을 나눈 것이 벌써 여러 해요.\n오늘 향을 피우고 형제의 의를 맺고자 하오.`, `${a}의 청`],
          [b, '한 하늘 아래 두 목숨이 하나이니\n앞으로 죽고 사는 것을 함께 하겠소.', `${b}의 대답`],
        ]);
        addBond(st, a, b, 45);
        bump(st, a, 8); bump(st, b, 8);
        up(st, cid, 'train', rr(3, 7));
        lines.push(`${UI.gr(a)}와 ${UI.gr(b)}가 의형제를 맺었습니다`);
      },
    },
    {
      /* 술벗 — 가장 흔한 정 붙는 자리 */
      id: 'drink_mates', w: 4, tier: 1,
      cond: st => !!pairCity(st),
      run: async (st, lines) => {
        const cid = pairCity(st); if (!cid) return;
        const two = twoIn(st, cid); if (!two) return;
        const [a, b] = two;
        const lv = addBond(st, a, b, rr(6, 12));
        bump(st, a, rr(1, 4)); bump(st, b, rr(1, 4));
        lines.push(lv >= 40
          ? `${UI.gr(a)}와 ${UI.gr(b)}가 밤늦도록 술잔을 나누며 ${UI.yl('정이 두터워졌습니다')}`
          : `${UI.gr(a)}와 ${UI.gr(b)}가 술자리를 함께했습니다`);
      },
    },
    {
      /* 지음(知音) — 문관 둘이 뜻이 통하다 */
      id: 'jieum', w: 3, tier: 1,
      cond: st => !!pairCity(st, n => S(n)[1] >= 72),
      run: async (st, lines) => {
        const cid = pairCity(st, n => S(n)[1] >= 72); if (!cid) return;
        const two = twoIn(st, cid, n => S(n)[1] >= 72); if (!two) return;
        const [a, b] = two;
        await UI.speech(a, `${UI.yl(b)} 공의 한마디가 제 십 년 생각을 뚫었습니다.\n오늘 비로소 말이 통하는 이를 만났습니다.`, '지음을 만나다');
        addBond(st, a, b, rr(10, 20));
        up(st, cid, 'tech', rr(2, 5));
        bump(st, a, 3); bump(st, b, 3);
      },
    },
    {
      /* 병문안 — 정이 있는 쪽이 찾아온다 */
      id: 'sickbed', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).some(g => bondsOf(st, g.name).length),
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => bondsOf(st, g.name).length);
        if (!gs.length) return;
        const g = pick(gs);
        const t = pick(bondsOf(st, g.name));
        if (!alive(st, t.other)) return;
        await UI.speech(t.other, `${UI.yl(g.name)}이 앓아누웠다는 말을 듣고\n밤길을 달려왔소. 약은 내가 구해 오겠소.`, '병문안');
        addBond(st, g.name, t.other, rr(6, 12));
        bump(st, g.name, rr(3, 7));
        st.lifeMod = st.lifeMod || {};
        if (Math.random() < 0.3) st.lifeMod[g.name] = (st.lifeMod[g.name] || 0) + 1;
      },
    },
    {
      /* 다툼을 말리다 — 제3자가 두 사람을 화해시킨다 */
      id: 'mediate', w: 2, tier: 1,
      cond: st => myCities(st).some(id => c_(st, id).gens.length >= 3),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).gens.length >= 3);
        if (!cs.length) return;
        const cid = pick(cs), g = c_(st, cid).gens;
        const [a, b] = twoIn(st, cid) || [];
        if (!a || !b) return;
        const mid = pick(g.filter(n => n !== a && n !== b));
        await scenes([
          [mid, `두 분이 창을 겨루면 웃는 것은 적장뿐이오.\n내 술 한 동이를 걸겠소, 오늘은 그것으로 푸시오.`, `${mid}의 중재`],
        ]);
        addBond(st, a, b, rr(8, 16));
        addBond(st, mid, a, 5); addBond(st, mid, b, 5);
        bump(st, mid, 4);
      },
    },
    {
      /* 사제 — 노장이 젊은 무장을 가르친다 */
      id: 'teach', w: 3, tier: 1,
      cond: st => !!pairCity(st),
      run: async (st, lines) => {
        const cid = pairCity(st); if (!cid) return;
        const g = c_(st, cid).gens;
        const old = g.filter(n => S(n)[1] >= 68 && !young(st, n));
        const kid = g.filter(n => young(st, n));
        if (!old.length || !kid.length) return;
        const m = pick(old), d = pick(kid);
        if (m === d) return;
        await UI.speech(m, `${UI.yl(d)}, 창을 쓰는 법보다\n군을 세우는 법을 먼저 배워라.\n용맹은 배우지 않아도 늙으면 남지 않는다.`, `${m}의 가르침`);
        addBond(st, m, d, rr(12, 22));
        bump(st, d, rr(5, 10));
        up(st, cid, 'train', rr(2, 6));
        lines.push(`${UI.gr(m)}이 ${UI.gr(d)}를 제자로 삼았습니다`);
      },
    },

    /* ══════════════════════════════════════════════════════════════════
     *  집안일
     * ═════════════════════════════════════════════════════════════════ */
    {
      /* 아이의 첫돌 — 뒷날 그 이름을 알아볼 사람이 있을지도 */
      id: 'child_feast', w: 3, tier: 1,
      cond: st => clanGens(st, pc(st)).length >= 2,
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)); if (!gs.length) return;
        const g = pick(gs);
        const heir = HEIRS[g.name];
        const named = heir && !alive(st, heir) && LIFE[heir] && LIFE[heir][0] > st.year;
        await UI.banner('아이의 첫돌');
        await UI.speech(g.name, named
          ? `사내아이를 얻어 이름을 ${UI.yl(heir)}이라 지었습니다.\n뒷날 주공의 말 앞에 세울 수 있으면 좋겠습니다.`
          : '늦게 아이를 얻어 잔치를 열었습니다.\n주공의 술 한 잔을 청하옵니다.', `${g.name}의 집`);
        bump(st, g.name, rr(6, 12));
        const cid = g.city;
        if (c_(st, cid)) { up(st, cid, 'loyal', rr(2, 5)); c_(st, cid).gold = Math.max(0, c_(st, cid).gold - 120); }
        clanGens(st, pc(st)).filter(x => x.city === cid).forEach(x => bump(st, x.name, 2));
      },
    },
    {
      /* 부친상 — 사람이 죽지만 장수는 그대로다 */
      id: 'mourning', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).length >= 3,
      run: async (st, lines) => {
        const g = pick(clanGens(st, pc(st)));
        await UI.speech(g.name, '아비를 잃었습니다.\n석 달 상복을 입을 것을 청하오나,\n군무가 급하다면 곧 창을 들겠습니다.', `${g.name}의 상(喪)`);
        g.acted = true;
        if (await UI.confirm('상을 치르도록 허락하겠습니까?')) {
          bump(st, g.name, rr(8, 14));
          bondsOf(st, g.name).forEach(t => addBond(st, g.name, t.other, 4));
          lines.push(`${UI.gr(g.name)}이 상을 치르고 주공의 은덕을 새겼습니다`);
        } else {
          bump(st, g.name, -rr(6, 12));
          lines.push(`${UI.rd(g.name)}이 상복을 벗고 군막으로 돌아왔습니다`);
        }
      },
    },
    {
      /* 노모 봉양 — 효를 표창하다 */
      id: 'filial', w: 2, tier: 1,
      cond: st => !!anyCity(st),
      run: async (st, lines) => {
        const cid = anyCity(st); if (!cid) return;
        up(st, cid, 'loyal', rr(4, 9));
        lines.push(`${UI.yl(cname(cid))}의 효자를 표창하니 백성이 예를 배웁니다`);
      },
    },
    {
      /* 고아를 거두다 */
      id: 'orphan', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).length >= 2,
      run: async (st, lines) => {
        const g = pick(clanGens(st, pc(st)));
        await UI.speech(g.name, '전란에 부모를 잃은 아이를 거두어 양자로 삼았습니다.\n스무 해 뒤에는 창을 들 것입니다.', `${g.name}의 양자`);
        bump(st, g.name, rr(4, 8));
        if (c_(st, g.city)) up(st, g.city, 'loyal', rr(2, 5));
      },
    },
    {
      /* 고향에서 온 편지 */
      id: 'letter', w: 3, tier: 1,
      cond: st => clanGens(st, pc(st)).length >= 1,
      run: async (st, lines) => {
        const g = pick(clanGens(st, pc(st)));
        if (Math.random() < 0.6) {
          bump(st, g.name, rr(3, 7));
          lines.push(`${UI.gr(g.name)}이 고향의 편지를 받고 기운을 얻었습니다`);
        } else {
          bump(st, g.name, -rr(2, 6));
          lines.push(`${UI.gr(g.name)}이 고향 소식에 마음이 흔들립니다`);
        }
      },
    },

    /* ══════════════════════════════════════════════════════════════════
     *  겨룸과 놀이
     * ═════════════════════════════════════════════════════════════════ */
    {
      /* 활쏘기 겨룸 */
      id: 'archery', w: 3, tier: 1,
      cond: st => !!pairCity(st, n => S(n)[0] >= 60),
      run: async (st, lines) => {
        const cid = pairCity(st, n => S(n)[0] >= 60); if (!cid) return;
        const two = twoIn(st, cid, n => S(n)[0] >= 60); if (!two) return;
        const [a, b] = two;
        const win = S(a)[0] + rr(-8, 8) >= S(b)[0] ? a : b, lose = win === a ? b : a;
        await UI.banner('활쏘기 겨룸');
        await UI.speech(win, `백 보 앞의 버들잎을 맞혔소.\n${UI.yl(lose)} 공, 다음 잔은 공의 차례요.`, `${win}의 활`);
        up(st, cid, 'train', rr(4, 8));
        up(st, cid, 'loyal', rr(1, 4));
        bump(st, win, rr(4, 8)); bump(st, lose, rr(1, 3));
        addBond(st, a, b, rr(5, 10));
      },
    },
    {
      /* 바둑 한 판 */
      id: 'baduk', w: 2, tier: 1,
      cond: st => !!pairCity(st, n => S(n)[1] >= 65),
      run: async (st, lines) => {
        const cid = pairCity(st, n => S(n)[1] >= 65); if (!cid) return;
        const two = twoIn(st, cid, n => S(n)[1] >= 65); if (!two) return;
        const [a, b] = two;
        addBond(st, a, b, rr(4, 9));
        up(st, cid, 'comm', rr(2, 5));
        lines.push(`${UI.gr(a)}와 ${UI.gr(b)}가 바둑판을 놓고 하루를 보냈습니다`);
      },
    },
    {
      /* 시회(詩會) */
      id: 'poem_night', w: 2, tier: 1,
      cond: st => !!capital(st),
      run: async (st, lines) => {
        const cid = capital(st); if (!cid) return;
        const g = c_(st, cid).gens.filter(n => S(n)[2] >= 65);
        const who = g.length ? pick(g) : gov(st, cid);
        await UI.speech(who, '달 아래 잔을 들고 글을 지으니\n창칼의 소리가 잠시 멀어집니다.', '시회');
        up(st, cid, 'loyal', rr(3, 7));
        c_(st, cid).gens.forEach(n => bump(st, n, 2));
      },
    },
    {
      /* 대규모 검무 */
      id: 'sword_dance', w: 2, tier: 1,
      cond: st => !!anyCity(st),
      run: async (st, lines) => {
        const cid = anyCity(st); if (!cid) return;
        up(st, cid, 'train', rr(3, 7)); up(st, cid, 'loyal', rr(1, 4));
        lines.push(`${UI.yl(cname(cid))}에서 군사들이 검무를 겨루어 사기가 올랐습니다`);
      },
    },
    {
      /* 노장의 옛이야기 */
      id: 'veteran_tale', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).some(g => S(g.name)[0] >= 70),
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[0] >= 70);
        if (!gs.length) return;
        const g = pick(gs);
        up(st, g.city, 'train', rr(2, 6));
        c_(st, g.city).gens.forEach(n => bump(st, n, 1));
        lines.push(`${UI.gr(g.name)}이 젊은 군사들에게 옛 싸움을 들려주었습니다`);
      },
    },

    /* ══════════════════════════════════════════════════════════════════
     *  고을 살림 — 사람은 오고 가지 않는다
     * ═════════════════════════════════════════════════════════════════ */
    {
      id: 'school', w: 2, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).gold >= 400),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).gold >= 400);
        if (!cs.length) return;
        const cid = pick(cs);
        c_(st, cid).gold -= 400;
        up(st, cid, 'tech', rr(4, 8)); up(st, cid, 'loyal', rr(3, 6));
        lines.push(`${UI.yl(cname(cid))}에 학당을 세워 아이들이 글을 배웁니다`);
      },
    },
    {
      id: 'irrigate', w: 3, tier: 2,
      cond: st => !!anyCity(st),
      run: async (st, lines) => {
        const cid = anyCity(st); if (!cid) return;
        up(st, cid, 'agri', rr(3, 7)); up(st, cid, 'flood', rr(2, 6));
        lines.push(`${UI.yl(cname(cid))}의 백성이 스스로 물길을 내어 논을 늘렸습니다`);
      },
    },
    {
      id: 'bridge', w: 2, tier: 2,
      cond: st => !!anyCity(st),
      run: async (st, lines) => {
        const cid = anyCity(st); if (!cid) return;
        up(st, cid, 'comm', rr(3, 7));
        lines.push(`${UI.yl(cname(cid))}에 새 다리가 놓여 장이 커졌습니다`);
      },
    },
    {
      id: 'wall_volunteer', w: 2, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).loyal >= 70),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).loyal >= 70);
        if (!cs.length) return;
        const cid = pick(cs);
        up(st, cid, 'wall', rr(4, 9));
        lines.push(`${UI.yl(cname(cid))}의 백성이 삯을 마다하고 성벽을 쌓았습니다`);
      },
    },
    {
      id: 'smith', w: 2, tier: 2,
      cond: st => !!anyCity(st),
      run: async (st, lines) => {
        const cid = anyCity(st); if (!cid) return;
        c_(st, cid).bows += rr(200, 900);
        up(st, cid, 'tech', rr(2, 5));
        lines.push(`${UI.yl(cname(cid))}에 이름난 대장장이가 들어와 활을 벼렸습니다`);
      },
    },
    {
      id: 'horse_trader', w: 2, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).gold >= 300),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).gold >= 300);
        if (!cs.length) return;
        const cid = pick(cs), n = rr(200, 800);
        c_(st, cid).gold -= 300; c_(st, cid).horses += n;
        lines.push(`${UI.yl(cname(cid))}에서 말장수에게 군마 ${UI.gr(n)}필을 샀습니다`);
      },
    },
    {
      id: 'festival', w: 3, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).gold >= 300),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).gold >= 300);
        if (!cs.length) return;
        const cid = pick(cs);
        c_(st, cid).gold -= 300;
        up(st, cid, 'loyal', rr(5, 10)); up(st, cid, 'comm', rr(1, 4));
        lines.push(`${UI.yl(cname(cid))}에 향시가 열려 백성이 모처럼 배불리 먹었습니다`);
      },
    },
    {
      id: 'rain_rite', w: 2, tier: 1,
      cond: st => myCities(st).some(id => c_(st, id).loyal < 65),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).loyal < 65);
        if (!cs.length) return;
        const cid = pick(cs);
        const ok = Math.random() < 0.6;
        up(st, cid, 'loyal', ok ? rr(4, 9) : -rr(1, 4));
        lines.push(ok
          ? `${UI.yl(cname(cid))}의 기우제 뒤에 비가 내려 백성이 하늘을 봅니다`
          : `${UI.yl(cname(cid))}의 기우제에도 비가 오지 않아 원망이 돕니다`);
      },
    },
    {
      id: 'praise_stone', w: 2, tier: 1,
      cond: st => myCities(st).some(id => c_(st, id).loyal >= 78 && c_(st, id).governor),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).loyal >= 78 && c_(st, id).governor);
        if (!cs.length) return;
        const cid = pick(cs), who = c_(st, cid).governor;
        await UI.speech(who, `백성이 제 이름을 새긴 비를 세웠다 하옵니다.\n부끄러워 밤에 지나다녔습니다.`, `${cname(cid)}의 선정비`);
        bump(st, who, rr(5, 10));
        up(st, cid, 'loyal', rr(2, 5));
      },
    },
    {
      id: 'border_marry', w: 2, tier: 2,
      cond: st => myCities(st).some(id => [1, 2, 3, 14, 15, 16, 43, 44, 45].includes(id)),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => [1, 2, 3, 14, 15, 16, 43, 44, 45].includes(id));
        if (!cs.length) return;
        const cid = pick(cs);
        c_(st, cid).horses += rr(300, 900);
        up(st, cid, 'loyal', rr(3, 7));
        lines.push(`${UI.yl(cname(cid))}의 호족이 이민족과 혼인을 맺어 군마가 들어왔습니다`);
      },
    },

    /* ══════════════════════════════════════════════════════════════════
     *  탈이 나는 일 — 벌은 가볍게, 사람은 잃지 않는다
     * ═════════════════════════════════════════════════════════════════ */
    {
      id: 'drunk_trouble', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).some(g => S(g.name)[0] >= 65 && S(g.name)[5] < 70),
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => S(g.name)[0] >= 65 && S(g.name)[5] < 70);
        if (!gs.length) return;
        const g = pick(gs);
        await UI.speech(g.name, '취중에 저잣거리에서 소란을 피웠습니다.\n무슨 벌이든 받겠습니다…', `${g.name}의 실수`);
        if (await UI.confirm('군율대로 매를 치겠습니까?')) {
          bump(st, g.name, -rr(4, 9));
          up(st, g.city, 'loyal', rr(3, 6));
          lines.push(`군율을 세우니 ${UI.yl(cname(g.city))}의 민심이 돌아섰습니다`);
        } else {
          bump(st, g.name, rr(3, 6));
          up(st, g.city, 'loyal', -rr(3, 7));
          lines.push(`${UI.rd('군율이 무르다')}는 말이 백성 사이에 돕니다`);
        }
      },
    },
    {
      id: 'gamble', w: 1, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).gold >= 200),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).gold >= 200);
        if (!cs.length) return;
        const cid = pick(cs), n = rr(80, 300);
        c_(st, cid).gold -= n;
        up(st, cid, 'loyal', -rr(1, 3));
        lines.push(`${UI.yl(cname(cid))}의 군중에 도박판이 돌아 금 ${UI.rd(n)}이 새어 나갔습니다`);
      },
    },
    {
      id: 'plague', w: 2, tier: 2,
      cond: st => myCities(st).some(id => c_(st, id).pop > 100000),
      run: async (st, lines) => {
        const cs = myCities(st).filter(id => c_(st, id).pop > 100000);
        if (!cs.length) return;
        const cid = pick(cs), c = c_(st, cid);
        c.pop = Math.floor(c.pop * (0.96 + Math.random() * 0.02));
        up(st, cid, 'loyal', -rr(3, 8));
        const heal = c_(st, cid).gens.filter(n => S(n)[1] >= 70);
        if (heal.length) {
          await UI.speech(pick(heal), `역병이 돌아 약을 고을마다 나누었습니다.\n번지는 것은 막았습니다.`, `${cname(cid)}의 역병`);
          up(st, cid, 'loyal', rr(2, 5));
        } else lines.push(`${UI.yl(cname(cid))}에 ${UI.rd('역병')}이 돌아 백성이 상했습니다`);
      },
    },
    {
      /* 노병의 청 — 사람을 내보내지 않고 뒤로 돌린다 */
      id: 'old_soldier', w: 2, tier: 1,
      cond: st => clanGens(st, pc(st)).some(g => LIFE[g.name] && LIFE[g.name][1] && LIFE[g.name][1] - st.year <= 6),
      run: async (st, lines) => {
        const gs = clanGens(st, pc(st)).filter(g => LIFE[g.name] && LIFE[g.name][1] && LIFE[g.name][1] - st.year <= 6);
        if (!gs.length) return;
        const g = pick(gs);
        await UI.speech(g.name, '이 몸이 이제 갑주의 무게를 견디기 어렵습니다.\n뒤에서 군량이라도 세게 해 주십시오.', `${g.name}의 청`);
        if (await UI.confirm('후방의 일을 맡기겠습니까?')) {
          bump(st, g.name, rr(8, 14));
          up(st, g.city, 'agri', rr(2, 6));
          st.lifeMod = st.lifeMod || {};
          st.lifeMod[g.name] = (st.lifeMod[g.name] || 0) + rr(1, 2);
          lines.push(`${UI.gr(g.name)}이 후방을 맡아 군량을 돌봅니다`);
        } else {
          bump(st, g.name, rr(2, 5));
          up(st, g.city, 'train', rr(2, 5));
          lines.push(`${UI.gr(g.name)}이 갑주를 벗지 않겠다 하였습니다`);
        }
      },
    },
  ];
})();
