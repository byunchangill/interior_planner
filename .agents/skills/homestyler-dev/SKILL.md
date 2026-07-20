---
name: homestyler-dev
description: HomeStyler(AI 맞춤형 인테리어 추천 웹앱) 개발 오케스트레이터. "개발 시작/이어서 개발", "AUTH/SPACE/RECO/SAVE/MY 모듈 구현", "화면 만들어줘", "API 구현", "다시 실행", "재실행", "수정", "보완", "이전 결과 기반으로 개선", "버그 수정 후 재검증" 등 HomeStyler 기능 구현·수정 요청 시 반드시 이 스킬을 사용할 것. ralph-loop 이터레이션, "루프", "자율 개발", "이어서 자동으로", "완주" 등 루프 실행 시에도 이 스킬(루프 모드)을 따를 것. 백엔드(Spring Boot)·프론트엔드(React)·QA 에이전트 팀을 구성해 모듈 단위로 구현한다. 단순 문서 질문(기획 내용 확인)은 이 스킬 없이 직접 답해도 된다.
---

# HomeStyler 개발 오케스트레이터

Spring Boot + React로 HomeStyler를 모듈 단위로 구현하는 워크플로우. **실행 모드: 에이전트 팀** (backend-dev, frontend-dev, qa-integrator).

## 기술 스택 (고정)

| 영역 | 선택 | 비고 |
|------|------|------|
| 백엔드 | Spring Boot 4.1.0, Java 21, Gradle 9.5 | `backend/` (Jackson 3·Security 7 주의) |
| 프론트엔드 | React 19 + Vite 8 + TypeScript + Tailwind v3 | `frontend/` |
| DB | H2(dev 프로파일) → PostgreSQL(prod) | JPA |
| 인증 | 이메일+JWT 우선, 소셜은 키 확보 후 | FR-AUTH-002 먼저 |
| AI 분석 | `AiAnalysisService` 인터페이스 + Mock 구현 | 실제 API는 어댑터 교체 |
| 파일 저장 | 로컬 파일시스템(dev), 저장 경로 추상화 | EXIF GPS 제거 필수 |

## Phase 0: 컨텍스트 확인

워크플로우 시작 시 기존 산출물을 확인해 실행 모드를 결정한다:

1. `_workspace/progress.md`를 읽는다 (없으면 **초기 실행**)
2. 존재하면:
   - 프롬프트가 ralph-loop 이터레이션(자율 완주 지시) → **루프 모드** (아래 별도 절)
   - 사용자가 특정 모듈/화면 수정 요청 → **부분 재실행**: 해당 모듈 담당 에이전트만 팀에 포함
   - 사용자가 "다음 모듈 진행" → **이어서 실행**: progress.md의 다음 미완료 모듈부터
   - 사용자가 전면 재구축 요청 → 기존 `_workspace/`를 `_workspace_prev/`로 이동 후 초기 실행

### 루프 모드 (ralph-loop 이터레이션 계약)

루프에서는 사람이 개입하지 않으므로, 1 이터레이션의 범위와 종료 규율을 엄격히 지킨다:

1. **모듈 선택**: progress.md 모듈 표에서 첫 번째 `TODO` 또는 `IN_PROGRESS` 모듈을 고르고 `IN_PROGRESS`로 표시한다. **이번 이터레이션은 그 모듈 하나만** 수행한다 (여러 모듈 동시 착수 금지 — 이터레이션이 길어지면 실패 시 손실이 커진다).
2. **수행**: Phase 1~3(계약→팀 구현→QA)을 그대로 실행한다. 사용자 확인이 필요한 분기(AskUserQuestion)는 루프에서 사용 불가 — 명세서 기준으로 스스로 판단하고 판단 근거를 progress.md 비고에 남긴다.
3. **완료 판정**: 완료 기준(빌드 통과 + QA High 0) 충족 시 `DONE`으로 갱신하고 git commit(`M{n}: {모듈명} 완료 — QA 통과`) 한다.
4. **실패 처리**: 완료 기준 미달인 채 이터레이션을 끝낼 때는 `IN_PROGRESS` 유지 + 로그에 실패 사유를 남긴다. 직전 이터레이션 로그를 확인해 **같은 모듈이 이미 1회 실패했다면** `BLOCKED(사유)`로 표시하고 다음 이터레이션이 다음 모듈로 넘어가게 한다 (무한 루프 방지).
5. **이터레이션 종료 규율**: 종료 전 반드시 ① progress.md 이터레이션 로그에 1행 추가(N차/모듈/수행/결과) ② 팀 정리(TeamDelete — 세션당 한 팀 제약 때문에 이걸 빼먹으면 다음 이터레이션의 팀 생성이 막힌다) ③ 진행 중 코드도 git commit(롤백 지점).
6. **루프 종료**: 모든 모듈이 `DONE` 또는 `BLOCKED`일 때만 `_workspace/final_report.md`(구현 요약, BLOCKED 사유, Mock 항목, 실행 방법)를 작성하고 completion promise를 출력한다. **이 조건이 참이 아니면 promise를 절대 출력하지 않는다** — 거짓 promise로 루프를 탈출하는 것은 금지다.

루프 시작 명령은 `_workspace/ralph_prompt.md`에 보관되어 있다.

## Phase 1: 모듈 선택 및 계약 작성

1. `references/module-plan.md`를 읽고 이번 실행에서 구현할 모듈을 정한다 (한 번에 1~2개 모듈 권장)
2. 리더(메인)가 `docs/functional_spec.md`·`docs/ia.md`를 근거로 해당 모듈의 API 계약을 `_workspace/contracts/{module}.md`에 작성한다
   - 작성 규칙: `references/api-contract-guide.md` 참조
3. 계약은 구현 시작 전에 확정한다. 구현 중 변경은 리더 승인 + 계약 문서 갱신 + 양측 통지 순서로만 진행

## Phase 2: 팀 구성 및 구현

1. `TeamCreate`로 팀 구성: backend-dev, frontend-dev (+ 모듈 완성 시점에 qa-integrator)
   - 모든 Agent 호출에 `model: "opus"` 명시
2. `TaskCreate`로 모듈별 작업 생성. 의존 관계:
   - `{module} 계약 확정` → `{module} BE 구현` ∥ `{module} FE 구현` → `{module} QA`
3. BE/FE는 병렬 진행. 팀원 간 계약 질의는 SendMessage로 직접 소통
4. 산출물 파일 규칙:
   - 코드: `backend/`, `frontend/`
   - 보고서: `_workspace/{module}_{agent}_report.md`

## Phase 3: Incremental QA

**모듈 하나가 완성될 때마다** qa-integrator를 투입한다 (전체 완성 후 일괄 QA 금지 — 경계면 버그는 누적될수록 원인 추적이 어려워진다):

1. QA가 `_workspace/{module}_qa_report.md` 작성
2. 버그 발견 시 해당 개발자에게 직접 전달 → 수정 → QA 회귀 확인
3. QA 통과 후 다음 모듈 진행

## Phase 4: 진행 상황 기록 및 마무리

1. 모듈 완료마다 `_workspace/progress.md` 갱신 (모듈 상태 표: 완료/진행중/미착수 + 미구현 항목)
2. 전체 요청 범위 완료 시:
   - 팀 정리
   - 사용자에게 결과 요약 보고 (구현 모듈, 실행 방법, 미구현/Mock 항목)
   - 피드백 기회 제공: "결과에서 개선할 부분이 있나요?"

## 데이터 전달 프로토콜

| 데이터 | 방식 |
|--------|------|
| 작업 조율·의존성 | TaskCreate/TaskUpdate |
| 계약 질의·버그 리포트 | SendMessage (팀원 간 직접) |
| 계약·보고서·진행 상황 | 파일 (`_workspace/`) |

`_workspace/`는 삭제하지 않고 보존한다 (감사 추적·부분 재실행의 근거).

## 에러 핸들링

| 상황 | 처리 |
|------|------|
| 에이전트 빌드 실패 반복 | 2회 재시도 후 리더가 직접 원인 분석, 해결 불가 시 해당 항목 미구현으로 기록하고 진행 |
| 계약 충돌 (BE/FE 해석 차이) | 계약 문서가 심판. 문서가 모호하면 리더가 명세서 기준으로 계약을 보완 |
| 외부 의존 부재 (AI API 키, 소셜 키) | Mock으로 대체하고 progress.md에 명시. 임의로 실제 연동 시도 금지 |
| 명세서와 디자인 불일치 | 삭제하지 않고 양쪽을 기록한 뒤 사용자에게 질의 |

## 테스트 시나리오

**정상 흐름**: 사용자가 "AUTH 모듈 구현해줘" → Phase 0(초기 실행 판별) → 계약 작성(`_workspace/contracts/auth.md`) → 팀 구성 → BE(회원가입/로그인/JWT) ∥ FE(COM-003/004 화면) → QA(회원가입→로그인→토큰 검증 E2E) → progress.md 갱신 → 요약 보고.

**에러 흐름**: FE가 로그인 응답에서 `data.accessToken`을 기대했으나 BE가 `data.token`으로 구현 → QA가 계약 문서 확인(계약은 `accessToken`) → BE 버그로 판정, backend-dev에게 리포트 → 수정 → QA 회귀 확인 통과 → 다음 단계 진행.

## 참고

- 모듈 로드맵·화면/FR 매핑: `references/module-plan.md`
- API 계약 작성 표준: `references/api-contract-guide.md`
- 각 에이전트 정의: `.Codex/agents/{backend-dev,frontend-dev,qa-integrator}.md`
