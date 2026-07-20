# M4 백엔드 구현 보고서 — SAVE (저장·비교·공유·구매목록)

상태: **완료**. `./gradlew build` 통과, 실기동 E2E 계약 검증 통과.

## 구현 엔드포인트 (계약 m4.md 전량)

| 메서드 | 경로 | 인증 | 검증 결과 |
|--------|------|------|-----------|
| POST | `/api/v1/recommendations/{id}/save` | 필요 | ✅ `{recommendationId, saved:true}` |
| DELETE | `/api/v1/recommendations/{id}/save` | 필요 | ✅ `{recommendationId, saved:false}` |
| GET | `/api/v1/saved` | 필요 | ✅ 계약 10필드 전부, `savedAt` 내림차순 |
| PUT | `/api/v1/recommendations/{id}/select` | 필요 | ✅ 같은 spaceId 다른 안 selected 자동 해제(단일 대표) |
| POST | `/api/v1/recommendations/compare` | 필요 | ✅ `sameSpace`, `columns[]`, `materialSummary{wallpaper,flooring}`, `keywords` |
| POST | `/api/v1/recommendations/{id}/share-links` | 필요 | ✅ D30 기본, NONE→`expiresAt:null` |
| GET | `/api/v1/recommendations/{id}/share-links` | 필요 | ✅ 관리 목록(revoked 포함) |
| DELETE | `/api/v1/share-links/{id}` | 필요 | ✅ `{linkId, revoked:true}` |
| GET | `/api/v1/share/{token}` | **비인증** | ✅ 200(no auth), 회수 후 **410 SHARE_001** |
| GET | `/api/v1/recommendations/{id}/shopping-list` | 필요 | ✅ `spaceSummary`, `items(purchaseUrl)`, `totalPrice`, `budgetPlanRange` 필터 |

## 결정사항 준수

- **결정 1 (저장 모델)**: 별도 엔티티 없이 `Recommendation`에 `saved`/`selected` boolean + `savedAt` 플래그 추가. 보관함 = `saved=true`. M3 `ownedRecommendation` 소유권 헬퍼를 `public`으로 승격해 재사용.
- **결정 2 (공개 웹뷰)**: `SecurityConfig.PUBLIC_ENDPOINTS`에 `/api/v1/share/**` permitAll **한 줄만** 추가. 나머지 M4 경로는 `anyRequest().authenticated()` 유지.
- **결정 3 (공유 링크 저장)**: `ShareLink` 엔티티(token, recommendationId, expiresAt nullable, includeOriginalPhotos, revoked, createdAt). `isInactive()` = revoked 또는 만료.
- **결정 4 (구매목록)**: 신규 저장 없이 M3 `RecommendationService.detail()`로 items·공간 치수·measureBeforeBuy 재구성.

## 토큰/보안 처리

- **토큰**: `SecureRandom` 16바이트(128bit) → `Base64.getUrlEncoder().withoutPadding()` (URL-safe, 22자). 예: `JkPFcCtsUycz6FgCaH646w`. token 컬럼 unique.
- **공개 뷰 정보 은닉**: 존재하지 않는 토큰도 만료/회수와 동일하게 **410 SHARE_001**로 응답(유효 토큰 존재 여부 노출 방지).
- **공개 뷰 민감정보 제외**: `PublicItem`은 `purchaseUrl`·`itemId`·`reason`·`expertRequired`를 노출하지 않음(brand, name, 치수, price, position만). E2E에서 `purchaseUrl` 미노출 assert 통과. `originalPhotos`는 `includeOriginalPhotos=true` 링크만 채움(floorPlan 제외), 그 외 `[]`.
- **소유권**: save/select/share-link/shopping-list 모두 `recommendationService.ownedRecommendation()` 경유 → 타인 접근 시 403 AUTH_003(E2E 확인). `DELETE /share-links/{id}`는 링크 → recommendationId → 소유권 검증.

## SecurityConfig 변경

`PUBLIC_ENDPOINTS` 배열에 `"/api/v1/share/**"` 1줄 추가. 그 외 무변경.

## ErrorCode 추가

- `SHARE_001` (HTTP **410 GONE**) — 만료/회수된 공유 링크.
- `LIMIT_002` (HTTP 409) — 공유 링크 추천안당 최대 5개 초과.
- `VALID_003`(개수 미달/초과)은 M2에서 이미 정의된 코드를 재사용(메시지만 컨텍스트에 맞게 override).
- `VALID_004`는 **enum 미추가** — 계약상 서로 다른 공간 비교는 차단이 아니라 `200 + sameSpace:false`로 대체되어 throw 지점이 없음(FE가 배너 표시). 불필요한 코드 미생성.

## 계약 대비 판단·특이사항

- **budgetTotal 정의**: 계약에 산출식 명시가 없어 `items[].price` 합계로 통일(= shopping-list `totalPrice`와 동일 기준). saved/compare/share 뷰 모두 일관.
- **thumbnailUrl / afterImageUrl**: 계약 예시대로 `/files/placeholder_<style소문자>.png` / `_after.png` 규칙. M3 visuals와 동일 패턴(placeholder 파일 실제 존재 불필요, URL 문자열).
- **measureBeforeBuy**: M3 `FitScore.measureBeforeBuy`를 그대로 전달. E2E 테스트 데이터에서는 `[]`로 나왔는데, 이는 M3 `FitScoreCalculator`가 치수-가구 여유가 충분할 때 빈 배열을 반환하기 때문(M4 결함 아님, M3 로직 소관). 필드 배선은 정상.
- **compareKey**: STYLE|BUDGET|LAYOUT|MATERIALS 수신하되 컬럼 구조는 계약상 키와 무관하게 동일하므로 서버는 값을 별도 분기 없이 수용(FE가 강조 축 결정). 잘못된 값 검증은 계약에 없어 미적용.
- **성능(ponytail 메모)**: `/saved`·`compare`는 항목마다 `detail()`을 호출해 M3 콘텐츠를 결정적 재생성한다(M3의 "저장 안 함, 조회 시 재생성" 설계 계승). 항목 수가 커지면 N회 재생성 비용이 있으나 v1 보관함 규모에서 수용 가능. 필요 시 배치/캐시로 상향.

## 신규/수정 파일

- 신규: `share/ShareLink.java`, `share/ShareLinkRepository.java`, `share/ShareDtos.java`, `share/ShareService.java`, `share/ShareController.java`, `share/PublicShareController.java`
- 수정: `recommendation/Recommendation.java`(플래그), `recommendation/RecommendationRepository.java`(쿼리 2), `recommendation/RecommendationService.java`(`ownedRecommendation` public, `detailForOwner` 추가), `common/exception/ErrorCode.java`(SHARE_001, LIMIT_002), `common/security/SecurityConfig.java`(share permitAll)
