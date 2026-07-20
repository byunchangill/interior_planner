# M1 프론트엔드 구현 보고서 — AUTH + HOME

`npm run build` 통과 (tsc + vite, 타입 오류 0). 정적 화면(로그인/회원가입/온보딩/스플래시)은 dev 서버에서 렌더링·콘솔 무오류 확인.

## 구현 화면 (8개)

| 화면ID | 파일 | 원본 | 사용 엔드포인트 |
|--------|------|------|-----------------|
| COM-001 스플래시 | `pages/auth/SplashPage.tsx` | `_27` | GET /auth/me |
| COM-002 온보딩 | `pages/auth/OnboardingPage.tsx` | `_31`, `_32` | — |
| COM-003 로그인 | `pages/auth/LoginPage.tsx` | `_21` | POST /auth/login |
| COM-004 회원가입·약관 | `pages/auth/SignupPage.tsx` | `_20` | POST /auth/signup |
| COM-005 권한 안내 | `pages/auth/PermissionsPage.tsx` | `_33` | — |
| HOME-001 홈 | `pages/home/HomePage.tsx` | `_1` | GET /home/summary |
| HOME-002 스타일 갤러리 | `pages/home/StyleGalleryPage.tsx` | `_15` | GET /styles |
| HOME-003 스타일 상세 | `pages/home/StyleDetailPage.tsx` | `_7`, `_19` | GET /styles/{styleType} |

## 인증 인프라

- `api/client.ts` 인터셉터 완성: 요청 시 `Authorization: Bearer {accessToken}` 첨부, 401 응답 시 `POST /auth/refresh`(bare axios, 재귀 방지) 1회 재시도 → 새 토큰 저장 후 원 요청 재요청. 재시도 실패 또는 refreshToken 부재 시 토큰 삭제 후 `window.location`으로 `/login` 이동. 응답에서 `data.accessToken`/`data.refreshToken`을 꺼냄(계약 준수).
- `api/tokens.ts`: accessToken/refreshToken localStorage 저장소.
- `components/RequireAuth.tsx`: 보호 라우트(홈/공간/추천/보관함/마이). 비로그인 시 `/login`으로 `<Navigate replace>`.
- 라우트 구조: 인증 포커스 화면(스플래시/온보딩/로그인/회원가입/권한)은 셸(BottomNav) 밖, 나머지는 `App` 셸 하위. `/styles`·`/styles/:styleType`는 공개(인증 불필요), 홈 탭은 `/home`으로 이동(스플래시가 `/` 진입점을 점유).

## 계약 대비 판단이 필요했던 부분

1. **로그인 폼**: 원본 `_21`은 소셜 버튼 + "이메일로 로그인" 버튼만 있고 인라인 이메일 폼이 없음. 지시대로 이메일/비밀번호 입력 폼을 추가하고 소셜 버튼 4종(카카오/네이버/Apple/Google)은 클릭 시 "준비 중" 토스트만 노출(API 호출 없음).
2. **회원가입 원스텝**: 원본 `_20`은 약관 동의만 있는 화면. 계약의 `POST /auth/signup`이 이메일/비밀번호/닉네임 + consents 원스텝이므로, 입력 필드와 동의 체크박스를 한 폼으로 통합. consents 매핑 — 이미지처리=`imageProcessing`, 서비스약관=`termsOfService`, 개인정보=`privacyPolicy`(모두 필수), 마케팅=`marketing`(선택). 클라이언트 검증: 이메일 형식, 비밀번호 영문+숫자 8~20자, 필수 동의 3종.
3. **스타일 상세 범위 축소**: 원본 `_7`은 예산/가구리스트 등 다단 섹션이 있으나 계약 `GET /styles/{styleType}` 응답은 title/description/keywords/gallery만 제공 → 히어로 + 컨셉 설명 + 키워드 칩 + 갤러리로 핵심만 구성. RES_001(없는 styleType)은 "스타일을 찾을 수 없습니다" 폴백 처리.
4. **스타일 갤러리 필터**: 원본의 카테고리 칩(모던/미니멀/…)을 StyleType 6종에 매핑(`STYLE_LABELS`)해 클라이언트 필터로 동작하게 구현(API에 category 파라미터 없음).
5. **장식 이미지 대체**: 스플래시/온보딩/권한 화면의 Stitch 원격 스톡 이미지(googleusercontent aida-public)는 만료 위험이 있어 디자인 토큰 기반 아이콘·그라디언트 플레이스홀더로 대체. 데이터성 이미지(홈 thumbnailUrl, 스타일 gallery imageUrl 등)는 API 응답 URL을 그대로 바인딩.

## 목(mock) 사용

없음. 백엔드가 병렬로 동일 계약을 구현 중이므로 실제 axios 호출로만 구현. 연동 검증은 QA 단계에서 수행.

## 미구현 / 범위 외

- 소셜 로그인 실제 연동(FR-AUTH-001, P2): 버튼만 배치.
- `POST /auth/consents`(가입 후 마케팅 동의 변경): 계약에 있으나 M1 화면 목록에 해당 UI 없음 — MY 모듈에서 처리 예정.
- 홈의 "최근 추천 결과" 캐러셀(원본 `_1`): 계약 `/home/summary` 응답에 추천 데이터 없음(recentSpaces/styleHighlights만) → 제외.
