# M3 (RECO) 프론트엔드 구현 보고서

계약: `_workspace/contracts/m3.md` 기준. `npm run build` 통과, dev 서버(mock)로 전체 플로우 렌더·콘솔 무오류 확인.

## 구현 화면 (7)

| 화면ID | 라우트 | 파일 | 원본 |
|--------|--------|------|------|
| RECO-001/002 조건 설정 | `/reco` | `pages/reco/RecoSetupPage.tsx` | _10 |
| RECO-003 분석 진행 | `/reco/jobs/:analysisId` | `pages/reco/AnalysisProgressPage.tsx` | ai_2 |
| RECO-004 요약 | `/reco/summary/:analysisId` | `pages/reco/RecoSummaryPage.tsx` | _4 |
| RECO-005 상세 | `/reco/:recommendationId` | `pages/reco/RecommendationDetailPage.tsx` | _4 섹션 + IA 8섹션 |
| RECO-006 전후 비교 | `/reco/:recommendationId/compare` | `pages/reco/BeforeAfterPage.tsx` | _5 |
| RECO-007 가구 상세 | `/reco/:recommendationId/items/:itemId` | `pages/reco/FurnitureDetailPage.tsx` | _17 |
| RECO-008 전문가 확인 | `/reco/:recommendationId/expert` | `pages/reco/ExpertNoticePage.tsx` | _11 |

`/reco`만 하단 탭 셸, 나머지 결과 플로우는 포커스 화면(back 헤더). 라우트는 `main.tsx` RequireAuth 블록에 등록. 기존 placeholder `pages/RecoPage.tsx` 삭제.

## 사용 엔드포인트 (계약 그대로)

- `POST /analyses` → 202 `{analysisId,status,estimatedSeconds}` — 조건 설정 제출
- `GET /analyses/{id}` — **5초 폴링**(usePolling), progress/currentStepLabel 표시, COMPLETED→recommendationIds로 요약 이동, FAILED→failureReason+재시도
- `GET /recommendations/{id}` — 요약·상세·가구상세·전문가확인 4개 화면이 공유(계약 결정 6: 별도 가구 API 없음)
- `GET /recommendations/{id}/visuals` — 전후 비교
- `POST /recommendations/{id}/visuals/regenerate` — api 함수만 정의(스텁, UI 트리거 미노출)

계약 필드/enum 100% 준수: BudgetRange, JobStatus, Verdict, StoragePreference, HousingType, StyleType(6), FurnitureType(10). 타입은 `types/reco.ts`(StyleType/FurnitureType는 M1/M2 재사용).

## 신규·차별화 UI

- **생활방식 설문**(lifestyle 8필드): 스테퍼(거주인원/거주연수), 토글(아이/반려동물/재택/요리), 세그먼트(수납선호/주거형태). 항상 유효한 기본값 → VALID 방지.
- **fitScore 신호등**: GOOD 초록 / CHECK 노랑 / BLOCKED 빨강 (`VERDICT_META`) + measureBeforeBuy(실측 권장) 목록.
- **reason 노출**: layout·materials·items 각 항목에 "추천 이유" 라인.
- **expertRequired**: materials/items에 경고 배지 → RECO-008 이동. 상세 하단에 "전문가 확인 N건" 집계 CTA.
- **실제 제품형 가구 카드**: 브랜드/제품명/치수(W×D×H)/가격/배치/구매링크.
- **AI 한계 고지**(FR-RECO-012): 공통 `components/AiNoticeBanner.tsx`. 상세는 최상단 sticky, 요약/비교는 고지 배너 포함.

## 폴링 처리

`hooks/usePolling.ts` — 즉시 1회 + 5초 interval. `isDone`(COMPLETED|FAILED) 또는 에러 시 clearInterval, 언마운트 시 alive 플래그+clearInterval 정리. 완료 이동은 useEffect(렌더 중 navigate 금지).

## 계약 대비 판단

- 예산: 원본 _10은 슬라이더(만원)이나 계약 enum은 5구간(discrete) → 슬라이더 대신 5구간 선택 버튼으로 이식(enum 정확 매핑).
- 원격 이미지: 스타일 카드/After 이미지 등 만료 위험 원격 이미지는 그라디언트/placehold.co 플레이스홀더로 대체. layout.imageUrl·visuals.beforeUrl/afterUrl은 API url 바인딩(데이터성).
- keepFurnitureIds: 선택 공간 상세(M2 `getSpace`)의 가구를 노출해 유지 토글로 수집(계약 optional).
- 이미지 저장/공유(_5 버튼)는 SAVE 모듈 범위로 이번 구현서 제외.

## Mock

`api/mock/reco.ts` (계약 shape 그대로, `VITE_USE_MOCK=true`에서만). 경과시간 기반 상태 진행(~15초), 스타일 수만큼 recommendation 생성. 실연동 시 `api/reco.ts`의 MOCK 스위치 off 한 파일 교체로 끝. **백엔드 미가동으로 실제 연동은 QA 단계에서 검증 필요.**

## 검증

`npm run build` 타입오류 0. dev(mock)로 조건설정→제출(202)→진행폴링(20/40/60%→완료 자동이동)→요약(fitScore 88, 예산 345만원, 탭)→상세(8섹션·신호등·reason·전문가배지)→가구상세→전문가안내(2건)→전후비교 전 구간 렌더 확인, 콘솔 에러 없음.
