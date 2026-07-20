# M5 (MY/DATA) 구현·검증 보고서

> 병렬 구현 에이전트 2개가 세션 한도로 조기 종료(BE는 빌드 후 curl 검증 전, FE는 라우트 배선 전)되어, 리더가 잔여 배선 + 런타임 QA를 직접 완료했다. 그래서 개별 BE/FE 에이전트 보고서 대신 이 통합 보고서로 갈음한다.

## 완성 상태

- 계약: `_workspace/contracts/m5.md`
- BE 빌드: `./gradlew build` 통과 / FE 빌드: `npm run build` 통과
- 5개 엔드포인트 전부 구현·검증: GET /me/profile, PATCH /me, GET /me/images, DELETE /me/images, DELETE /me

## 에이전트 종료 후 리더가 채운 갭

1. **FE 라우트 배선** (`frontend/src/main.tsx`): 에이전트가 `pages/my/`에 5개 화면을 만들었으나 라우트에 연결하지 못하고 종료. 옛 placeholder `pages/MyPage.tsx` import를 신규 `pages/my/MyPage.tsx`로 교체하고, `/my/account`(MY-003)·`/my/data`(MY-002)·`/my/withdraw`(MY-004)·`/my/support`(MY-005)를 포커스 라우트(하단 탭 없음, RequireAuth 보호)로 추가. 옛 placeholder 삭제.
2. **FE mock 타입 오류 1건** (`frontend/src/api/mock/my.ts`): `fail()` 헬퍼에서 `ms`가 `setTimeout` 지연이 아니라 `reject()`의 2번째 인자로 잘못 들어가 tsc 실패(TS2554). 괄호 위치 수정.

## 런타임 QA (리더 직접, `_workspace/qa_scripts/m5.sh`)

BE를 8080 실기동하고 파괴적 흐름을 실제 실행. **11/11 PASS**:

- **물리 삭제(NFR-SEC-004)**: 사진 2장 업로드 → 디스크에 파일 2개 존재 확인 → `keepResults=true`로 1장 삭제 → 목록 1로 감소 + **정확히 1개 파일이 스토리지에서 물리 삭제됨** 확인.
- **탈퇴 비밀번호 게이트**: 틀린 비밀번호 → AUTH_001. 맞는 비밀번호 → deleted=true.
- **탈퇴 연쇄 삭제(FR-DATA-004)**: 탈퇴 후 **사용자의 모든 사진 파일이 디스크에서 사라짐** + 같은 계정 재로그인 실패(사용자·연관 데이터 완전 삭제).
- **SHARE_002 데이터 안전 가드**: 원본 포함 공유링크(includeOriginalPhotos=true)가 걸린 사진을 confirmShareRevoke=false로 삭제 시도 → SHARE_002 선차단. confirmShareRevoke=true 재요청 → 삭제(deletedCount=1) + 공유링크 회수(revokedShareLinks=1).

## 경계면 정합 (BE 실응답 vs FE 타입)

- `/me/profile` 응답 키(userId/email/nickname/consents{4}/stats{3})와 PATCH /me 응답(userId/nickname/marketing)이 `frontend/src/types/my.ts`와 필드 단위 일치.
- `frontend/src/api/my.ts`의 5개 엔드포인트 경로·메서드·body 방식(DELETE는 `{data:body}`)이 계약·BE와 일치.

## 알려진 이슈 (비차단)

- 비UTF-8/깨진 JSON 본문 → COMMON_500 (M2/M3부터 반복된 크로스모듈 관찰). 별도 태스크로 분리됨. FE axios 경로는 항상 valid UTF-8 JSON이라 실사용 영향 없음. (초기 m5.sh가 Windows Git Bash 콘솔 코드페이지로 한글을 깨뜨려 이 500을 재현했으나, ASCII 페이로드로 교체해 해결 — 제품 버그 아님.)
- MY-005 고객센터는 계약대로 화면만(정적 UI), API 없음.
