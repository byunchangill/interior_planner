# M1 (AUTH + HOME) 통합 QA 리포트 (1차)

- 일시: 2026-07-20
- 대상: 계약 `_workspace/contracts/m1.md` / BE `backend/` / FE `frontend/`
- 방법: 경계면 교차 비교(BE 컨트롤러·DTO ↔ FE api·types) + 실제 실행 검증(BE bootRun + curl E2E, FE `npm run build`)
- **최종 판정: PASS** (High 버그 0. Medium 보안 버그 1건 발견 → 이 세션 내 수정+회귀 완료. Low 계약 편차 1건 → 리더 판단 대기, 비차단)

---

## 버그

| # | 심각도 | 위치(파일:라인) | 증상 | 계약 기준 판정 | 담당 | 상태 |
|---|--------|----------------|------|---------------|------|------|
| 1 | Medium (보안) | `backend/.../common/security/JwtProvider.java` `parseUserId` (~L60) | refreshToken을 `Authorization: Bearer`로 보호 엔드포인트(/auth/me, /home/summary)에 보내면 **인증 통과(HTTP 200)**. `parseUserId`가 `type` 클레임을 검사하지 않음(`parseRefreshUserId`는 `type=refresh` 검사함). | 계약 "토큰 정책" 위반: access(1h)/refresh(30d) 용도 분리. 30일 토큰이 access 자격증명으로 통용 → access 만료 설계 무력화 | backend-dev | **FIXED + 회귀 통과** |
| 2 | Low (표기/계약편차) | `backend/.../auth/AuthDtos.java` `@Pattern` → `GlobalExceptionHandler.handleValidation` | 비밀번호 형식 위반 시 `COMMON_400` 반환. 계약은 `VALID_001` 명시. | BE가 계약과 다른 코드 반환. **단 FE 영향 없음**(아래 참조) → 기능 버그 아님 | 리더 판단 | 미수정(비차단) |

### 버그 1 상세 (수정 완료)
- 재현(수정 전, 8080): `curl /auth/me -H "Authorization: Bearer {refreshToken}"` → `200 {userId,...}`.
- 수정: `parseUserId`에 `type=access` 검증 한 줄 추가(대칭). 
  ```java
  if (!"access".equals(claims.get("type", String.class))) { throw new JwtException("not an access token"); }
  ```
- 회귀(수정 후, 8081 재기동): 동일 요청 → `401 AUTH_001`. 정상 흐름(valid accessToken /auth/me·/home/summary → 200, 실제 refreshToken으로 /auth/refresh → 200) 무영향 확인.

### 버그 2 상세 — 리더 escalation 답변 (VALID_001 vs COMMON_400)
**결론: 기능 버그 아님. FE는 두 코드를 다르게 처리하지 않음.**
- FE 전체 소스에 error code 분기 **전무**(`grep VALID_001|COMMON_400|AUTH_004|error.code|.code ===` → 0 matches). `SignupPage.tsx:70-72` 및 `LoginPage.tsx:45-46`의 catch는 코드 무관 **단일 정적 토스트**만 노출.
- 또한 `SignupPage.tsx:61-62`가 이메일/비밀번호 형식을 **클라이언트에서 선검증**하여 형식 위반은 BE(`POST /auth/signup`)에 도달조차 않음.
- 따라서 BE가 COMMON_400/VALID_001 중 무엇을 주든 FE 동작 동일 → 통합상 무해. 계약 엄격 준수를 원하면 핸들러를 VALID_001로 조정하면 되나, M1 통합 관점에서는 비차단. **리더 결정 필요**(계약을 impl에 맞출지, impl을 계약에 맞출지).

---

## 통과 항목 (실행 검증 완료)

E2E 전 흐름을 curl로 실제 수행하고 응답 JSON을 계약 예시와 필드 단위로 diff:

- **회원가입(COM-004)**: `accessToken/refreshToken/user{userId,email,nickname}` 정확 일치. 필수 동의 누락 → `AUTH_004(400)`. 이메일 중복 → `VALID_001(400)`.
- **로그인(COM-003)**: 동일 응답 스키마. 비밀번호 불일치 → `AUTH_001(401)`.
- **세션 유지(스플래시 COM-001)**: `GET /auth/me` accessToken → `userId/email/nickname` 반환. 무토큰 → `401 COMMON_401`, 변조 토큰 → `401 AUTH_001`. FE 인터셉터는 status===401만 키로 사용 → 모든 401 변종 호환.
- **홈(HOME-001)**: `GET /home/summary` → `nickname / recentSpaces:[] / styleHighlights[6]{styleType,title,thumbnailUrl}`. FE `types/home.ts`와 필드 완전 일치.
- **스타일 갤러리(HOME-002)**: `GET /styles` → `data.items[6]{styleType,title,thumbnailUrl,description}`. FE `getStyles`가 `.items` 언랩 정확.
- **스타일 상세(HOME-003)**: `GET /styles/{styleType}` → `{styleType,title,description,keywords[],gallery[]{imageUrl,caption}}` 일치. 없는 타입 → `404 RES_001`(FE 폴백). 소문자 path(`/styles/nordic`)도 200(BE `toUpperCase`).
- **토큰 갱신/회전(FR-AUTH-005)**: `POST /auth/refresh` → 신규 access+refresh. 구 refreshToken 재사용 → `401 AUTH_002`(rotate 무효화). FE 401→refresh 1회 재시도 인터셉터는 status/필드(`data.accessToken`) 기준 정합.
- **StyleType Enum 6종**: BE `name()`(대문자) == FE `StyleType` 유니온(`MODERN|MINIMAL|NATURAL|NORDIC|HOTEL|WOOD`) 일치.
- **FE 빌드**: `npm run build`(tsc -b + vite) 통과, 타입 오류 0 → FE의 응답 필드 접근이 선언 타입과 일치함을 컴파일 수준 보증.
- **인프라 정합**: FE baseURL `/api/v1` + vite proxy → `:8080`; BE `@RequestMapping("/api/v1/...")`, CORS origin `:5173` 일치.

## 비(非)버그로 판정한 사항
- **한글 nickname 회원가입 500**(BE 보고서 특이사항): `curl -d` 인라인 + Windows 콘솔 코드페이지가 UTF-8을 깨뜨린 **콘솔 아티팩트**. UTF-8 파일 페이로드(`--data-binary @file`, FE axios와 동일한 UTF-8 JSON)로는 signup·/auth/me 모두 `홍길동` 정상. BE 버그 아님.
- **M1 도메인 필수 항목**(접근제어 교차조회/AiNoticeBanner/EXIF/삭제완전성/공유링크): 모두 SPACE·RECO·SAVE 범위로 M1 표면에 없음 → 해당 없음. M1 보호 리소스는 `@AuthenticationPrincipal`로 자기 토큰만 접근하는 /auth/me·/home/summary 뿐.

## 계약 보완 요청 (리더)
- 버그 2: 비밀번호 형식 오류 코드를 계약(VALID_001)에 맞출지, 계약을 impl(COMMON_400)에 맞춰 완화할지 결정 필요. FE 무영향이므로 어느 쪽이든 통합 통과.

## 운영 메모
- 검증 후반, `TaskStop`이 gradle 래퍼만 종료하고 포크된 JVM은 8080에 잔존 → 신규 기동이 포트 충돌로 실패. 회귀는 수정 빌드를 8081로 기동해 수행함. **8080의 구(舊)코드 JVM(수정 미반영)은 여전히 떠 있으며 종료 권한이 막혀 정리 못 함 — FE 연동/재기동 전 이 프로세스를 종료할 것.**
- 재현 스크립트: `_workspace/qa_scripts/m1.sh {BASE_URL}`.
