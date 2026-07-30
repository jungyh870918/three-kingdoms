# 인물 얼굴 특징표 저작 근거

`js/faces.js` 의 181명 전원에 대한 결정 근거다. 정사·연의의 외형 묘사가 있으면 그것을 최우선으로,
없으면 능력치·역할·소속을 근거로 삼았다. 혈연은 골격 계수(headW 방향, jawWidthMul)를 공유하되
이목구비를 달리해 같은 인물로 보이지 않게 했다.

| 인물 | 뼈대(W×H, 얼굴형/턱, 턱계수) | 눈·코·입 | 수염 / 관 | 근거 |
|---|---|---|---|---|
| 조조 | 50×47 f2j1 1.02 | thin·straight·firm | mustache / crown | 키 작고 눈매 가늘며 수염이 아름다웠다는 기록 → 짧은 사각 얼굴·실눈·팔자수염, 면류관 |
| 하후돈 | 54×52 f2j1 1.1 | patch·wide·firm | full / helm | 화살에 왼눈을 잃음 → 안대. 맹장이므로 넓은 턱(1.10)과 굵은 눈썹 |
| 하후연 | 47×55 f1j1 1.06 | sharp·long·firm | goatee / helm | "사흘에 오백 리"의 기동력 → 하후씨 골격(1.06) 공유하되 길고 마른 얼굴로 형과 구분 |
| 조인 | 55×51 f3j1 1.12 | open·wide·closed | full / helm | 수성의 명장, 듬직함 → 조씨 중 가장 넓은 턱(1.12)과 벌어진 눈 |
| 조홍 | 56×45 f0j0 1.08 | thin·wide·frown | goatee / helm | 재물을 몹시 아낀 인색함 → 살찐 둥근 얼굴·실눈·처진 입 |
| 악진 | 43×46 f2j1 1.04 | sharp·small·firm | mustache / helm | 몸집은 작으나 담이 컸다 → 181명 중 가장 작은 얼굴(43×46)에 날카로운 눈 |
| 이전 | 46×54 f1j0 0.94 | gentle·straight·closed | goatee / silk | 싸움보다 글을 즐긴 유학자 → 무장이나 유건·어진 눈·좁은 턱 |
| 우금 | 50×53 f2j1 1.05 | glare·straight·firm | full / helm | 군령이 엄정 → 일자 눈썹·째려보는 눈·굳게 다문 입 |
| 서황 | 48×58 f1j1 1 | thin·long·firm | full / helm | 주도면밀, 군진이 물처럼 조용 → 세로로 긴 얼굴(58)·실눈 |
| 장료 | 51×56 f1j1 1.03 | sharp·straight·firm | full / helm | 오자양장의 으뜸, 합비의 위엄 → 긴 얼굴에 날카로운 눈·덥수룩한 눈썹 |
| 서저 | 60×50 f3j1 1.15 | big·wide·open | bushy / topknot | 호치(虎癡)라 불린 거구 → 최대 폭(60)·최대 턱계수(1.15)·상투·범수염 |
| 전위 | 58×53 f3j1 1.13 | glare·wide·open | bushy / bare | 쌍철극의 거인, 완성에서 전사 → 검은 피부·부릅뜬 눈·맨머리·흉터 |
| 순욱 | 43×58 f4j2 0.88 | gentle·straight·closed | goatee / gwan | 왕좌지재, 향기를 지녔다는 미남 → 마른 긴 얼굴(43×58)·어진 눈·관모 |
| 순유 | 46×54 f4j2 0.9 | sleepy·straight·closed | goatee / gwan | "겉은 어리석고 속은 밝다" → 졸린 눈으로 속을 감춘 인상 |
| 곽가 | 40×56 f4j2 0.85 | thin·straight·smile | none / silk | 서른여덟에 요절한 병약한 기재 → 최소 폭(40)·수염 없음·흰 유건 |
| 정욱 | 50×63 f1j1 0.98 | glare·long·firm | long / gwan | 키 여덟 자 여덟 치에 수염이 아름다웠다 → 최장 얼굴(63)·긴 수염 22 |
| 유엽 | 45×52 f4j2 0.92 | closed·small·closed | goatee / gwan | 한실 종친 책사 → 감은 눈으로 속을 드러내지 않는 인상 |
| 만총 | 49×50 f2j1 1.04 | glare·straight·frown | mustache / gwan | 법을 굽히지 않아 권세가도 두려워함 → 좁은 눈간격(-3)·째려보는 눈·처진 입 |
| 방덕 | 52×52 f2j1 1.07 | sharp·hook·firm | full / helm | 서량 출신, 관을 지고 싸움 → 매부리코·날카로운 눈·투구 |
| 장합 | 47×55 f1j2 0.96 | thin·long·closed | goatee / helm | 변화를 읽는 눈 → 갸름한 턱(0.96)·실눈·긴 코 |
| 문빙 | 49×51 f0j0 1.01 | open·straight·closed | full / warcloth | 항복이 늦었던 충직함 → 무난한 골격에 전건, 초록 전포 |
| 조휴 | 46×50 f0j0 1.06 | open·straight·smile | mustache / phoenixhelm | "우리 집안의 천리마" → 젊은 얼굴·수염 짧음·봉시투구 |
| 조진 | 52×49 f2j1 1.09 | sharp·wide·firm | full / facehelm | 북벌을 막아낸 총사령관 → 조씨 골격(1.09)·면갑투구 |
| 사마의 | 46×59 f1j2 0.93 | thin·hook·firm | long / gwan | 낭고상(狼顧相), 노회함 → 크게 돌린 고개(-5)·실눈·매부리코·회색 장수염 |
| 등애 | 51×54 f2j1 1.02 | sanpaku·wide·open | full / helm | 말더듬 둔전관 출신의 노장 → 흰머리·사백안·벌린 입 |
| 종회 | 44×55 f4j2 0.89 | sharp·straight·smile | none / gwan | 명문 자제의 재기와 야심 → 마른 얼굴·날카로운 눈·웃는 입 |
| 학소 | 53×47 f3j1 1.11 | glare·wide·firm | bushy / helm | 천여 명으로 진창을 지킨 수성가 → 넓은 턱(1.11)·째려보는 눈·범수염 |
| 진태 | 48×53 f1j0 0.99 | thin·straight·closed | goatee / helm | 침착한 서북 방면군 → 중간 골격·실눈 |
| 이통 | 51×48 f2j1 1.05 | big·wide·open | whisker / warcloth | 여남에서 스스로 일어난 호족 → 검은 피부·큰 눈·구레나룻 |
| 여건 | 50×52 f0j0 1 | open·straight·closed | full / helm | 견실한 지방 평정 → 표준 골격·턱수염 |
| 전예 | 47×51 f1j0 0.97 | gentle·straight·closed | goatee / fur | 북방 이민족을 다스림 → 모피관·어진 눈 |
| 유비 | 49×54 f1j0 0.98 | gentle·straight·closed | goatee / crown | 귀가 어깨에 닿았다는 묘사 → 큰 귀·어진 눈·면류관, 벌어진 눈간격(2) |
| 관우 | 47×60 f1j1 0.99 | sharp·long·firm | long / warcloth | 붉은 얼굴에 두 자 수염, 봉안 → 홍안·긴 얼굴(60)·날카로운 눈·장수염 24·녹색 두건 |
| 장비 | 57×49 f3j1 1.14 | big·wide·open | bushy / helm | 표범 머리 고리눈 → 최대급 폭(57)·턱계수 1.14·고리눈·범수염 |
| 조운 | 46×53 f1j2 0.93 | open·straight·closed | none / phoenixhelm | 백마를 탄 미장부 → 갸름한 턱(0.93)·수염 없음·꿩깃 투구 |
| 제갈량 | 44×57 f4j2 0.88 | thin·straight·closed | goatee / silk | 윤건에 학창의, 백우선 → 마른 긴 얼굴·실눈·백우선·흰 유건 |
| 방통 | 53×46 f3j1 1.1 | sanpaku·wide·frown | bushy / silk | 생김이 볼품없어 홀대받음 → 넓적한 얼굴(53×46)·사백안·굵은 눈썹 |
| 황충 | 52×51 f2j1 1.08 | sharp·hook·firm | whitelong / helm | 늙어서도 활을 당긴 노장 → 흰 수염·매부리코·투구 |
| 마초 | 46×52 f1j2 0.92 | sharp·straight·firm | none / phoenixhelm | "금마초"라 불린 서량의 미남 → 젊은 얼굴·날카로운 눈·꿩깃 투구 |
| 마대 | 48×51 f1j1 1.02 | open·straight·closed | full / warcloth | 마씨 일족을 지탱 → 마씨 골격 공유·전건 |
| 위연 | 51×55 f2j1 1.06 | glare·hook·frown | full / helm | 용맹하나 반골로 몰림 → 째려보는 눈·매부리코·처진 입·흉터 |
| 강유 | 45×53 f1j2 0.94 | open·straight·closed | mustache / helm | 제갈량의 후계 → 젊은 얼굴·표준 눈·투구 |
| 법정 | 44×54 f4j2 0.89 | glare·hook·frown | goatee / gwan | 은원이 분명해 원한을 곧바로 갚음 → 째려보는 눈·매부리코·처진 입 |
| 서서 | 46×55 f1j0 0.96 | sharp·straight·closed | goatee / wrap | 검을 차고 협객으로 살다 학문에 듦 → 무인의 날카로운 눈에 두건 |
| 미축 | 50×50 f0j0 1.04 | smile·wide·smile | goatee / gwan | 곳간을 연 부호 → 웃는 눈·웃는 입·관복 |
| 손건 | 47×52 f1j0 0.97 | gentle·straight·smile | goatee / gwan | 유비의 입이 된 사신 → 어진 눈·웃는 입 |
| 간옹 | 45×50 f4j2 0.91 | smile·small·smile | mustache / silk | 오만해 보일 만큼 태연자약 → 웃는 눈·고개를 크게 돌림(5) |
| 이적 | 48×53 f1j0 0.99 | thin·straight·closed | goatee / gwan | 채모의 흉계를 몰래 알림 → 실눈·관모 |
| 요화 | 50×54 f2j1 1.05 | open·wide·firm | whitelong / helm | 황건에서 촉의 마지막까지 → 흰머리·투구 |
| 관평 | 45×55 f1j1 0.98 | sharp·long·firm | none / warcloth | 관우의 아들 → 관씨 홍안·긴 얼굴 공유, 수염 없음으로 구분 |
| 관흥 | 46×57 f1j1 1 | sharp·long·firm | mustache / phoenixhelm | 아버지의 청룡도를 이음 → 관씨 홍안, 봉시투구와 콧수염으로 형과 구분 |
| 장포 | 54×50 f3j1 1.12 | big·wide·open | full / helm | 장비를 닮은 기세 → 장씨 넓은 턱(1.12)·고리눈 공유, 턱수염으로 구분 |
| 왕평 | 52×48 f2j1 1.07 | glare·wide·firm | full / warcloth | 글자를 열 자도 몰랐으나 명장 → 검은 피부·째려보는 눈·전건 |
| 오반 | 49×52 f0j0 1.01 | open·straight·closed | full / helm | 수륙 양면의 선봉 → 표준 골격·투구 |
| 유봉 | 48×51 f0j1 1.03 | sharp·straight·frown | none / helm | 유비의 양자, 끝이 좋지 않음 → 젊은 얼굴·날카로운 눈·처진 입 |
| 맹달 | 47×53 f1j2 0.95 | sanpaku·hook·smile | goatee / wrap | 세 번 주인을 바꿈 → 사백안·매부리코·웃는 입 |
| 곽준 | 51×50 f2j1 1.06 | open·straight·firm | full / helm | 가맹관을 지킨 신중함 → 넓은 얼굴·투구 |
| 장익 | 47×54 f1j1 0.98 | thin·straight·firm | full / helm | 강유의 잦은 출병에 반대 → 실눈·굳은 입 |
| 마속 | 44×52 f4j2 0.9 | open·small·smile | none / gwan | 재기가 넘쳤으나 실전에서 무너짐 → 젊고 마른 얼굴·치켜올린 눈썹·웃는 입 |
| 장완 | 48×56 f1j0 0.96 | gentle·straight·closed | goatee / gwan | 제갈량의 후계, 침착 → 어진 눈·관모·관복 |
| 비의 | 46×53 f1j2 0.93 | smile·small·smile | mustache / gwan | 손권의 시험을 웃음으로 넘긴 달변 → 웃는 눈·웃는 입 |
| 동윤 | 47×55 f1j0 0.97 | glare·straight·firm | goatee / gwan | 환관 황호를 억누른 강직 → 일자 눈썹·째려보는 눈 |
| 손견 | 53×52 f2j1 1.09 | sharp·wide·firm | full / helm | 강동의 호랑이 → 넓은 사각 얼굴·굵은 눈썹·날카로운 눈 |
| 손책 | 47×51 f0j2 1.05 | sharp·straight·smile | none / phoenixhelm | 소패왕, 스물여섯의 젊음 → 손씨 골격에 갸름한 턱·수염 없음·웃는 입 |
| 손권 | 51×50 f2j1 1.07 | big·straight·firm | full / crown | 자줏빛 수염에 푸른 눈 → 손씨 중 가장 넓은 턱·큰 눈·자주색 전포 |
| 주유 | 45×55 f1j2 0.91 | sharp·straight·closed | mustache / gwan | 풍채 당당한 미장부 → 갸름한 턱(0.91)·아치 눈썹·콧수염만 |
| 주태 | 54×49 f3j1 1.11 | glare·wide·firm | bushy / warcloth | 몸에 수십 군데 흉터 → 넓은 턱·흉터·범수염 |
| 감녕 | 50×51 f2j1 1.06 | big·wide·open | bushy / warcloth | 허리에 방울을 단 금범적 → 검은 피부·큰 눈·귀걸이·붉은 전건 |
| 태사자 | 48×56 f1j1 1.02 | sharp·long·firm | full / helm | 손책과 하루 종일 겨룸 → 긴 얼굴·날카로운 눈·긴 코 |
| 황개 | 52×53 f2j1 1.08 | glare·hook·firm | whitelong / helm | 고육계의 노장 → 흰 장수염·굵은 눈썹·매부리코 |
| 한당 | 50×54 f1j1 1.04 | open·straight·closed | full / helm | 손씨 삼대의 옛 신하 → 흰머리·표준 눈 |
| 정보 | 51×55 f1j1 1.03 | gentle·straight·closed | whitelong / helm | "공근과 사귀면 향기로운 술에 취한 듯" → 흰 장수염·어진 눈 |
| 여몽 | 52×50 f2j1 1.05 | open·wide·firm | full / helm | 괄목상대 → 일자 눈썹에서 표준 눈으로, 넓은 얼굴·투구 |
| 육손 | 44×54 f4j2 0.89 | thin·straight·closed | none / gwan | 서생이라 얕보인 젊은 도독 → 최소급 폭(44)·아치 눈썹·수염 없음 |
| 노숙 | 53×51 f3j0 1.09 | gentle·wide·smile | full / gwan | 곳간을 통째로 내준 대인 → 넓고 둥근 얼굴·어진 눈·웃는 입 |
| 장소 | 47×57 f1j2 0.94 | glare·straight·frown | whitelong / gwan | 적벽에서 항복을 주장한 원로 → 흰 장수염·일자 눈썹·처진 입·관복 |
| 제갈근 | 43×62 f1j2 0.9 | gentle·long·closed | goatee / gwan | 얼굴이 길어 농담거리가 됨 → 최장급 얼굴(62)·긴 코 |
| 서성 | 49×52 f1j1 1.01 | sharp·straight·firm | goatee / helm | 적은 병력으로 큰 적을 막음 → 날카로운 눈·투구 |
| 정봉 | 51×53 f2j1 1.07 | sharp·wide·firm | full / fur | 눈 속에서 갑옷을 벗고 싸움 → 모피관·굵은 눈썹 |
| 반장 | 50×49 f2j1 1.06 | sanpaku·hook·frown | full / warcloth | 재물을 밝힘 → 사백안·매부리코·처진 입 |
| 능통 | 46×52 f1j2 0.95 | sharp·straight·firm | mustache / helm | 감녕과 원수였다가 벗이 됨 → 젊은 얼굴·날카로운 눈 |
| 여범 | 49×54 f1j0 0.99 | thin·straight·closed | goatee / gwan | 재정을 맡아 군량을 끊이지 않게 함 → 실눈·관복 |
| 고옹 | 45×58 f4j2 0.88 | closed·straight·firm | whitelong / gwan | 말수가 적어 "고공이 말하지 않으면 까닭이 있다" → 감은 눈·굳은 입 |
| 주환 | 48×50 f0j1 1.04 | big·straight·open | mustache / helm | 부하 수천의 이름을 기억 → 큰 눈·벌린 입 |
| 주연 | 50×53 f1j1 1.02 | open·straight·closed | full / helm | 강릉을 반년 지킴 → 표준 골격·투구 |
| 손유 | 49×51 f0j0 1.05 | open·straight·smile | goatee / warcloth | 손씨 일족의 장수 → 손씨 골격·웃는 입 |
| 동탁 | 59×46 f0j0 1.13 | big·wide·open | full / crown | 미오에 곡식을 쌓아둔 비대한 폭군 → 최대 폭(59)·살찜·고리눈·면류관 |
| 여포 | 48×54 f1j1 1.02 | sharp·straight·frown | mustache / phoenixhelm | "사람 중엔 여포" → 봉시투구·날카로운 눈·크게 돌린 고개(-5) |
| 진궁 | 45×56 f4j2 0.9 | glare·straight·firm | goatee / gwan | 조조를 버린 강직 → 일자 눈썹·째려보는 눈 |
| 고순 | 51×52 f2j1 1.06 | glare·straight·firm | full / facehelm | 함진영의 과묵한 장수 → 일자 눈썹·면갑투구 |
| 이유 | 44×55 f4j2 0.87 | thin·hook·frown | goatee / gwan | 동탁의 머리 → 최마름(0.87)·매부리코·처진 입 |
| 이각 | 53×50 f2j1 1.1 | sanpaku·wide·open | bushy / warcloth | 장안을 짓밟은 서량 군벌 → 검은 피부·사백안·범수염·흉터 |
| 곽사 | 52×48 f3j1 1.08 | glare·wide·frown | whisker / warcloth | 이각과 서로를 의심 → 째려보는 눈·구레나룻 |
| 화웅 | 56×51 f3j1 1.14 | big·wide·open | bushy / helm | 사수관의 맹장 → 큰 폭(56)·고리눈·굵은 눈썹 |
| 서영 | 50×53 f2j1 1.04 | sharp·straight·firm | full / helm | 형양에서 조조를 몰아붙임 → 날카로운 눈·투구 |
| 장제 | 49×50 f0j1 1.03 | open·straight·closed | full / helm | 서량 장수, 조카 장수와 완성에 자리 → 표준 골격 |
| 마등 | 54×54 f2j1 1.09 | sharp·hook·firm | whitelong / helm | 복파장군의 후예, 강족의 신망 → 흰 장수염·굵은 눈썹·매부리코 |
| 한수 | 50×56 f1j1 1 | thin·long·frown | whitelong / wrap | 마등과 의형제였다 원수가 됨 → 흰 장수염·처진 입·두건 |
| 원소 | 50×57 f1j1 1.02 | gentle·straight·closed | long / crown | 사세삼공의 명문, 겉으로 너그러움 → 긴 얼굴·아치 눈썹·어진 눈·면류관 |
| 안량 | 53×51 f2j1 1.1 | big·wide·firm | full / helm | 하북의 명장 → 넓은 턱·큰 눈·굵은 눈썹 |
| 문추 | 55×49 f3j1 1.12 | glare·wide·open | bushy / helm | 안량과 나란한 맹장 → 안량보다 더 넓은 턱(1.12)·범수염으로 구분 |
| 전풍 | 44×58 f4j2 0.86 | glare·long·frown | goatee / gwan | 강직해 바른말을 참지 못함 → 최마름(0.86)·째려보는 눈·처진 입 |
| 저수 | 46×57 f1j2 0.92 | thin·straight·firm | whitelong / gwan | 지구전을 주장 → 흰 장수염·실눈 |
| 심배 | 49×54 f2j1 1.01 | glare·straight·firm | full / gwan | 기주를 마지막까지 지킴 → 일자 눈썹·째려보는 눈 |
| 곽도 | 47×52 f4j2 0.94 | sanpaku·hook·smile | goatee / gwan | 말재주로 참소 → 사백안·매부리코·웃는 입 |
| 고람 | 51×51 f2j1 1.07 | sharp·straight·firm | full / helm | 하북사정정 → 표준 무장 골격 |
| 원담 | 49×55 f1j1 1.03 | sharp·straight·frown | goatee / helm | 후계를 다툰 맏아들 → 원씨 골격·날카로운 눈·처진 입 |
| 원상 | 46×53 f1j2 0.96 | open·straight·smile | none / crown | 원소가 사랑한 막내 → 원씨 골격에 젊은 얼굴·수염 없음 |
| 원희 | 48×54 f1j0 0.99 | gentle·straight·closed | mustache / gwan | 유주를 맡은 둘째 → 원씨 골격·어진 눈 |
| 원술 | 55×48 f0j0 1.11 | sleepy·wide·frown | full / crown | 옥새를 품고 칭제한 사치 → 살찐 얼굴·졸린 눈·처진 눈썹·면류관 |
| 기령 | 53×52 f3j1 1.09 | big·wide·open | bushy / helm | 삼첨도의 대장 → 넓은 턱·고리눈·범수염 |
| 뇌박 | 50×47 f2j1 1.05 | glare·wide·frown | whisker / topknot | 수춘이 무너지자 산으로 → 째려보는 눈·상투 |
| 공손찬 | 49×55 f1j1 1.04 | sharp·straight·firm | full / helm | 백마의종을 거느린 북방의 위세 → 흰 말에 맞춘 흰 전포·날카로운 눈 |
| 엄강 | 51×50 f2j1 1.06 | open·wide·closed | full / helm | 공손찬의 부장 → 무난한 무장 골격 |
| 전해 | 48×52 f1j0 1 | open·straight·closed | goatee / warcloth | 북해의 무장 → 표준 골격·전건 |
| 유표 | 47×60 f1j0 0.95 | gentle·long·closed | whitelong / crown | 팔준의 한 사람, 학문을 일으킴 → 긴 얼굴(60)·아치 눈썹·백장수염·면류관 |
| 채모 | 52×51 f2j1 1.07 | sanpaku·hook·smile | full / helm | 형주 제일의 호족, 처세에 능함 → 사백안·매부리코·웃는 입 |
| 장윤 | 49×49 f0j0 1.02 | thin·straight·frown | mustache / warcloth | 채모와 함께 수군을 쥠 → 실눈·처진 입 |
| 황조 | 53×53 f2j1 1.08 | glare·wide·firm | full / helm | 손씨와 삼대의 원수 → 흰머리·굵은 눈썹·째려보는 눈 |
| 괴량 | 45×55 f4j2 0.91 | thin·straight·closed | goatee / gwan | 형주의 지략가 → 여윈 얼굴·실눈 |
| 괴월 | 46×56 f4j2 0.93 | closed·straight·smile | goatee / gwan | 조조가 형주보다 얻은 것을 기뻐함 → 감은 눈·웃는 입으로 형 괴량과 구분 |
| 유기 | 44×53 f4j2 0.89 | sleepy·small·closed | none / silk | 계모의 시샘에 쫓김 → 병약한 인상, 졸린 눈·처진 눈썹 |
| 유종 | 47×46 f0j2 0.97 | big·small·open | none / gwan | 어린 나이에 형주를 넘김 → 짧은 얼굴(46)·큰 눈·벌린 입 |
| 유장 | 53×49 f0j0 1.07 | sleepy·wide·closed | goatee / crown | 마음이 약하고 결단이 없음 → 살찐 얼굴·졸린 눈·처진 눈썹 |
| 장임 | 50×54 f1j1 1.05 | sharp·straight·firm | full / helm | 낙봉파에 활을 묻은 익주 명장 → 날카로운 눈·투구 |
| 엄안 | 52×55 f2j1 1.06 | glare·hook·firm | whitelong / helm | "머리를 자를지언정 항복은 없다" → 백발·굵은 눈썹·긴 흰 수염 21 |
| 오의 | 49×52 f1j1 1.01 | open·straight·closed | full / helm | 신중한 익주 장수 → 표준 골격 |
| 이엄 | 48×56 f1j2 0.96 | thin·long·firm | goatee / gwan | 후사를 맡았으나 군량을 그르침 → 치켜올린 눈썹·긴 코 |
| 황권 | 47×55 f1j0 0.98 | glare·straight·firm | goatee / gwan | 유비의 입촉을 끝까지 반대 → 일자 눈썹·째려보는 눈 |
| 장로 | 48×57 f1j2 0.94 | closed·straight·smile | whitelong / daoist | 오두미도의 세 번째 스승 → 도관·누런 도포·감은 눈·백장수염 |
| 양송 | 46×48 f0j2 0.95 | sanpaku·hook·smile | mustache / gwan | 뇌물을 밝혀 장로의 눈을 가림 → 사백안·매부리코·웃는 입·벌어진 눈간격(3) |
| 양임 | 51×51 f2j1 1.04 | sharp·straight·firm | full / warcloth | 한중의 장수 → 표준 무장 골격·전건 |
| 도겸 | 47×58 f1j2 0.92 | droop·long·frown | whitelong / gwan | 유능하나 냉혹한 면이 있던 노신 → 백발·처진 눈·처진 입 |
| 조표 | 51×50 f2j1 1.05 | glare·wide·frown | full / helm | 여포에게 성문을 열어 줌 → 째려보는 눈·처진 입 |
| 진등 | 45×53 f4j2 0.9 | sharp·straight·smile | none / silk | 호기 넘치는 젊은 인재 → 마른 얼굴·날카로운 눈·수염 없음·유건 |
| 진규 | 47×56 f1j2 0.93 | thin·straight·smile | whitelong / gwan | 혼사를 말재주로 깨뜨림 → 진씨 골격 공유, 백장수염·웃는 입으로 아들과 구분 |
| 한복 | 50×48 f0j0 1.02 | sleepy·small·open | goatee / gwan | 겁을 먹고 기주를 넘김 → 졸린 눈·처진 눈썹·벌린 입 |
| 국의 | 50×53 f2j1 1.06 | sharp·straight·firm | goatee / helm | 계교에서 강노로 백마의종을 부숨 → 치켜올린 눈썹·날카로운 눈 |
| 공융 | 46×57 f4j2 0.91 | gentle·straight·smile | whitelong / gwan | 공자의 후손, 건안칠자 → 여윈 얼굴·아치 눈썹·어진 눈·백장수염·관복 |
| 왕랑 | 49×56 f1j0 0.99 | thin·straight·firm | whitelong / gwan | 경학에 밝은 삼공 → 백장수염·실눈·관복 |
| 엄백호 | 54×47 f3j1 1.1 | big·wide·open | bushy / topknot | 스스로 덕왕을 칭한 호족 → 넓은 턱·고리눈·범수염·상투 |
| 유요 | 48×54 f1j0 0.97 | gentle·straight·closed | goatee / gwan | 양주자사 → 어진 눈·관모 |
| 장영 | 51×49 f2j1 1.04 | open·straight·firm | mustache / helm | 우저에서 손책과 싸움 → 표준 무장 골격 |
| 사섭 | 48×58 f1j2 0.95 | gentle·straight·smile | whitelong / gwan | 교주를 사십 년 다스린 남방의 어른 → 백발·아치 눈썹·어진 눈·백장수염·관복 |
| 장연 | 47×50 f1j2 0.96 | sharp·small·firm | mustache / wrap | 몸이 날래 "비연" → 좁은 얼굴·작은 코·두건 |
| 맹획 | 55×50 f3j1 1.12 | big·wide·open | bushy / feather | 남만왕 → 짙은 피부·깃털관·고리눈·귀걸이·범수염 |
| 김선 | 49×51 f0j0 1.01 | open·straight·closed | goatee / gwan | 계양태수 → 무난한 골격 |
| 한현 | 52×48 f0j0 1.05 | glare·wide·frown | full / gwan | 황충을 의심해 베려 함 → 살찐 얼굴·째려보는 눈·처진 입 |
| 조범 | 47×52 f1j0 0.98 | thin·straight·smile | mustache / gwan | 조운에게 형수를 시집보내려 함 → 실눈·웃는 입 |
| 유도 | 50×52 f0j0 1.03 | gentle·straight·closed | full / gwan | 영릉태수 → 흰머리·어진 눈 |
| 사마휘 | 45×59 f4j2 0.88 | smile·straight·smile | whitelong / silk | "좋다"는 말만 했다는 호인 수경선생 → 백발·웃는 눈·웃는 입·백우선 |
| 공손탁 | 51×53 f2j1 1.05 | thin·straight·firm | full / fur | 요동에 반독립 왕국 → 모피관·실눈 |
| 포신 | 50×51 f2j1 1.03 | open·straight·firm | full / helm | 동탁의 야심을 꿰뚫어 봄 → 표준 무장 골격 |
| 왕윤 | 46×58 f1j2 0.9 | glare·long·firm | whitelong / gwan | 연환계로 동탁을 제거한 사도 → 백장수염·일자 눈썹·째려보는 눈·관복 |
| 허유 | 48×51 f0j2 0.99 | sanpaku·hook·smile | goatee / wrap | 공을 믿고 오만하다 죽음 → 사백안·매부리코·웃는 입·벌어진 눈간격(3) |
| 공손강 | 50×54 f1j1 1.06 | sharp·straight·firm | full / fur | 원씨 형제의 목을 베어 보냄 → 공손씨 골격·모피관·날카로운 눈 |
| 진림 | 44×55 f4j2 0.87 | thin·straight·smile | goatee / silk | 격문으로 조조의 두통을 낫게 함 → 최마름(0.87)·아치 눈썹·웃는 입 |
| 가후 | 45×57 f4j2 0.87 | closed·hook·smile | goatee / gwan | 독사라 불린 처세의 달인 → 감은 눈·매부리코·웃는 입, 고개를 크게 돌림(5) |
| 하후패 | 50×54 f1j1 1.06 | sharp·long·frown | full / helm | 아버지의 원수를 갚으려다 촉으로 망명 → 하후씨 골격 공유·처진 입 |
| 곽회 | 49×53 f2j0 1.03 | thin·straight·firm | full / helm | 관중의 방벽 → 넓은 사각 얼굴·실눈 |
| 문앙 | 45×50 f0j2 0.95 | big·small·open | none / phoenixhelm | 열여덟에 사마사를 놀라 죽게 한 맹장 → 최연소·큰 눈·봉시투구 |
| 장각 | 49×60 f1j2 0.94 | glare·hook·firm | whitelong / daoist | 태평도 교주 → 도관·누런 도포·긴 얼굴(60)·째려보는 눈·백장수염 23 |
| 장보 | 51×53 f2j1 1.02 | sharp·straight·firm | full / daoist | 지공장군 → 장씨 골격 공유·날카로운 눈 |
| 장량 | 52×51 f2j1 1.04 | glare·wide·open | goatee / daoist | 인공장군 → 장씨 골격 공유·째려보는 눈·벌린 입으로 형들과 구분 |
| 황보숭 | 52×56 f2j1 1.07 | sharp·straight·firm | whitelong / facehelm | 황건을 실제로 진압한 명장 → 흰 장수염·면갑투구·일자 눈썹 |
| 주준 | 50×55 f1j1 1.01 | open·straight·firm | full / helm | 완성을 칠 때 손견을 선봉에 세움 → 흰머리·투구 |
| 노식 | 47×59 f1j2 0.93 | gentle·long·closed | whitelong / gwan | 유비의 스승인 대유학자 → 여윈 긴 얼굴·아치 눈썹·백장수염·관복 |
| 하진 | 56×49 f3j1 1.11 | sleepy·wide·open | full / gwan | 백정 출신 대장군 → 최대급 폭(56)·살찜·졸린 눈·벌린 입 |
| 장수 | 48×52 f1j1 1 | sharp·straight·firm | mustache / phoenixhelm | 완성에서 조조를 두 번 몰아붙임 → 젊은 얼굴·봉시투구·날카로운 눈 |
| 유선 | 52×47 f0j0 1.06 | sleepy·small·open | none / crown | 암군의 대명사 → 둥글고 살찐 얼굴·졸린 눈·처진 눈썹·큰 귀(유씨) |
| 조비 | 47×54 f1j2 0.94 | thin·straight·frown | mustache / crown | 문장가이자 시기심 → 실눈·처진 입·면류관 |
| 조예 | 48×52 f1j0 1 | gentle·straight·closed | goatee / crown | 판단이 밝았던 황제 → 어진 눈·면류관 |
| 사마사 | 49×57 f1j1 0.97 | glare·hook·firm | full / gwan | 눈의 종기가 터져 죽음 → 흉터·째려보는 눈 |
| 사마소 | 51×55 f2j1 1.01 | sanpaku·hook·smile | full / crown | "사마소의 마음은 길 가는 사람도 안다" → 사백안·웃는 입·면류관 |
| 제갈각 | 46×59 f1j2 0.92 | sanpaku·long·smile | goatee / gwan | 재치가 넘쳤으나 교만 → 제갈씨 긴 얼굴·사백안·웃는 입 |
| 관구검 | 51×54 f2j1 1.05 | glare·straight·firm | full / facehelm | 고구려를 친 유주자사 → 면갑투구·일자 눈썹·째려보는 눈 |
| 제갈탄 | 49×56 f1j1 0.98 | sharp·long·firm | full / helm | 회남에서 사마씨에 맞섬 → 제갈씨 긴 얼굴·날카로운 눈·긴 코 |
| 육항 | 46×55 f1j2 0.91 | gentle·straight·closed | goatee / gwan | 오나라 최후의 기둥, 양호와의 우정 → 육씨 골격 공유·어진 눈 |
| 화타 | 46×56 f4j2 0.9 | gentle·straight·smile | whitelong / silk | 마취 수술을 한 신의 → 백발·어진 눈·백장수염·유건 |
| 종요 | 44×56 f4j2 0.91 | gentle·straight·closed | whitelong / gwan | 해서(楷書)의 아버지 → 마른 얼굴·어진 눈·백장수염 |
| 보즐 | 47×53 f4j2 0.93 | gentle·small·smile | goatee / wrap | 가난한 선비에서 승상까지 → 여윈 얼굴·어진 눈·두건 |
