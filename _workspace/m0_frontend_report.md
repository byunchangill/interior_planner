# M0 프론트엔드 스캐폴딩 — 구현 보고서

- 일자: 2026-07-19
- 담당: frontend-dev
- 계약: `_workspace/contracts/m0.md` (프론트엔드 산출 범위)
- 위치: `frontend/`

## 1. 부트스트랩 / 스택

- `npm create vite@latest frontend -- --template react-ts` 로 생성
- 실제 템플릿 버전: **Vite 8 + React 19 + TypeScript** (create-vite 최신 기본값)
  - 계약 문구는 "React 18"이나, 지정된 명령(`npm create vite@latest`)의 산출물이 React 19였음. 다운그레이드 시 이점 없이 리스크만 커져 템플릿 기본값(19)을 유지. API 사용은 18/19 호환 범위 내.
- 추가 설치: `react-router-dom`, `axios` (runtime), `tailwindcss@3` + `postcss` + `autoprefixer` (dev)
  - Tailwind는 **v3** 채택. 디자인 원본(`docs/_1/code.html`)이 `tailwind.config` JS 객체 형태로 토큰을 정의하고, 규약이 `bg-primary`·`text-on-surface`·`font-label-sm`·`text-body-md` 같은 커스텀 토큰 클래스를 요구 → v3의 `tailwind.config.js` 이식이 가장 충실·안정적.

## 2. 구현 산출물

### 디자인 토큰 이식 — `frontend/tailwind.config.js`
- `docs/homestyler_design_system/DESIGN.md` frontmatter의 **colors 전체(49개)**, **typography(9종: fontFamily+fontSize)**, **rounded(sm/DEFAULT/md/lg/xl/full)**, **spacing(gutter/margin/stack 등)** 이식.
- 클래스명 = 토큰명. 빌드 산출 CSS에서 실동작 확인:
  - `.bg-primary-container{background-color:rgb(79 70 229 ...)}`
  - `.text-on-surface{color:rgb(25 28 29 ...)}`
  - `.text-on-primary-container{color:rgb(218 215 255 ...)}`
- rounded는 계약 지시대로 **DESIGN.md frontmatter 값** 사용(DEFAULT 0.5rem, lg 1rem, xl 1.5rem). 참고: Stitch `_1` 원본 config는 다른 값(DEFAULT 0.25rem 등)이나 계약이 DESIGN.md 우선을 명시.

### 폰트 / 아이콘 — `frontend/index.html`
- CDN Tailwind 스크립트 제거(규약 3). Google Fonts(Plus Jakarta Sans, Inter) + Material Symbols Outlined 를 index.html에서 1회 로드. `<html lang="ko">`, `<title>HomeStyler</title>`.

### 라우터 셸 — `frontend/src/main.tsx`, `src/App.tsx`
- `createBrowserRouter` 5개 경로: `/`(HOME-001), `/spaces`(SPACE-001), `/reco`(RECO-001), `/saved`(SAVE-001), `/my`(MY-001).
- `App.tsx` = 셸 레이아웃(`<Outlet/>` + `<BottomNav/>`, `max-w-md` 모바일 컨테이너, 하단 탭 여백 `pb-24`).

### BottomNav — `frontend/src/components/BottomNav.tsx`
- 디자인 원본 `docs/_1/code.html`의 BottomNavBar 마크업/클래스 이식.
- 흰(surface) 배경, `border-outline-variant`, 활성 탭 `bg-primary-container text-on-primary-container` + 아이콘 FILL 1, 비활성 `text-on-surface-variant`. Material Symbols 아이콘(home/chair/auto_awesome/inventory_2/person).
- `NavLink` 활성 상태로 현재 경로 하이라이트.

### API 레이어
- `src/api/client.ts`: 단일 axios 인스턴스(`baseURL: '/api/v1'`), **요청 인터셉터**(localStorage `accessToken` → `Authorization: Bearer`), **응답 인터셉터**(401 refresh 재시도 자리 = M0 스텁, TODO(M1)), **`unwrap<T>()`** 헬퍼로 `ApiResponse<T>` → `data` 언랩(+ success=false 시 throw).
- `src/api/health.ts`: `getHealth(): Promise<HealthStatus>` — `GET /api/v1/health`.
- `src/types/common.ts`: `ApiResponse<T>`, `ApiError`, `HealthStatus`(계약 응답 shape).

### 홈 화면 /health 연동 — `src/pages/HomePage.tsx`
- 마운트 시 `getHealth()` 호출, loading/ok/error 3상태 렌더. ok 시 status·service·timestamp 표시, error 시 error-container 카드로 실패 사유 + 백엔드 확인 안내.

### Placeholder 페이지
- `SpaceListPage`/`RecoPage`/`SavedPage`/`MyPage` — 공통 `components/PlaceholderPage.tsx` 사용, 각 파일 상단에 화면ID + 원본 폴더 주석(screen-map 기준). 본 구현은 M1+.

### Vite proxy — `frontend/vite.config.ts`
- `server.port: 5173`, `proxy['/api'] → http://localhost:8080` (changeOrigin).

## 3. 검증 결과

- **`npm run build` 통과**: `tsc -b && vite build` 성공, **타입 오류 0**. 85 modules, dist 생성(js 334.93kB / css 8.32kB).
- **토큰 컴파일 확인**: dist CSS에 커스텀 토큰 유틸리티 실제 생성됨(위 예시).
- **런타임 확인**(dev 서버 5173, read_page):
  - 홈: 헤딩 "HomeStyler" + 백엔드 연동 카드 렌더. 백엔드 미기동이라 `/api/v1/health`가 502 → HomePage가 에러 상태로 정상 표시(프록시 정상 동작 방증).
  - BottomNav 5탭 렌더, `/spaces` 이동 시 SPACE-001 placeholder + 하단 탭 유지 → 라우팅 정상.

## 4. 특이사항 / 후속

- **React 19 / Vite 8 / Tailwind 3** 조합(계약의 "React 18" 대비 상향). 문제 없으면 유지 권장.
- 401 refresh는 **스텁**(주석 TODO(M1)). M1 인증 모듈에서 `/api/v1/auth/refresh` 연동으로 채울 것.
- 홈 health 카드는 연동 검증용 임시 UI — M1+에서 `docs/_1` 실제 홈 콘텐츠로 교체.
- mock 미사용(health는 실제 엔드포인트 계약만 존재). 백엔드 기동 시 그대로 연동됨.
- 프로젝트 루트에 `.claude/launch.json`(frontend-dev, npm run dev, port 5173) 추가 — 프리뷰/검증용.
```
```
