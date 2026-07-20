# HomeStyler v1 구현 완료 보고서

기획 문서 + Stitch 디자인 기반으로 Spring Boot(백엔드) + React(프론트엔드) 웹앱을 모듈 단위로 구현. P1 핵심 흐름 전체 완료.

## 모듈 요약 (전부 DONE · QA PASS High 0)

| 모듈 | 범위 | 핵심 검증 |
|------|------|----------|
| M0 | 스캐폴딩(BE Gradle+FE Vite+디자인 토큰+탭 셸) | BE 기동·FE 빌드·/health 연동 |
| M1 | AUTH+HOME (회원가입/로그인/JWT 토큰갱신, 홈/스타일) | refreshToken이 access로 통용되던 보안버그 수정 |
| M2 | SPACE (공간 등록·사진·치수·가구) | EXIF GPS 제거 실검증, 사용자 2명 소유권 403 |
| M3 | RECO (조건설정·비동기 분석·추천 결과) | 비동기 202 non-blocking, fitScore 실산술+테스트, 생활방식 실반영 |
| M4 | SAVE (저장·비교·공유·구매목록) | 공개뷰 비인증 접근·회수후 410·민감정보 제외 |
| M5 | MY/DATA (마이·데이터관리·탈퇴) | 원본 물리 삭제·탈퇴 연쇄 삭제·SHARE_002·비번 게이트 |

## 경쟁 차별화 반영 ("실행 가능한 인테리어")

경쟁 분석을 반영해 기획을 갱신하고(`docs/srs.md` §7 백로그 포함) 구현:
- 생활방식 설문(FR-PREF-006) → 추천 이유에 실반영
- 추천 이유 설명(FR-RECO-014), 공간 적합도 점수(FR-RECO-015, 룰 기반 실산술)
- 실제 판매 제품형 가구 스키마(브랜드/치수/가격/구매링크 — v1 Mock, 실데이터 교체 가능)
- 구매 목록 내보내기(FR-SAVE-006)

## Mock / 미구현 (의도적)

- AI 공간 분석·치수/가구 추정·이미지 생성은 Mock (`AiAnalysisService`/`AiEstimationService` 인터페이스로 분리 → 실 AI 어댑터 교체 가능)
- 소셜 로그인(FR-AUTH-001)은 버튼만 (키 확보 후)
- 커머스 연동·반입 검사·시공 중개·도면 DB·과금·3D 적합도는 백로그 BL-001~006

## 알려진 이슈 (비차단)

- 비UTF-8/깨진 JSON 본문 → COMMON_500 (이상적으론 400). 별도 태스크로 분리. FE 정상 경로 영향 없음.
- HOME `recentSpaces`는 빈 배열 고정(M2 Space와 미연결) — 후속 연결 가능.

## 실행 방법

- 백엔드: `cd backend && ./gradlew bootRun` (기본 dev 프로파일, H2 in-memory, 포트 8080)
- 프론트: `cd frontend && npm install && npm run dev` (포트 5173, `/api`→8080 프록시)
- 통합 검증 스크립트: `_workspace/qa_scripts/m{1,3,4,5}.sh`

## 감사 추적

- 계약: `_workspace/contracts/m{0..5}.md`
- 모듈별 BE/FE/QA 보고서: `_workspace/m{n}_*.md` (M5는 통합 `m5_report.md`)
- 이터레이션 로그: `_workspace/progress.md`
