# HomeStyler 개발 진행 상황

루프 엔지니어링의 단일 진실 원천. 매 이터레이션 시작 시 이 파일을 읽고, 종료 전 반드시 갱신한다.

## 모듈 상태

상태 값: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED(사유)`

| 모듈 | 범위 | 상태 | 완료 기준 | 비고 |
|------|------|------|----------|------|
| M0 | 스캐폴딩 (BE Gradle + FE Vite + 디자인 토큰 + 탭 셸) | DONE | BE 기동 + FE 빌드 + /health 연동 | QA PASS (High 0). Spring Boot 4.1.0·React 19로 버전 확정(계약 갱신됨) |
| M1 | AUTH + HOME 화면 3종 | DONE | 빌드 통과 + QA High 0 | QA PASS (High 0, Medium 1 수정완료). 소셜 로그인은 버튼만. 계약: `_workspace/contracts/m1.md` |
| M2 | SPACE (공간 등록·사진·치수·가구) | DONE | 빌드 통과 + QA High 0 | QA PASS (High 0, Low 2 비차단). EXIF GPS 제거 검증. AI 추정 Mock. 계약: `_workspace/contracts/m2.md` (Home 엔티티 생략·직접 multipart) |
| M3 | RECO (조건 설정·비동기 분석·추천 결과) | TODO | 빌드 통과 + QA High 0 | 비동기 잡 + Mock AI |
| M4 | SAVE (저장·비교·공유 링크) | TODO | 빌드 통과 + QA High 0 | |
| M5 | MY/DATA (마이페이지·원본 삭제·탈퇴) | TODO | 빌드 통과 + QA High 0 | |

## 미구현/Mock 항목 누적

- (M0) `/h2-console` permitAll은 dev 전용 — prod 프로파일 도입 시 제외 필요
- (M1) 소셜 로그인(FR-AUTH-001)은 버튼만 배치, API 미구현 — 소셜 키 확보 후 별도 작업
- (M1) HOME summary의 `recentSpaces`는 항상 빈 배열 — M2로 Space 엔티티 생겼으므로 연결 가능(미연결, 후속)
- (M2) Low 이슈: 미존재 `/files/{name}` GET·깨진 JSON 본문이 404/400 아닌 500 반환 — 정상 흐름 밖, GlobalExceptionHandler 보완 여지
- (M2) 집(Home) 엔티티 생략 — 공간은 User 직속. 다중 집 관리는 범위 밖
- (M2) FR-SPACE-008 이미지 품질 검증은 스텁(Mock 항상 PASSED)

## 이터레이션 로그

| N차 | 대상 모듈 | 수행 내용 | 결과 |
|-----|----------|----------|------|
| 1 | M0 | 계약 작성 → BE(Boot 4.1.0 스캐폴딩+공통 규약) ∥ FE(Vite+React 19+토큰 이식+탭 셸) 병렬 → QA(교차 비교+실행+프록시 E2E) | DONE — QA PASS. Boot 3.x→4.1.0 편차 승인, 계약·스킬 갱신 |
| 2 | M1 | 계약 작성(`m1.md`) → BE(JWT 인증 필터 실구현+AUTH/HOME 8종 엔드포인트) ∥ FE(토큰 인터셉터 완성+화면 8종) 병렬 → QA(E2E 전체 흐름 실행 검증) | DONE — QA PASS. Medium 보안버그(refreshToken이 access로 통용) 발견·수정·회귀통과. 에러코드 계약(VALID_001/COMMON_400) 실구현 기준으로 갱신 |
| - | 기획 | 경쟁 분석 반영: 생활방식 설문·추천이유·적합도점수·구매목록 신설(P1), 상품 스키마 실제제품 형태 확정, srs §7 백로그(BL-001~006) | DONE — docs/srs·functional_spec·module-plan·CLAUDE.md 갱신 |
| 3 | M2 | 계약 작성(`m2.md`, Home 생략·직접 multipart 결정) → BE(Space CRUD+사진/치수/가구+EXIF제거+Mock AI) ∥ FE(7화면) 병렬 → QA(6개 경계면+E2E 실행 검증, 사용자 2명 소유권) | DONE — QA PASS(High 0). EXIF GPS 제거 실검증. Low 2건(미존재 파일/깨진 JSON 500) 비차단 기록 |
