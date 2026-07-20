# M4 QA 리포트 (1차) — SAVE (저장·비교·공유·구매목록)

판정: **PASS** · High 0 · Mid 0 · Low 0 (경계면 결함 없음)

- BE 실기동(8080) + curl E2E 전 흐름 실행, FE `npm run build` 통과(mock off, 실 API).
- 정적 교차비교(BE `share/ShareDtos`·컨트롤러·`ShareService` ↔ FE `types/save.ts`·`api/save.ts`·`pages/save/*`) 필드/enum/중첩/null 1:1 일치.
- 재현 스크립트: `_workspace/qa_scripts/m4.sh`

## 버그
없음.

## 통과 항목 (실행 검증)

| # | 검증 포인트 | 계약 기준 | 실제 결과 |
|---|------------|-----------|-----------|
| 1 | 공개뷰 **비인증** GET /share/{token} | 200 (permitAll) | 인증 헤더 없이 200, 전체 데이터 렌더 ✅ |
| 2 | 링크 회수 후 공개뷰 | 410 SHARE_001 | 410 + `{code:SHARE_001}` ✅ / FE `getPublicShare`가 `Error('SHARE_001')`로 정규화→`ExpiredView` ✅ |
| 2b| 존재하지 않는 토큰 | 410 (정보 은닉) | 410 SHARE_001 (유효 토큰 존재 여부 비노출) ✅ |
| 3 | 공개뷰 민감정보 제외 | purchaseUrl 등 제외 | `purchaseUrl` 미노출 확인(grep 0건) ✅ |
| 3b| originalPhotos 토글 | false→[], true→원본 | false=`[]`, true=`["/files/..jpg"]`(floorPlan 제외) ✅ |
| 4 | 저장→/saved 반영 | saved=true 목록, savedAt desc | 3건 반영, 내림차순 ✅ |
| 4b| 단일 대표(select) | 같은 spaceId 다른 안 자동 해제 | RID_A select 후 RID_B select → RID_A `selected:false`, RID_B `true` ✅ |
| 5 | 비교 개수 | 2~3 아니면 VALID_003 | 1개→VALID_003(400) ✅ |
| 5b| 같은/다른 공간 비교 | 같은 200 sameSpace:true / 다른 200 sameSpace:false | 각각 정확 ✅ (FE `!sameSpace`→경고 배너) |
| 5c| 타인 포함 비교 | AUTH_003 | 403 AUTH_003 ✅ |
| 6 | 구매목록 필드/총액 | totalPrice=budgetTotal | items(purchaseUrl 포함)·spaceSummary·totalPrice=3,160,000=budgetTotal 일관 ✅ |
| 7 | 공유 링크 한도 | 추천안당 5개 초과 LIMIT_002 | 6번째 생성 시 409 LIMIT_002 ✅ |
| 8 | 접근제어(교차) | 타인 리소스 403 | B가 A의 save/shopping-list 접근→403 AUTH_003 ✅ |
| 9 | 공유링크 생성 응답 | D30 기본/NONE→expiresAt:null | D30=만료일 존재, NONE=`expiresAt:null` ✅ |
| 10| FE 필드 소비 | 계약 shape 일치 | ComparePage `Object.entries(materialSummary)`, PublicShare `Object.entries(materials)`(m.color/m.material), ShoppingList spaceSummary/totalPrice, SharePage shareUrl/expiresAt/revoked 모두 일치 ✅ |

## 관찰 (버그 아님, 조치 불요)
- 공개뷰 `materials.*`에 `reason`/`expertRequired`(디자인 근거)가 포함됨. 계약상 "민감정보 제외 **가능**"(선택)이며 민감정보 아님, FE는 color/material만 사용 → 무해. 필요 시 축소 여지.
- shopping-list `measureBeforeBuy=[]`: M3 FitScore가 치수 여유 충분 시 빈 배열 반환하는 로직 소관(M4 배선 정상).

## 계약 보완 요청
없음.

## 정리
- 테스트 데이터는 H2 인메모리(재기동 시 소멸). BE 종료로 정리 완료.
