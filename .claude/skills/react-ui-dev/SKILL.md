---
name: react-ui-dev
description: HomeStyler 프론트엔드(React) 구현 규약. Stitch 디자인(docs/_N/code.html)을 React 화면으로 이식하거나 frontend/ 디렉토리를 만지는 모든 작업에서 반드시 이 스킬을 먼저 읽을 것. "화면 만들어줘", "UI 구현", "디자인 적용", "페이지 추가", "프론트 수정", "화면 한글화" 요청 포함. 어떤 docs 폴더가 어떤 화면인지는 이 스킬의 screen-map이 유일한 기준이다.
---

# React 구현 규약 — HomeStyler

`frontend/`의 모든 코드는 이 규약을 따른다. 핵심 원칙: **디자인은 이미 완성되어 있다. 새로 디자인하지 말고 이식하라.**

## 프로젝트 구조

```
frontend/src/
├── api/            # axios 인스턴스(client.ts) + 모듈별 API 함수 + mock
├── types/          # 계약 문서에서 옮긴 응답 타입·Enum (모듈별 파일)
├── components/     # 공통 컴포넌트 (BottomNav, Header, AiNoticeBanner 등)
├── pages/          # 화면ID 단위 페이지 — pages/space/SpaceListPage.tsx
├── hooks/          # useAuth, usePolling 등
└── styles/         # 전역 CSS (디자인 토큰은 tailwind.config)
```

- 라우트 경로는 IA의 화면 흐름을 따른다: `/login`, `/spaces`, `/spaces/new`, `/spaces/:id`, `/reco/setup`, `/reco/jobs/:jobId`, `/reco/:id`, `/saved`, `/share/:token`, `/my` 등
- 페이지 파일 상단 주석에 화면ID와 원본 폴더를 남긴다: `// SPACE-001 내 공간 목록 — docs/_18`

## Stitch HTML → React 이식 규칙

1. **원본을 먼저 읽는다**: `references/screen-map.md`에서 폴더를 찾고, `docs/_N/code.html`의 마크업과 `screen.png`를 확인한다.
2. **Tailwind 클래스를 그대로 가져온다**. 디자인 토큰(색상·타이포·라운딩)은 M0에서 `tailwind.config`에 이식된 것을 사용하므로 `bg-primary`, `text-on-surface` 같은 클래스가 그대로 동작해야 한다. 임의 hex 하드코딩 금지.
3. **CDN 의존 제거**: 원본의 `cdn.tailwindcss.com` 스크립트는 버린다. 폰트(Plus Jakarta Sans, Inter)와 Material Symbols는 `index.html`에 한 번만 로드.
4. **정적 텍스트 → 데이터 바인딩**: 원본의 하드코딩 텍스트(예: "북유럽 스타일")를 API 응답으로 치환한다. 이때 응답 필드는 계약 문서의 타입(`types/`)만 참조한다.
5. **반복 요소는 컴포넌트로**: 원본에 3회 이상 반복되는 카드·칩은 컴포넌트로 추출하되, 그 외에는 과도하게 쪼개지 않는다 (디자인 diff 확인이 어려워진다).
6. **언어는 한글판 기준**: 영문/한글 중복 화면은 한글판 폴더를 쓴다 (screen-map에 표시됨). 영문 원본만 있으면 한글로 번역해 구현한다.
7. **AI 한계 고지**: 추천 결과 관련 화면(RECO-004~008)에는 공통 `AiNoticeBanner` 컴포넌트("본 결과는 AI 추정으로 실제 치수·시공 가능 여부와 다를 수 있습니다")를 반드시 포함한다 — FR-RECO-012는 법적 고지 의무다.

## API 연동 규약

- 모든 호출은 `api/client.ts`의 단일 axios 인스턴스를 통한다. 토큰 첨부·401 시 refresh 재시도는 인터셉터가 처리하므로 페이지에서 토큰을 직접 다루지 않는다.
- 응답 타입은 계약 문서에서 `types/`로 옮겨 정의하고, `data` unwrap은 API 함수 안에서 처리해 페이지에는 도메인 타입만 노출한다.
- 백엔드 미완성 시 mock은 `api/mock/{module}.ts`에만 둔다. 페이지 컴포넌트 안에 mock 데이터 인라인 금지 — 실제 연동 시 한 파일 교체로 끝나야 한다.
- 분석 진행(RECO-003)은 `usePolling` 훅으로 2초 간격 폴링, COMPLETED/FAILED 시 중단.

## 완료 기준

모듈 구현 완료를 선언하기 전에:
1. `npm run build` 통과 (타입 오류 0)
2. 구현 화면과 `screen.png`를 눈으로 비교 — 레이아웃·색·타이포가 원본과 동일한가
3. 사용 엔드포인트가 계약 문서와 일치하는가 (URL, 필드명)

## 참고

- 폴더↔화면ID 매핑: `references/screen-map.md` (필수 — 폴더 번호를 추측하지 말 것)
