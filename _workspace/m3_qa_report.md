# M3 (RECO) QA 리포트 (1차)

**모듈**: RECO — 조건 설정·비동기 AI 분석·추천 결과
**방식**: 계약(m3.md) ↔ 실제 BE 응답(curl 실기동, 8080) ↔ FE 호출·타입 교차 비교 + E2E 실행
**최종 판정**: **PASS** — High 0, Medium 0, Low 1(교차모듈)
**재현 스크립트**: `_workspace/qa_scripts/m3.sh` (시드→비동기 분석→폴링→상세/시각화, 재사용 가능)

## 실행 요약

BE를 8080에 실기동(H2 in-memory), FE는 mock off(기본값) 코드 경로 그대로 검증. `npm run build` 통과(tsc+vite, 118 modules). 사용자 2명 시드로 공간 등록(사진 업로드+치수)→분석 제출(202)→5단계 폴링→COMPLETED까지 실제 대기하며 상태 전이 관찰. 서로 다른 lifestyle로 2회 분석해 결과 차이 확인.

## 통과 항목 (경계면 7포인트 + 도메인 필수)

| # | 검증 포인트 | 결과 |
|---|-------------|------|
| 1 | **비동기 폴링 정합** | POST 202 `{analysisId,status:QUEUED,estimatedSeconds:15}` → FE가 analysisId로 `/reco/jobs/{id}` 이동, usePolling 5초. 폴링 6회로 QUEUED→…→COMPLETED 관찰. COMPLETED 시 `recommendationIds:[1,2]` 반환→FE 요약 이동. 진행 중엔 `recommendationIds:[]`(빈 배열, null 아님 → FE non-null 타입과 정합) |
| 2 | **status enum 8종** | BE 반환 `ANALYZING_STRUCTURE/LIGHT/FLOW/GENERATING_RECO/GENERATING_VISUAL/COMPLETED` 문자열이 FE `JobStatus` 유니온·`PROGRESS_STEPS`와 정확 일치. progress 20/40/60/80/90/100 + currentStepLabel 계약 매핑표와 문자 일치 |
| 3 | **추천 상세 8섹션+새 필드** | concept/layout/materials(4종)/spaceTips/storage/keepFurnitureLayout/budgetPlans/items/fitScore/disclaimers 전 필드 실응답 diff 일치. `keepFurnitureLayout:null` 케이스 확인(FE 섹션 숨김 처리 존재). items 실제 제품형 필드(brand/name/category/widthMm/depthMm/heightMm/price/purchaseUrl/position/reason/expertRequired) 일치 |
| 4 | **fitScore 신호등(실제 산술)** | 넓은 공간(4.0×3.2): total 100, 통로 98cm(=3.2−0.92−0.6−0.7) GOOD. 좁은 공간(2.0×2.0): total 30, 통로/벽 모두 BLOCKED, measureBeforeBuy 2건. verdict GOOD/CHECK/BLOCKED → FE `VERDICT_META` 색상 매핑·measureBeforeBuy 표시 정합. **Mock 아닌 실제 치수 계산 확인** |
| 5 | **expertRequired** | lighting(항상)·대용량 옷장(STORAGE+OWNED) `expertRequired:true` → FE materials/items 경고 배지 + RECO-008 이동, 상세 하단 "전문가 확인 N건" 집계 CTA 정합. ExpertNoticePage가 materials+items 모두 순회 |
| 6 | **생활방식 반영** | 2회 분석 reason 차이 확인. hasPets=true: 소파 "긁힘에 강한 고밀도 패브릭"/바닥 "스크래치·습기에 강한 강마루"/layout "반려동물 이동 반경". hasPets=false: "무채색 톤 로우 소파"/"따뜻한 우드톤 바닥". WFH=true→item3 책상 / false→액센트 체어. STORAGE+OWNED→대용량 옷장(붙박이,expertRequired) / OPENNESS+JEONSE→슬림 서랍장. preferredColors→벽지 reason 반영. **설문이 결과를 실제 구동함** |
| 7 | **소유권/제한** | 타인 추천안·분석·visuals 조회 → **AUTH_003(403)**. 진행 중 재요청 → **LIMIT_001(409)**. 공간 사진/치수 미완료 → **VALID_001(400)**. 스타일 4개 / 미정의 enum → **VALID_003(400)**. 없는 리소스 → **RES_001(404)**. 무토큰 → 401. 전부 계약대로 |

**전후 비교(RECO-006)**: visuals `{pairs:[{beforeUrl(원본),afterUrl(플레이스홀더),viewLabel}]}` 일치. 원본 없을 시 `beforeUrl:null`+`partial:true` 경로 존재, FE After 단독+고지 배너 처리. regenerate 202 `{status:QUEUED}` 스텁 정합.

**도메인 필수**: 접근 제어 2사용자 교차 검증 통과. AI 한계 고지 `AiNoticeBanner` 결과 3화면(요약/상세 sticky/전후비교) 포함(FR-RECO-012). EXIF 제거 `LocalFileStorage` 재인코딩 경로 확인(NFR-PRIV-002). 정적 필드/enum/중첩/null 처리 전 엔드포인트 불일치 0.

## 버그

| # | 심각도 | 위치 | 증상 | 계약 기준 판정 | 담당 |
|---|--------|------|------|---------------|------|
| 1 | Low | common/exception/GlobalExceptionHandler | 깨진/불완전 JSON 바디(`HttpMessageNotReadableException`) → COMMON_500(이상적 COMMON_400) | RECO 정상 흐름 밖 공통 처리. FE axios 경로에선 항상 valid JSON 전송이라 미발생. 별도 공통 태스크 권장 | (교차모듈, 미할당) |

- Low #1은 BE 보고서에 이미 명시된 알려진 사항. RECO 범위 밖이며 FE 실사용 경로에서 재현 불가하므로 모듈 통과에 영향 없음.

## 계약 보완 요청
- 없음. 계약 m3.md의 응답 예시·enum·에러코드·진행률 매핑표가 실제 구현과 문자 단위로 일치하여 판정 모호점 없었음.

## 참고
- BE Mock 단계 지연 총 ~12초(계약 "15초 내외" 부합, `AnalysisWorker.STEP_MS`).
- FAILED 경로는 Mock이 실패하지 않아(방어적 구현) 실동작 미관찰. FE FailureView + failureReason 처리 코드는 존재. 실AI 도입 시 재검증 필요.
- 검증 후 BE 종료(8080 free), 업로드 테스트 파일·H2 in-memory 데이터 정리 완료.
