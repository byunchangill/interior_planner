# HomeStyler 개발 진행 상황

루프 엔지니어링의 단일 진실 원천. 매 이터레이션 시작 시 이 파일을 읽고, 종료 전 반드시 갱신한다.

## 모듈 상태

상태 값: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED(사유)`

| 모듈 | 범위 | 상태 | 완료 기준 | 비고 |
|------|------|------|----------|------|
| M0 | 스캐폴딩 (BE Gradle + FE Vite + 디자인 토큰 + 탭 셸) | DONE | BE 기동 + FE 빌드 + /health 연동 | QA PASS (High 0). Spring Boot 4.1.0·React 19로 버전 확정(계약 갱신됨) |
| M1 | AUTH + HOME 화면 3종 | TODO | 빌드 통과 + QA High 0 | 소셜 로그인은 버튼만 |
| M2 | SPACE (공간 등록·사진·치수·가구) | TODO | 빌드 통과 + QA High 0 | AI 추정은 Mock |
| M3 | RECO (조건 설정·비동기 분석·추천 결과) | TODO | 빌드 통과 + QA High 0 | 비동기 잡 + Mock AI |
| M4 | SAVE (저장·비교·공유 링크) | TODO | 빌드 통과 + QA High 0 | |
| M5 | MY/DATA (마이페이지·원본 삭제·탈퇴) | TODO | 빌드 통과 + QA High 0 | |

## 미구현/Mock 항목 누적

- (M0) 소셜 로그인·JWT 인증 필터 미구현 — Security는 permitAll/403 스텁만. M1에서 구현
- (M0) FE 401 refresh 인터셉터는 스텁 — M1에서 구현
- (M0) `/h2-console` permitAll은 dev 전용 — prod 프로파일 도입 시 제외 필요

## 이터레이션 로그

| N차 | 대상 모듈 | 수행 내용 | 결과 |
|-----|----------|----------|------|
| 1 | M0 | 계약 작성 → BE(Boot 4.1.0 스캐폴딩+공통 규약) ∥ FE(Vite+React 19+토큰 이식+탭 셸) 병렬 → QA(교차 비교+실행+프록시 E2E) | DONE — QA PASS. Boot 3.x→4.1.0 편차 승인, 계약·스킬 갱신 |
