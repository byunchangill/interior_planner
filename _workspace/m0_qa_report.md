# M0 QA 리포트 (1차)

- 검증일: 2026-07-19
- 담당: qa-integrator
- 계약: `_workspace/contracts/m0.md`
- 방법: 경계면 교차 비교(정적) + 실제 실행 검증(동적)
- **판정: 통과 (PASS)** — High/Mid/Low 버그 0건

## 버그

| # | 심각도 | 위치(파일:라인) | 증상 | 계약 기준 판정 | 담당 |
|---|--------|----------------|------|---------------|------|
| — | — | — | 발견된 버그 없음 | — | — |

## 통과 항목

### 1. 정적 경계면 교차 비교

| 비교 항목 | BE | FE | 결과 |
|-----------|----|----|------|
| URL/메서드 | `GET /api/v1/health` (`HealthController.java:16,21`) | `api.get('/health')` + `baseURL '/api/v1'` (`health.ts:6`, `client.ts:11`) | 일치 |
| 응답 래퍼 | `ApiResponse{success, data, error}` `@JsonInclude(NON_NULL)` (`ApiResponse.java:12`) | `ApiResponse<T>{success, data, error?}` (`common.ts:4`) | 일치 (error optional 정확) |
| data shape | `HealthStatus(status, service, timestamp:Instant)` (`HealthController.java:31`) | `HealthStatus{status, service, timestamp:string}` (`common.ts:16`) | 필드명·타입 일치 (Instant→ISO 문자열) |
| unwrap 정합 | `data` 최상위 (unwrap 불필요한 단일 객체) | `unwrap<T>()`가 `body.data` 반환, `success=false` 시 throw (`client.ts:41`) | 중첩 구조 일치 |
| axios ↔ proxy | 서버 포트 8080 | `baseURL '/api/v1'` → vite proxy `/api → localhost:8080` (`vite.config.ts:11`) | prefix `/api` 가 `/api/v1/*` 포함 → 정합 |
| CORS ↔ origin | `setAllowedOrigins(localhost:5173)` (`SecurityConfig.java:49`) | dev 포트 5173 (`vite.config.ts:8`) | 일치 |
| 인증 경계 | permitAll `/api/v1/health` (`SecurityConfig.java:27`) | health 인증 불필요 호출 | 일치 |

### 2. 실행 검증 (동적)

- **BE 기동**: `./gradlew bootRun` 정상 기동 (Java 21 Temurin, Spring Boot 4.1.0).
- **health 응답 diff**: 실제 응답
  `{"success":true,"data":{"status":"UP","service":"homestyler-api","timestamp":"2026-07-19T08:46:45Z"}}`
  → 계약 예시와 필드(success / data.status / data.service / data.timestamp) 및 shape 완전 일치. timestamp ISO-8601 UTC(`Z`) 포맷 일치.
- **비공개 경로 403**: `GET /api/v1/spaces` → **403** (security 스텁 정상).
- **CORS**: preflight(`OPTIONS`, Origin 5173) → 200 + `Access-Control-Allow-Origin: http://localhost:5173`, `Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`, `Allow-Credentials: true`. 단순 GET에도 동일 헤더 부착 확인.
- **FE 빌드**: `npm run build` (`tsc -b && vite build`) → 성공, **타입 오류 0**, 85 modules, dist 생성(js 334.93kB / css 8.32kB).
- **프록시 경유 E2E**: FE dev(5173) 기동 후 `curl http://localhost:5173/api/v1/health` → BE 계약 응답 그대로 수신. 프론트 proxy → 백엔드 연동 체인 정상.
- **프로세스 정리**: 검증 후 `gradlew --stop` + 5173 리스너 종료. 재확인 결과 8080/5173 모두 `000`(미기동). 다음 이터레이션 포트 충돌 없음.

## 계약 보완 요청 (버그 아님)

- **Spring Boot 4.1.0**: 계약 문구는 "Spring Boot 3.x"이나 Initializr가 3.x zip 미제공으로 4.1.0 사용. **리더 승인된 계약 편차** — 버그로 판정하지 않음. 계약 문서 문구를 4.1.0(Jackson 3 / Security 7 기준)으로 갱신 권장.
- **React 19 / Vite 8 / Tailwind 3**: 계약의 "React 18" 대비 상향. `npm create vite@latest` 기본 산출물이며 API 호환 범위 내. 문제 없음 — 계약 문구 갱신 권장.
- **`/h2-console` permitAll**: dev 전용 편의 경로. prod 프로파일 도입 시 제외 필요(추적 항목, M0 범위 내 이슈 아님).

## 판정 근거

경계면 교차 비교와 실행 검증(health diff, 403, CORS, FE 빌드, 프록시 E2E) 전 항목 통과. High 버그 없음 → **M0 모듈 통과**.
