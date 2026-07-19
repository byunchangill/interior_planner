---
name: integration-qa
description: HomeStyler 백엔드↔프론트엔드 통합 검증 방법론. 모듈 완성 직후 QA, "검증해줘", "QA 돌려줘", "연동 확인", "버그 찾아줘", "수정 후 재검증", "회귀 테스트" 요청 시 반드시 이 스킬을 사용할 것. 코드 존재 확인이 아니라 경계면 교차 비교와 실제 실행 검증을 수행한다.
---

# 통합 QA 방법론 — HomeStyler

경계면 버그(BE와 FE가 각자 "정상"이지만 서로 맞물리지 않는 버그)는 각 코드만 읽어서는 절대 발견되지 않는다. 반드시 **양쪽을 동시에 열어 비교**하고, **실제로 실행**한다.

## 검증 절차 (모듈당)

### 1. 계약 기준 확보

`_workspace/contracts/{module}.md`를 읽는다. 이 문서의 응답 예시·Enum이 모든 판정의 기준이다. 계약이 모호해 판정 불가한 항목은 버그가 아니라 "계약 보완 요청"으로 리더에게 올린다.

### 2. 경계면 교차 비교 (정적)

엔드포인트마다 3개 파일을 동시에 읽고 비교한다:
- BE: 컨트롤러 + 응답 DTO
- FE: `api/{module}.ts`의 호출 함수 + `types/{module}.ts`의 타입

비교 항목:

| 항목 | 흔한 버그 패턴 |
|------|---------------|
| URL·HTTP 메서드 | 복수형/단수형 불일치(`/space` vs `/spaces`), path 변수명 차이 |
| 필드명 | `accessToken` vs `token`, snake_case 혼입 |
| 중첩 구조 | BE는 `data.items[]`인데 FE는 `data[]`로 unwrap |
| Enum 값 | BE `LIVING_ROOM` vs FE `livingRoom` — 문자열 비교 실패로 화면 공백 |
| null 처리 | BE가 null 반환 가능한 필드를 FE가 non-null로 타입 정의 |
| 페이지네이션 | FE가 `totalCount`를 기대하는데 BE는 `total` |
| 에러 코드 | FE의 에러 분기(`error.code === 'AUTH_004'`)가 BE ErrorCode에 실존하는가 |

### 3. 실행 검증 (동적)

정적 비교를 통과해도 실행은 생략하지 않는다:

1. BE 기동: `cd backend && ./gradlew bootRun` (백그라운드). 기동 실패 자체가 최우선 버그.
2. 모듈의 핵심 흐름을 curl로 순서대로 실행한다. 예 (AUTH): signup → login → 토큰으로 보호 API 호출 → 만료 토큰으로 401 확인.
3. 실제 응답 JSON을 계약 문서 예시와 필드 단위로 diff한다.
4. 비동기 잡(RECO)은 요청 → 폴링 → COMPLETED까지 실제 대기하며 상태 전이를 확인한다.
5. FE: `cd frontend && npm run build` 통과 확인.
6. 재사용 가능한 검증 명령은 `_workspace/qa_scripts/{module}.sh`로 저장한다.

### 4. 도메인 필수 항목 (HomeStyler 특화)

기능 검증과 별개로 매 모듈 확인한다:

- **접근 제어**: 다른 사용자의 리소스 ID로 조회 시 403이 오는가 (NFR-SEC-002). 사용자 2명을 만들어 실제로 교차 요청한다.
- **AI 한계 고지**: RECO 관련 화면 컴포넌트에 `AiNoticeBanner`가 포함되어 있는가 (FR-RECO-012 — 법적 의무).
- **EXIF 제거**: 업로드 코드 경로에 EXIF 제거 처리가 존재하는가 (NFR-PRIV-002).
- **삭제의 완전성**: 원본 삭제 API가 DB 행뿐 아니라 스토리지 파일도 지우는가 (FR-DATA-002).
- **공유 링크**: 만료된 토큰으로 접근 시 410, 임의 토큰으로 403/404가 오는가 (NFR-SEC-003).

### 5. 리포트 작성

`_workspace/{module}_qa_report.md`:

```markdown
# {module} QA 리포트 (N차)
## 버그
| # | 심각도 | 위치(파일:라인) | 증상 | 계약 기준 판정 | 담당 |
|---|--------|----------------|------|---------------|------|
| 1 | High | frontend/src/api/auth.ts:12 | data.token 참조, 계약은 accessToken | FE 수정 | frontend-dev |
## 통과 항목
- signup→login→보호API E2E 통과
## 계약 보완 요청
- (있으면) 리더에게
```

심각도: **High**(흐름 차단·보안·데이터 손실) / **Mid**(기능 오동작) / **Low**(표기·UX). High가 하나라도 있으면 모듈 미통과 — 수정 후 회귀 확인까지가 QA의 책임이다.

## 회귀 확인 (재호출 시)

수정 통지를 받으면 전체 재검증이 아니라: (1) 보고했던 버그 항목 재확인 (2) 수정이 건드린 파일과 맞물리는 반대편 코드 재비교 (3) 해당 흐름의 실행 검증 재실행. 리포트에 "N차" 카운트를 올려 기록한다.
