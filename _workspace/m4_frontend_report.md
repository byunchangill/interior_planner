# M4 SAVE — Frontend 구현 보고서

계약: `_workspace/contracts/m4.md` 기준. `npm run build` 통과. dev(mock) 브라우저 렌더링 검증 완료(콘솔 무오류).

## 구현 화면

| 화면ID | 라우트 | 파일 | 비고 |
|--------|--------|------|------|
| SAVE-001 보관함 | `/saved` (탭 셸, RequireAuth) | `pages/SavedPage.tsx` | 목록·해제·결정·비교선택·공유/구매목록 진입 |
| SAVE-002 비교 | `/saved/compare?ids=` (포커스, RequireAuth) | `pages/save/ComparePage.tsx` | 2~3열, compareKey 탭, sameSpace 경고, 열 탭→상세 |
| SAVE-003 공유 | `/reco/:recommendationId/share` (포커스) | `pages/save/SharePage.tsx` | _13 한글화, 만료/사진토글, 링크 목록/회수/복사/공유 |
| 공개 공유 뷰 | `/share/:token` (**RequireAuth 밖, 독립 레이아웃**) | `pages/save/PublicSharePage.tsx` | 조회 전용, 410→만료 안내 |
| 구매목록 내보내기 | `/reco/:recommendationId/shopping-list` (포커스) | `pages/save/ShoppingListPage.tsx` | 치수·실측·제품·총액, 텍스트 복사/공유 |

## 신규 파일
- `types/save.ts` — 계약 응답 타입·Enum(CompareKey, ShareExpiry) + 라벨
- `api/save.ts` — 엔드포인트 9종(단일 axios, unwrap). 410→`Error('SHARE_001')` 정규화
- `api/mock/save.ts` — `VITE_USE_MOCK=true` 프리뷰용, 계약 shape 그대로(인메모리 상태)
- `utils/format.ts` — formatWon/formatWonFull/formatDate/formatDims (M4 4개 화면 공용)
- `main.tsx` — 라우트 5개 추가

## 공개 라우트 처리 (핵심)
- `/share/:token`은 `main.tsx` 최상위, RequireAuth·App(BottomNav) 셸 **밖**에 배치 → 비로그인 열람. 자체 max-w-md 독립 레이아웃, 하단 탭 없음.
- 토큰 없이도 `GET /api/v1/share/{token}` 호출(계약상 permitAll). 401 인터셉터 미개입(200/410만 반환).
- 410(SHARE_001) → `getPublicShare`가 `Error('SHARE_001')`로 정규화, 페이지가 만료 안내 뷰 렌더.

## 계약 대비 판단
- **엔드포인트/필드/enum**: 계약과 1:1. `GET /saved`·`share-links`는 `{items:[]}` 래퍼를 API 함수에서 unwrap해 배열만 노출.
- **compareKey**: 응답 shape이 키와 무관하게 동일 → 탭은 재요청(useFetch deps=[ids,key])하며 활성 키 지표 행을 ring으로 강조. 열은 STYLE/BUDGET/LAYOUT/MATERIALS 4개 지표를 모두 표시(비교 가치 유지).
- **원본 사진 경고**: `includeOriginalPhotos` 토글 ON 시 경고 문구를 error색으로 강조 표시(FR 개인정보 요건).
- **공개 뷰 민감정보 제외**: 구매링크·수정 필드 미표시(계약 "보기 전용" 준수). 원본 사진은 `originalPhotos` 비어있지 않을 때만 갤러리 노출.
- **썸네일**: `thumbnailUrl` 있으면 바인딩, 없으면 `STYLE_GRADIENTS` 플레이스홀더(만료 위험 원격 이미지 미사용).

## 미구현/유보
- 위시리스트 탭(_6 우측 탭): FR-SAVE-005 P3 범위 외 → 탭은 유지하되 클릭 시 "준비 중" 토스트.
- 백엔드 미가동 상태로 구현. mock은 `api/mock/save.ts` 한 곳 → 실연동 시 `VITE_USE_MOCK` off만으로 전환. 실제 응답 shape 검증은 QA 단계에서.
