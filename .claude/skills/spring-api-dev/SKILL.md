---
name: spring-api-dev
description: HomeStyler 백엔드(Spring Boot) 구현 규약. Spring Boot API·엔티티·서비스·비동기 잡·파일 업로드·JWT 인증을 구현하거나 수정할 때, backend/ 디렉토리를 만지는 모든 작업에서 반드시 이 스킬을 먼저 읽을 것. "API 만들어줘", "백엔드 구현", "엔드포인트 추가", "DB 스키마", "백엔드 버그 수정" 요청 포함.
---

# Spring Boot 구현 규약 — HomeStyler

`backend/`의 모든 코드는 이 규약을 따른다. 규약의 목적은 여러 세션·에이전트가 만든 코드가 한 사람이 쓴 것처럼 일관되게 하는 것이다.

## 프로젝트 구조

도메인(모듈) 우선 패키지 구조를 쓴다. 레이어 우선(controller/ service/ 전역 폴더) 금지 — 모듈 단위 병렬 작업 시 충돌을 줄이기 위함이다.

```
backend/src/main/java/com/homestyler/
├── common/          # ApiResponse, 전역 예외, 보안 설정, 파일 스토리지
│   ├── ApiResponse.java
│   ├── exception/   # ApiException, ErrorCode(enum), GlobalExceptionHandler
│   ├── security/    # JWT 필터·프로바이더, SecurityConfig
│   └── storage/     # FileStorageService (인터페이스) + LocalFileStorage
├── auth/            # AuthController, AuthService, User, RefreshToken, Consent
├── space/           # Space, SpacePhoto, Dimension, Furniture ...
├── recommendation/  # 조건, 분석 잡, 추천 결과
├── share/           # 저장·비교·공유 링크
└── mypage/          # 데이터 관리·탈퇴
```

## 응답·예외 규약

- 모든 컨트롤러는 `ApiResponse.ok(data)` / 예외는 `ApiException(ErrorCode.AUTH_001)` throw → `GlobalExceptionHandler`가 `{ success:false, error:{code,message} }`로 변환한다. 컨트롤러에서 try-catch로 개별 포맷팅 금지.
- `ErrorCode` enum이 코드·HTTP 상태·한글 메시지의 유일한 정의처다. 기능 명세서의 예외 처리 표와 코드·메시지를 일치시킨다.
- Bean Validation(`@Valid` + 어노테이션)으로 입력 검증. 검증 실패는 핸들러가 `COMMON_400`으로 통일 변환.

## 인증

- JWT: Access 1시간 / Refresh 30일 (명세서 FR-AUTH-001 기준). Refresh는 DB 저장·회전.
- 소셜 로그인은 provider별 어댑터 인터페이스(`SocialOAuthClient`)만 정의하고, 키 확보 전까지 구현체는 만들지 않는다.
- 리소스 접근 제어: 모든 조회·수정 쿼리에 소유자 조건을 포함한다 (`findByIdAndUserId`). 소유자 불일치는 404가 아닌 403 (NFR-SEC-002).

## 파일 업로드

- `FileStorageService` 인터페이스 뒤에 숨긴다. dev는 `LocalFileStorage`(경로: `backend/uploads/`, `.gitignore` 등록).
- 업로드 시 필수 처리: (1) 확장자·MIME 검증 (2) **EXIF 메타데이터 제거** — NFR-PRIV-002, GPS 좌표가 남으면 개인정보 사고다 (3) 20MB 제한 (4) 저장 파일명은 UUID.
- 응답에는 스토리지 내부 경로가 아닌 서빙 URL(`/files/**`)만 노출한다.

## 비동기 AI 분석

- `AiAnalysisService` 인터페이스 + `MockAiAnalysisService` 구현. Mock은 5~15초에 걸쳐 JobStatus를 단계별로 진행시키고(구조→채광→동선→생성), 공간 유형·스타일에 맞는 그럴듯한 추천 결과를 생성한다.
- 잡 실행은 `@Async` + 별도 Executor. 잡 상태는 DB에 저장하고 GET 폴링으로 노출한다. 컨트롤러는 202 + jobId를 즉시 반환 — 동기 대기 금지 (SRS 제약: 동기 응답 UX 설계 불가).
- 실패 시 자동 재시도 1회, 최종 실패는 FAILED + 사유 저장 (NFR-AVAIL-002).

## 엔티티·DB

- ID: `Long` + IDENTITY. 시간: `Instant` + Auditing(`createdAt`, `updatedAt`).
- 삭제: 원본 사진·도면은 **물리 삭제**(스토리지 파일 포함 — FR-DATA-002가 "즉시 영구 삭제"를 요구), 나머지는 soft delete 불필요, 단순 삭제.
- Enum은 `@Enumerated(EnumType.STRING)`. 계약 문서의 Enum 정의와 이름을 문자 그대로 일치시킨다.
- 프로파일: `dev`(H2, `ddl-auto: update`) / `prod`(PostgreSQL, `validate`). 기본 프로파일은 dev로 두어 클론 직후 바로 기동되게 한다.

## 완료 기준

모듈 구현 완료를 선언하기 전에:
1. `./gradlew compileJava` 통과
2. `./gradlew bootRun` 기동 후 대표 엔드포인트 1개 이상 curl 검증 (인증 필요 시 로그인부터)
3. 계약 문서의 응답 예시와 실제 응답의 필드 일치 확인
