# M0 백엔드 스캐폴딩 — 구현 보고서

작성: backend-dev / 2026-07-19

## 결과 요약

M0 계약(`_workspace/contracts/m0.md`)의 백엔드 산출 범위를 `backend/`에 전부 구현. `./gradlew compileJava` 통과, `./gradlew bootRun` 기동 후 `GET /api/v1/health` 응답이 계약과 필드까지 일치함을 확인. 검증 후 bootRun 프로세스 종료.

## 부트스트랩

- Spring Initializr(`https://start.spring.io/starter.zip`)로 gradle-project zip을 받아 `backend/`에 전개 (gradlew 래퍼 포함).
- 의존성: web(webmvc), data-jpa, validation, security, h2 / groupId `com.homestyler` / artifactId `homestyler-api` / packageName `com.homestyler`.
- **특이사항(버전)**: Initializr가 `bootVersion=3.5.4`를 거부(`compatibility range is >=4.0.0`). bootVersion 미지정으로 재요청하여 **Spring Boot 4.1.0 + Gradle 9.5.1** 스캐폴딩 생성. Java 21 toolchain 유지. 계약은 "Spring Boot 3.x"를 명시하나, Initializr가 3.x zip을 더 이상 제공하지 않아 4.1.0으로 진행함. (계약 변경 제안 대상 — 아래 참고)

## 구현 산출물 (backend/src/main/java/com/homestyler)

| 파일 | 내용 |
|------|------|
| `common/ApiResponse.java` | 표준 응답 래퍼 record. `ok(data)` / `error(ApiError)`. `@JsonInclude(NON_NULL)`로 성공 응답엔 error 키, 실패 응답엔 data 키가 나타나지 않음 |
| `common/ApiError.java` | 실패 페이로드 record `{code, message}` |
| `common/exception/ErrorCode.java` | enum — code·HttpStatus·한글 메시지의 유일 정의처. M0는 COMMON_400/401/403/404/500 정의 |
| `common/exception/ApiException.java` | 비즈니스 예외 (ErrorCode 보유) |
| `common/exception/GlobalExceptionHandler.java` | `@RestControllerAdvice`. ApiException→상태별 변환, Bean Validation 실패→COMMON_400 통일, 그 외→COMMON_500 |
| `common/security/SecurityConfig.java` | CSRF off, CORS(localhost:5173 허용), permitAll(`/api/v1/health`, `/api/v1/auth/**`, `/files/**`) + dev H2 콘솔, 나머지 authenticated 스텁, H2용 frameOptions sameOrigin |
| `health/HealthController.java` | `GET /api/v1/health`. 인증 불필요. timestamp는 `Instant.now().truncatedTo(SECONDS)` → 계약과 동일한 `...Z` 포맷 |

리소스:
- `application.yml`: 기본 프로파일 `dev`, server.port 8080
- `application-dev.yml`: H2 in-memory, `ddl-auto: update`, H2 콘솔(`/h2-console`), open-in-view false

## 검증 결과

- `./gradlew compileJava` → **BUILD SUCCESSFUL**
- `./gradlew bootRun` 기동(~6s) 후:
  - `curl http://localhost:8080/api/v1/health`
    → `{"success":true,"data":{"status":"UP","service":"homestyler-api","timestamp":"2026-07-19T08:43:09Z"}}`
    → 계약 JSON과 필드(success / data.status / data.service / data.timestamp) 및 shape 일치. timestamp는 ISO-8601 UTC(`Z`) 문자열.
  - `GET /api/v1/spaces`(비공개 경로) → **403** (security 스텁 정상 동작)
  - CORS preflight(Origin: http://localhost:5173) → 200 + `Access-Control-Allow-Origin: http://localhost:5173`
- 검증 후 `gradlew --stop` 및 프로세스 종료 확인(post-shutdown curl `000`).

## 빌드 이슈 및 해결 (1회 발생)

- **증상**: 최초 bootRun 기동 실패 — `application.yml`의 `spring.jackson.serialization.write-dates-as-timestamps: false`가 바인딩 실패. Spring Boot 4는 Jackson 3(`tools.jackson`)를 사용하며 `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS` enum이 존재하지 않음.
- **해결**: Jackson 3는 `java.time` 값을 기본으로 ISO-8601 문자열로 직렬화하므로 해당 프로퍼티를 제거. 재기동 후 정상 동작 및 timestamp 포맷 계약 일치 확인.

## 특이사항 / 리더 확인 요청

1. **Spring Boot 버전**: 계약은 3.x 명시이나 Initializr가 3.x를 더 이상 제공하지 않아 **4.1.0**으로 스캐폴딩함. Jackson 3, Spring Security 7 등 상위 버전 차이가 존재하므로 계약 문서의 "Spring Boot 3.x" 문구를 4.1.0으로 갱신 제안. 후속 모듈(auth JWT 등) 구현 시 Security 7 / Jakarta 기준으로 진행 예정.
2. `/h2-console`는 dev 편의를 위해 permitAll에 추가함(계약 명시 3경로 외 dev 전용). prod 프로파일 도입 시 제외 필요.
3. Security는 M0 스텁 상태 — 실제 JWT 인증 필터는 M1(auth)에서 구현. 현재 비공개 경로는 인증 메커니즘 없이 403 반환.
4. `spring-boot-starter-web`이 4.x에서 `spring-boot-starter-webmvc`로, `h2` 콘솔이 `spring-boot-h2console`로 명명됨(build.gradle 참고).
