# M2 백엔드 구현 보고서 — SPACE (공간 등록·사진·치수·가구)

상태: **완료**. `./gradlew build` 통과, 실제 기동 후 전 엔드포인트 curl 검증(포트 8080). 계약(`_workspace/contracts/m2.md`) 필드/enum/에러코드 일치 확인.

## 구현된 엔드포인트 (`/api/v1/spaces`)

| 메서드 | 경로 | 기능 | 검증 결과 |
|--------|------|------|-----------|
| POST | `/spaces` | 공간 생성 (name 미입력 시 유형 한글명 기본값) | OK. 미정의 spaceType → VALID_003 |
| GET | `/spaces` | 내 공간 목록 (photoCount, thumbnailUrl=첫 사진/없으면 null) | OK |
| GET | `/spaces/{id}` | 상세 (photos, dimensions nullable, furniture) | OK. areaPyeong·confidence·openings 포함 |
| DELETE | `/spaces/{id}` | 공간 삭제 (사진 파일 물리 삭제 포함) | OK |
| POST | `/spaces/{id}/photos` | multipart 사진 등록 + 최초 1회 Mock AI 추정 | OK. EXIF 제거·qualityCheck·detectedFurniture 검증 |
| DELETE | `/spaces/{id}/photos/{photoId}` | 사진 삭제 (파일 물리 삭제) | OK. uploads 파일 수 감소 확인 |
| PATCH | `/spaces/{id}/dimensions` | 치수 확인·수정 (isUserVerified, openings 교체) | OK. 범위 초과 → VALID_003 |
| PUT | `/spaces/{id}/furniture` | 가구 전체 목록 교체 | OK. id 있으면 수정·source 보존, 없으면 USER_ADDED, 누락분 삭제 |

에러 검증: 타인 리소스 → **AUTH_003(403)**, 없는 리소스 → **RES_001(404)**, 미인증 → **401**, 비이미지 업로드 → **VALID_002**.

## 주요 결정·구현 방식

- **소유권 검증 단일 지점**: `SpaceService.ownedSpace(spaceId, userId)` 한 곳만 통과. `findById` 후 `userId` 불일치 시 AUTH_003(403) — 스킬 NFR-SEC-002(404 아닌 403) 준수. 존재하지 않으면 RES_001(404)로 구분.
- **파일 스토리지 추상화**: `common/storage/FileStorageService` 인터페이스 뒤에 `LocalFileStorage`(dev, `backend/uploads/`). prod 오브젝트 스토리지는 구현체 교체만으로 가능. `uploads/`는 `.gitignore` 등록.
- **EXIF/GPS 제거**: `ImageIO.read → ImageIO.write` 재인코딩으로 모든 메타데이터(GPS 포함) 제거. **새 의존성 없이 JDK 표준(javax.imageio)만 사용.** GPS EXIF를 심은 실제 JPEG 업로드→서빙 파일에서 GPS/0th IFD가 완전히 사라짐을 piexif로 확인. 원본 포맷(jpg/png)은 유지.
- **파일 서빙**: `FileServingConfig`(WebMvcConfigurer)가 `/files/**` → uploads 디렉토리 매핑. SecurityConfig에서 `/files/**`는 이미 permitAll(변경 불필요). `/spaces/**`는 `anyRequest().authenticated()`로 커버되어 **SecurityConfig 수정 없음**.
- **용량 20MB**: `LocalFileStorage`에서 20MB 초과 시 VALID_002. multipart 서블릿 한도는 컨트롤러 도달을 위해 21MB/25MB로 설정하고, 그 이상은 `MaxUploadSizeExceededException` 핸들러가 VALID_002로 변환(GlobalExceptionHandler에 추가).
- **Mock AI**: `AiEstimationService` 인터페이스 + `MockAiEstimationService`. 공간 유형별 프리셋 치수(예: LIVING_ROOM 4.2×3.5×2.3, confidence=MEDIUM)와 대표 가구 1~2종. **최초 사진(사진 0장 & dimension null)일 때만** 치수·가구 생성, 이후 `detectedFurniture: []`. M3에서 인터페이스 구현체 교체 가능.
- **areaPyeong**: 저장하지 않고 `widthM*depthM / 3.3058` 소수 첫째 자리 반올림으로 응답 시 계산(4.2×3.5→4.4, 4.5×3.6→4.9 계약 예시 일치).
- **엔티티**: `Space`(userId 직접 소속, Home 엔티티 없음), `SpacePhoto`, `Dimension`(1:1, openings 소유), `Opening`, `Furniture`. 모두 `Long` IDENTITY, enum은 `@Enumerated(STRING)`. cascade ALL + orphanRemoval로 공간 삭제 시 자식 정리, 사진 파일은 서비스에서 명시적 물리 삭제.

## 계약 대비 판단이 필요했던 부분

1. **PATCH dimensions로 치수 최초 생성**: 계약은 "확인·수정"만 명시하나 사진 없이 수동 입력하는 화면 흐름을 위해 dimension이 null이면 새로 생성하도록 허용. 이때 confidence는 `isUserVerified ? HIGH : MEDIUM`으로 설정(계약의 DimensionResult 응답에는 confidence 필드가 없어 노출 안 됨, GET 상세에서만 보임). — 계약 위반 없음, 판단 기록용.
2. **PUT furniture에서 이 공간에 없는 furnitureId 전송**: 계약 미정의. 잘못된 참조로 보아 **RES_001** 반환. (신규로 처리하지 않음 — id를 명시했으므로.)
3. **openings widthM 범위**: 계약에 개구부 너비 범위 명시 없음. 0.1~20.0으로 방어적 검증(VALID_003).

## Mock/스텁 항목 (M3 이후 교체 대상)

- `MockAiEstimationService`: 실제 이미지 분석 아님, 유형별 고정 프리셋.
- `qualityCheck`: 항상 `PASSED` (FR-SPACE-008 품질 검사 스텁). `IMG_001` 코드는 정의만 하고 Mock에선 미발생.

## 참고: 기존 코드 관찰 (M2 범위 밖, 미수정)

- 잘못된 JSON 본문(깨진 UTF-8 등 `HttpMessageNotReadableException`)은 전용 핸들러가 없어 **COMMON_500**으로 떨어짐. 정상 요청엔 영향 없으나, 필요 시 M1 `GlobalExceptionHandler`에 400 매핑 추가 검토 가능. (리더 판단 필요 시 별도 논의.)

## 변경/추가 파일

- 신규: `space/` (엔티티 5, enum 7, repository, DTOs, service, controller, AI 인터페이스+Mock), `common/storage/` (FileStorageService, LocalFileStorage, FileServingConfig)
- 수정: `common/exception/ErrorCode.java`(AUTH_003·VALID_002·VALID_003·IMG_001 추가), `common/exception/GlobalExceptionHandler.java`(MaxUploadSize→VALID_002), `application.yml`(multipart·storage), `.gitignore`(uploads/)
- SecurityConfig **무수정**.
