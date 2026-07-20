# M3 RECO 백엔드 구현 보고서

**모듈**: RECO (조건 설정·비동기 AI 분석·추천 결과)
**패키지**: `com.homestyler.recommendation`
**빌드**: `./gradlew build` 통과 (테스트 11개 포함). 실기동 E2E 계약 대비 검증 완료.

## 엔드포인트 (계약 m3.md 대비 모두 구현·검증)

| 메서드 | 경로 | 상태 | 검증 결과 |
|--------|------|------|-----------|
| POST | `/api/v1/analyses` | 202 | analysisId 즉시 반환 (실측 0.04s) |
| GET | `/api/v1/analyses/{id}` | 200 | 단계별 status/progress/label 폴링 |
| GET | `/api/v1/recommendations/{id}` | 200 | 8섹션 + 새 필드 전체 |
| GET | `/api/v1/recommendations/{id}/visuals` | 200 | before(원본)/after(플레이스홀더) 쌍 |
| POST | `/api/v1/recommendations/{id}/visuals/regenerate` | 202 | 스텁 `{status:QUEUED}` |

## 비동기 구조

- `@EnableAsync` + 전용 `analysisExecutor`(ThreadPoolTaskExecutor) — `AsyncConfig`.
- `AnalysisWorker.run(jobId)` `@Async("analysisExecutor")`: QUEUED→ANALYZING_STRUCTURE→LIGHT→FLOW→GENERATING_RECO→GENERATING_VISUAL→COMPLETED 를 단계별 2~2.5초 지연으로 진행(총 ~10.5초).
- 상태 전환은 `AnalysisJobStore`(프록시)를 통해 **단계별 독립 트랜잭션 커밋** → 폴러에게 즉시 노출. 컨트롤러는 동기 대기 없음.
- 커밋-후-트리거: 컨트롤러가 `store.create()`(트랜잭션 커밋) → `worker.run(id)` 순으로 호출해 async 스레드가 미커밋 잡을 읽는 레이스를 차단.
- 실패 시 자동 재시도 1회, 최종 실패 → FAILED + 사유 저장(NFR-AVAIL-002). Mock 은 실패하지 않음(방어적 구현).
- **실측 단계 진행 확인**: 20→40→60→80→90→100, 라벨 계약 매핑표와 일치.

## fitScore — 실제 산술 계산 (Mock 아님)

- `FitScoreCalculator` (순수 클래스): 공간 widthM/depthM vs 추천 items 치수(mm→m).
  - 통로 폭 = depthM − Σ(가구 depth): ≥0.6 GOOD / 0.4~0.6 CHECK / <0.4 BLOCKED
  - 가구 폭 vs 벽 길이: 여유 = widthM − 최대가구 width: <0 BLOCKED / <0.2 CHECK / else GOOD
  - 총점 = 판정 평균(GOOD 100 / CHECK 70 / BLOCKED 30), measureBeforeBuy 는 CHECK/BLOCKED 관여 치수 수집.
- **부동소수 경계 보정**: 물리 치수를 cm 단위로 반올림 후 비교(예 `2.0-1.6=0.399…` → 0.40). 표시 cm 와 판정이 항상 일치.
- **단위 테스트** `FitScoreCalculatorTest` (10 케이스): 통로 0.60/0.59/0.40/0.39, 벽 여유 0.20/0.19/음수 경계, 총점·measureBeforeBuy 집계, 무-아이템. 전부 통과.

## Mock AI (`AiAnalysisService` 인터페이스 + `MockAiAnalysisService`)

- M2 `AiEstimationService` 와 동일 패턴 — 실제 어댑터 교체 가능(BL-001).
- 선택 스타일 수(1~3)만큼 `Recommendation` 행 생성. 상세 콘텐츠는 저장하지 않고 **조회 시 잡 조건+공간 데이터로 결정적 재생성**(itemId = recommendationId*100+idx 로 안정적 파생). → 중첩 엔티티 테이블 5개 절감.
- **생활방식(lifestyle)이 결과에 반영됨(검증됨)**:
  - `hasPets` → 소파 reason "긁힘에 강한 고밀도 패브릭", 바닥 "스크래치·습기에 강한 강마루", layout "반려동물 이동 반경".
  - `worksFromHome` → item3 = 작업 책상(아니면 액센트 체어), 커튼 "재택 — 눈부심 저감".
  - `storagePreference=STORAGE` + `housingType=OWNED` → 대용량 옷장 "(붙박이 시공)" + `expertRequired:true`(RECO-008 유도).
  - `preferredColors` → 벽지 reason 에 선호색 반영.
- items 스키마는 실제 판매 제품형(brand/name/category/widthMm/depthMm/heightMm/price/purchaseUrl/position/reason/expertRequired) — 값만 Mock.
- `keepFurnitureLayout` 은 keepFurnitureIds 비면 `null`(검증됨: rec3 = null, rec1 = furnitureIds:[1]).
- 시각화: afterUrl 정적 플레이스홀더, beforeUrl = M2 원본 사진. 사진 없으면 beforeUrl null + `partial:true`.

## 엔티티·DB

- `AnalysisJob`(요청 조건 전체 보존: styles/budget/colors/requiredFurniture/keepFurnitureIds + `@Embedded Lifestyle`), `Recommendation`(식별·소유 정보만). ID Long IDENTITY, Instant Auditing, Enum STRING.
- 소유권: **M2 `SpaceService.ownedSpace()` 재사용**(private→public 로 노출, 단일 지점). 잡/추천 소유권도 동일 패턴(userId 불일치 → AUTH_003, 없음 → RES_001).

## 에러 코드 (실기동 검증)

VALID_001(400, 공간 불완전) · VALID_003(400, 스타일 수/enum) · LIMIT_001(409, 동시 분석) · AUTH_003(403) · RES_001(404) 전부 계약대로 반환 확인. AI_001/AI_004/DATA_001 은 enum 정의(Mock 경로에서 미발생).

## 계약 대비 판단·변경 사항

- 계약 필드/enum/에러코드 **임의 변경 없음**. 응답 JSON 필드 단위로 계약 예시와 일치 확인.
- `ErrorCode` 에 M3 코드(LIMIT_001/AI_001/AI_004/DATA_001) 추가. VALID_001 은 M1 정의(메시지 상이)를 재사용하되 `ApiException(VALID_001, "…")` 로 공간-특화 메시지 오버라이드.

## backend/ 밖 최소 변경 (RECO 구현에 필수)

1. `common/exception/ErrorCode.java` — M3 에러코드 4개 추가.
2. `common/exception/GlobalExceptionHandler.java` — 미처리 예외에 `log.error` 추가(기존엔 스택이 삼켜져 500 원인 추적 불가였음. 진단 중 발견·보강).
3. `space/SpaceService.java` — `ownedSpace()` private→public(소유권 단일 지점 재사용).

## 알려진 사항 / QA 참고

- **(교차모듈, 미수정)** 잘못된 UTF-8/깨진 JSON 바디는 `HttpMessageNotReadableException` → COMMON_500 으로 떨어짐(이상적으론 COMMON_400). RECO 범위 밖 공통 처리라 미수정. 별도 태스크 권장.
- Mock 단계 지연은 테스트 편의를 위해 총 ~10.5초로 축약(계약 "15초 내외"). `AnalysisWorker.STEP_MS` 조정 가능.
- 추천 상세는 조회 시 재생성(결정적)이라 별도 저장 없음 — 실AI 도입 시 생성 결과 영속화가 필요하면 `Recommendation` 에 콘텐츠 컬럼 추가로 확장.
