# M1 백엔드 구현 보고서 — AUTH + HOME

## 빌드/기동
- `./gradlew build` 통과 (컨텍스트 로드 테스트 포함)
- `bootRun` 후 전 엔드포인트 curl 검증 완료 (8080이 다른 프로세스에 점유되어 8081로 검증 — 아래 특이사항 참조)

## 구현 엔드포인트 (계약 m1.md 준수)

| 메서드 | 경로 | 인증 | 검증 결과 |
|--------|------|------|-----------|
| POST | /api/v1/auth/signup | X | accessToken/refreshToken/user 반환 확인 |
| POST | /api/v1/auth/login | X | 동일 응답, AUTH_001 확인 |
| POST | /api/v1/auth/refresh | X | 재발급 + 회전, 구 토큰 무효화(AUTH_002) 확인 |
| GET | /api/v1/auth/me | O | userId/email/nickname 반환 확인 |
| POST | /api/v1/auth/consents | O | {marketing} 반환 확인 |
| GET | /api/v1/home/summary | O | nickname + recentSpaces:[] + styleHighlights 확인 |
| GET | /api/v1/styles | X | 6종 목록 확인 |
| GET | /api/v1/styles/{styleType} | X | 상세 + RES_001(미존재) 확인 |

응답 필드명은 계약 문자 그대로 (`accessToken`/`refreshToken`, `userId`, `styleType` 등).

## 주요 결정
- **JWT**: jjwt 0.12.6, HS256, access 3600s / refresh 2592000s. 시크릿·TTL은 `application.yml`의 `jwt.*`에 dev값 하드코딩. jjwt 직렬화기는 **jjwt-gson** 채택 — Boot 4의 Jackson 3(`tools.jackson`)와 jjwt-jackson(Jackson 2)의 버전 혼선을 피하기 위함.
- **인증 필터**: `common/security/JwtAuthenticationFilter`가 Bearer 토큰 검증 후 `SecurityContext`에 principal=userId(Long) 설정 → 컨트롤러는 `@AuthenticationPrincipal Long userId`로 수신. 토큰 만료/무효는 필터에서 응답을 쓰지 않고 요청 속성에 코드만 기록, `JwtAuthenticationEntryPoint`가 401 응답을 표준 포맷으로 작성 (만료→AUTH_002, 무효→AUTH_001, 토큰 없음→COMMON_401).
- **refreshToken 회전**: `RefreshToken` 엔티티(사용자당 1행)에 최신 토큰 저장. refresh 시 저장값과 일치+미만료만 허용, 성공 시 새 토큰으로 rotate. → 구 refreshToken 재사용은 AUTH_002.
- **SecurityConfig**: STATELESS 세션, BCryptPasswordEncoder 빈, `/styles`·`/styles/**`를 permitAll에 추가(인증 불필요 계약 반영).
- **StyleType**: `home/StyleType` enum에 6종(제목/설명/키워드/썸네일·갤러리 경로) 정적 데이터 내장. DB 테이블 없음. 이미지 파일은 없고 경로 문자열만.
- **ErrorCode 추가**: AUTH_001, AUTH_002, AUTH_004, VALID_001, RES_001.
- **비밀번호 검증**: `@Pattern ^(?=.*[A-Za-z])(?=.*\d).{8,20}$` (영문+숫자 포함 8~20자). Bean Validation 실패는 기존 핸들러가 COMMON_400으로 변환(계약의 VALID_001은 이메일 중복 등 서비스단 검증에서 사용).

## 계약 대비 판단이 필요했던 부분
- **비밀번호 형식 오류 코드**: 계약은 VALID_001(형식 오류)로 명시하나, Bean Validation(@Valid) 실패는 M0 GlobalExceptionHandler가 일괄 COMMON_400으로 변환한다. 형식 위반은 COMMON_400(구체 메시지 포함), 이메일 중복은 서비스에서 VALID_001로 처리했다. FE가 두 코드 모두 "입력 오류"로 다루면 문제없으나, 계약을 엄격히 맞추려면 핸들러를 VALID_001로 바꿔야 함 — 리더 판단 필요 시 조정 가능.
- **home/summary의 styleHighlights**: 계약에 개수 미지정 → 6종 전체를 반환.
- **auth/me·consents 인증 실패 시 사용자 미존재**: AUTH_001로 처리(토큰은 유효하나 유저 없음 — 실질적으로 발생 어려움).

## 미구현/Mock
- SPACE 모듈 부재로 `recentSpaces`는 항상 `[]` (계약 명시).
- 소셜 로그인 API: 계약상 미구현 범위 — 손대지 않음.
- 스타일 이미지 실제 파일 없음 — `/files/style_*.jpg` 경로 문자열만.

## 특이사항
- **포트 8080 점유**: 검증 시 PID로 식별되는 정체불명 프로세스가 8080을 점유하고 `{"code":"TOKEN_INVALID"}`(본 코드베이스에 없는 응답)를 반환 중이었음 — 이전 세션의 잔여 서버로 추정. 내 프로세스가 아니고 정체가 불확실하여 죽이지 않고 8081에서 검증함. QA/프론트가 8080을 쓰려면 이 잔여 프로세스 종료 필요.
- curl `-d`로 한글 페이로드 전송 시 Windows 콘솔 코드페이지 때문에 nickname이 깨지고 회원가입이 500으로 실패한 사례가 있었음 → UTF-8 파일 페이로드로는 정상. 실제 FE(UTF-8 JSON)에서는 무관한 콘솔 아티팩트.
