# HomeStyler (interior_planner)

AI 맞춤형 인테리어 추천 웹앱. 기획 문서·화면 디자인은 `docs/`에 있다 (ia.md, srs.md, functional_spec.md, 화면 디자인 `_N/`, 디자인 시스템).

## 하네스: HomeStyler 개발

**목표:** 기획 문서와 Stitch 디자인을 기반으로 Spring Boot(백엔드) + React(프론트엔드) 웹앱을 모듈 단위로 구현한다. v1 범위는 P1 핵심 흐름.

**트리거:** HomeStyler 기능 구현·수정·검증 등 개발 작업 요청 시 `homestyler-dev` 스킬(오케스트레이터)을 사용하라. 백엔드/프론트엔드/QA 단독 작업이라도 각각 `spring-api-dev` / `react-ui-dev` / `integration-qa` 스킬을 먼저 읽는다. 기획 문서 내용에 대한 단순 질문은 직접 응답 가능.

**루프:** 자율 완주(루프) 실행 시 ralph-loop + `_workspace/progress.md` 이터레이션 계약(1회전 = 1모듈)을 따른다. 상세 규율은 `homestyler-dev` 스킬의 "루프 모드", 시작 명령은 `_workspace/ralph_prompt.md`.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-19 | 초기 구성 (에이전트 3, 스킬 4) | 전체 | - |
| 2026-07-19 | 루프 모드 추가 (ralph-loop 이터레이션 계약) | skills/homestyler-dev, _workspace | 루프 엔지니어링 도입 |
