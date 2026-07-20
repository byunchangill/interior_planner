# M2 SPACE 프론트엔드 구현 보고서

계약: `_workspace/contracts/m2.md` / 화면 매핑: `react-ui-dev/references/screen-map.md`
빌드: `npm run build` 통과 (tsc 타입오류 0). 프리뷰(VITE_USE_MOCK=true)로 7개 화면 렌더링·콘솔 무오류 확인.

## 구현 화면 (7개)

| 화면ID | 폴더 | 파일 | 라우트 |
|--------|------|------|--------|
| SPACE-001 내 공간 목록 | _18 | `pages/space/SpaceListPage.tsx` | `/spaces` (탭 셸) |
| SPACE-002 유형 선택 | _24 | `pages/space/SpaceCreatePage.tsx` | `/spaces/new` |
| SPACE-003 사진 촬영 가이드 | _3 | `pages/space/SpacePhotoPage.tsx` | `/spaces/:id/photos` |
| SPACE-004 도면 업로드 | _22 | `pages/space/FloorPlanUploadPage.tsx` | `/spaces/:id/floorplan` |
| SPACE-005 치수 입력·수정 | _9 | `pages/space/SpaceDimensionsPage.tsx` | `/spaces/:id/edit` |
| SPACE-006 기존 가구 등록 | _9 | (SPACE-005와 통합 화면) | `/spaces/:id/edit` |
| SPACE-007 공간 상세 | _23 | `pages/space/SpaceDetailPage.tsx` | `/spaces/:id` |

서브플로우는 하단 탭 없는 포커스 라우트(RequireAuth 보호)로 배치. 목록만 탭 셸 안(`/spaces`).

## 사용 엔드포인트 (계약 일치)

- `GET /spaces` → 목록 (data.items)
- `POST /spaces` {spaceType, name?} → 생성 후 `/spaces/:id/photos` 이동
- `GET /spaces/{id}` → 상세 · 편집화면 프리필
- `DELETE /spaces/{id}` → 목록에서 삭제
- `POST /spaces/{id}/photos` (multipart: file, isFloorPlan) → 사진/도면 등록
- `DELETE /spaces/{id}/photos/{photoId}` → 사진 삭제
- `PATCH /spaces/{id}/dimensions` (isUserVerified=true, openings) → 치수 저장
- `PUT /spaces/{id}/furniture` (전체 목록 교체) → 가구 저장

API 함수는 `api/space.ts` 단일 파일, 응답 unwrap은 함수 내부 처리(페이지엔 도메인 타입만). 타입/enum/한글라벨은 `types/space.ts`.

## 계약 대비 판단이 필요했던 부분

1. **치수 단위 = 미터(m)**: 계약 필드가 `widthM/depthM/heightM`(미터, 1.0~20.0 / 2.0~5.0)이라 원본 _9 디자인의 mm 입력을 m로 변경. 면적은 계약의 `areaPyeong`(평)을 표기하고, 입력값 기준 실시간 평수도 미리보기.
2. **AI 고지 배너(FR-SPACE-005)**: `/spaces/:id/edit` 상단에 고정 배너 + confidence 뱃지(HIGH/MEDIUM/LOW → 색상). 상세(SPACE-007)에도 신뢰도·사용자확인 뱃지 표기.
3. **도면 업로드 형식**: 원본 _22는 PDF 칩을 노출하나, 계약 사진 엔드포인트는 JPG/PNG만 허용(VALID_002). PDF 제외하고 JPG/PNG/20MB만 안내. `accept="image/png,image/jpeg"`.
4. **카메라 촬영(웹)**: 지시대로 `<input type="file" accept="image/*" capture="environment">`(촬영) + `<input type="file">`(앨범) 두 입력으로 구현. 실제 카메라 프리뷰 대신 원본의 촬영 가이드 오버레이(코너 가이드/TIP/좋은·나쁜 예 톤)를 유지.
5. **치수+가구 통합 저장**: _9가 치수·가구 한 화면이라 저장 버튼 1개로 `PATCH dimensions` → `PUT furniture` 순차 호출 후 상세로 이동. 가구 PUT은 현재 목록 전체를 전송(계약의 "빠진 항목 삭제" 시맨틱 준수, furnitureId 있으면 수정/없으면 신규).
6. **창문·문(openings)**: 계약 openings를 type/wall/widthM 편집 로우로 구현(추가/삭제). PATCH 시 openings 항상 동봉.
7. **집/Home 엔티티 없음**(계약 결정1): _18의 "집 추가" 버튼은 제거, "공간 추가"만 유지.
8. **스톡 이미지**: 만료 위험 원격 이미지는 모두 제거. 썸네일 없을 때 유형 아이콘 플레이스홀더, 업로드 사진은 API `url` 바인딩.

## 파일/용량 검증 & 에러 처리

- 클라이언트 사전검증(`pages/space/fileGuard.ts`): MIME(jpeg/png), 20MB.
- 서버 에러코드 매핑: VALID_002(형식/용량), VALID_003(장수 초과 10장), IMG_001(품질) → 사용자 문구.

## Mock (백엔드 병렬 개발 중)

- `api/mock/space.ts`에 계약 shape 그대로의 인메모리 mock. `api/space.ts`의 `MOCK` 스위치는 `import.meta.env.VITE_USE_MOCK==='true'`일 때만 on.
- **기본값 off(실제 API 호출)**. 프리뷰는 임시 `.env.local`(gitignore된 `*.local`)로 켜서 확인 후 삭제함. 실제 연동 시 코드 수정 불필요(env만).
- QA/연동 시 백엔드가 8080에 뜨면 vite proxy(`/api → :8080`)로 그대로 동작.

## 미구현/후속

- SPACE-008 사진 품질 재촬영 안내: 계약상 Mock은 항상 PASSED(IMG_001 미발생)라 UI 스텁만(에러코드 문구 준비). 실제 품질검사 도입 시 재촬영 유도 화면 필요.
- 사진 등록 화면에서 업로드한 썸네일은 세션 로컬 상태로만 표시(재진입 시 상세에서 확인). 필요 시 상세와 동일하게 GET로 재조회 가능.
