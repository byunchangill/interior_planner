# M2 SPACE QA 리포트 (1차)

판정 기준: `_workspace/contracts/m2.md` · 검증 방식: 계약 vs 실제 BE 응답(curl/python multipart) vs FE 호출 코드(axios) 교차 비교 + 실제 실행(BE 8080 기동, 실제 브라우저 axios E2E).

## 결과 요약

**PASS** — High 0, Mid 0, Low 2(차단 아님). 6개 필수 경계면 포인트 전부 통과.

## 실행 검증 (동적)

- BE `./gradlew bootRun` 8080 기동 성공(5.3s). 미인증 요청 → 401.
- 사용자 A/B 2명 생성 후 전 흐름 실행:
  - **E2E**: POST /spaces(200) → POST photos(GPS jpeg, Mock AI 2종 추정) → POST 도면(isFloorPlan=true, detected=[]) → GET 상세(dimensions/furniture 채워짐) → PATCH dimensions(areaPyeong 4.9, openingId 발급) → PUT furniture(유지+추가) → PUT 전체교체(누락분 삭제) → GET 목록 → DELETE → 재조회 RES_001. 전부 계약 예시와 필드 단위 일치.
  - **실제 브라우저 axios 업로드**: origin 5173(CORS 허용)에서 axios 1.18.1로 `POST /spaces/{id}/photos`(FormData) → **200**. 응답 `url`/`qualityCheck`/`detectedFurniture` shape 계약 일치.

## 경계면 필수 포인트 판정

| # | 포인트 | 판정 | 근거 |
|---|--------|------|------|
| 1 | multipart 업로드(`file`,`isFloorPlan`) | PASS | FE FormData 필드명 = BE `@RequestParam` 일치. 실제 브라우저 axios 업로드 200, 응답 shape 일치 |
| 2 | EXIF/GPS 제거(NFR-PRIV-002) | PASS | GPS 심은 실제 JPEG 업로드 → 서빙 파일 piexif 검사: GPS/0th 키 0개, `Exif`/`TestCam` 마커 바이트 부재 |
| 3 | 소유권 검증(AUTH_003) | PASS | B 토큰으로 A 공간 GET/PATCH/PUT/DELETE/POST photos → **전부 403 AUTH_003** |
| 4 | enum 정합 | PASS | SpaceType/FurnitureType/OpeningType/Wall/Confidence/Source 대소문자·언더스코어 완전 일치. 미정의값(`living_room`,`COUCH`) → VALID_003 |
| 5 | 치수+가구 순차 저장 | PASS | PATCH dimensions → PUT furniture 순차 200, 상태 일관(GET 상세로 확인) |
| 6 | PUT furniture 전체교체 | PASS | id 있으면 수정+source 보존(AI_DETECTED), id 없으면 USER_ADDED 추가, 요청서 빠진 기존 항목 삭제 확인 |

## 정적 교차 비교 (통과)

- URL/메서드: BE `/api/v1/spaces...` = FE axios baseURL `/api/v1` + 경로. vite proxy `/api→:8080`, BE CORS 허용 origin `http://localhost:5173` 일치.
- 중첩 구조: 목록 `data.items[]`(FE unwrap `.then(d=>d.items)`), 가구 `data.furniture[]`(FE `.then(d=>d.furniture)`) — 정확히 대응.
- null 처리: `thumbnailUrl` nullable, `dimensions` nullable — FE 타입에 `| null` 반영됨.
- createdAt: BE `Instant`(나노초 포함 ISO-8601) → FE `string` 표시용, 문제 없음.
- areaPyeong: 미저장·응답 시 계산(4.2×3.5→4.4, 4.5×3.6→4.9) 계약 예시 일치.

## 버그 (Low — 차단 아님)

| # | 심각도 | 위치 | 증상 | 계약 기준 판정 | 담당 |
|---|--------|------|------|---------------|------|
| 1 | Low | common (정적 리소스/`/files/**`) | 존재하지 않는 `/files/{name}` GET → **HTTP 500**(정상은 404) | 계약 미정의. 삭제/미존재 파일 URL은 M2 정상 흐름 밖(FE는 삭제된 리소스를 참조 안 함, 이미지 깨짐은 404/500 동일). 물리 삭제 자체는 정상 동작(FR-DATA-002 충족) | backend-dev(선택) |
| 2 | Low | common/exception | 깨진 JSON 본문(비-UTF-8 등 `HttpMessageNotReadableException`) → COMMON_500 | 백엔드 보고서 기존 관찰. M2 정상 흐름 밖 | backend-dev(선택) |

## 오탐 정정 기록 (중요)

- 1차 조사 중 FE `api/space.ts`의 `uploadPhoto`가 `headers:{'Content-Type':'multipart/form-data'}`(boundary 없음)를 명시 → 업로드 실패 가능성을 의심. **손수 만든 XHR로 재현 시 500** 발생.
- 그러나 이는 axios를 우회한 불충실 재현이었음. axios 1.18.1은 브라우저 FormData에 대해 `resolveConfig.js:85 setContentType(undefined)`로 수동 지정 헤더를 **제거**하고 브라우저가 boundary를 붙이도록 함. 실제 axios 경로로 재검증(origin 5173, UMD axios 로드 후 space.ts와 동일 호출) → **200**. → **버그 아님**. 실제 코드 경로로 실행 검증한 결과만 채택.

## 통과 항목 요약

- 8개 엔드포인트 전부 계약 필드/enum/에러코드 일치.
- EXIF/GPS 제거·소유권 403·enum 검증·전체교체 시맨틱·물리 삭제 모두 실동작 확인.
- FE `npm run build` 통과(tsc 0 오류). mock 기본 off(.env.local 부재 확인) → 실제 `/api` 프록시 호출.

## 계약 보완 요청

- (선택) 미존재/삭제된 `/files/**` 접근 시 응답 코드(404 권장)를 계약에 명문화하면 Low #1 판정이 명확해짐.
