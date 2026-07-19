# API 계약 작성 표준

`_workspace/contracts/{module}.md`에 작성하는 계약 문서의 표준. 계약은 BE/FE 간 유일한 합의 문서이며, QA의 판정 기준이다. 계약 없이 구현을 시작하지 않는다.

## 공통 규칙 (모든 계약에 적용, 문서에 재기술 불필요)

- Base URL: `/api/v1`
- 응답 포맷 (기능 명세서 준수):
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": { "code": "AUTH_001", "message": "사용자용 한글 메시지" } }
  ```
- 에러 코드는 `docs/functional_spec.md`의 예외 처리 표에 정의된 코드를 그대로 사용. 새 코드가 필요하면 같은 형식(`{도메인}_{3자리}`)으로 계약에 정의
- 필드명: camelCase. 날짜: ISO-8601 문자열. 금액: 원 단위 정수
- 인증 필요 엔드포인트는 `Authorization: Bearer {accessToken}`. 401 → FE가 refresh 후 1회 재시도
- 페이지네이션: `?page=0&size=20` / 응답 `data: { items: [], page, size, totalCount }`

## 엔드포인트 명세 형식

각 엔드포인트마다 다음을 기술한다:

```markdown
### POST /spaces/{spaceId}/photos

- **기능**: FR-SPACE-002 사진 등록
- **인증**: 필요
- **요청**: multipart/form-data — `file` (JPG/PNG, 최대 20MB)
- **응답 200**:
  { "success": true, "data": { "photoId": 1, "url": "/files/...", "detectedFurniture": [ { "furnitureId": 1, "type": "SOFA", "label": "3인용 소파" } ] } }
- **에러**: SPACE_002 (품질 미달 — 재촬영 안내), SPACE_003 (장수 초과)
```

**핵심**: 응답 예시는 실제 JSON으로, 모든 필드를 포함해 작성한다. "생략" 금지 — QA가 이 예시와 실제 응답을 diff하기 때문이다. null 가능 필드는 `(nullable)` 주석을 단다.

## Enum 정의

계약 문서 하단에 해당 모듈의 enum을 명시한다 (BE 엔티티와 FE 타입이 여기서 갈라지면 경계면 버그가 된다):

```markdown
## Enums
- SpaceType: LIVING_ROOM | BEDROOM | KITCHEN | STUDY | ETC
- StyleType: MODERN | MINIMAL | NATURAL | NORDIC | HOTEL | WOOD
- BudgetRange: UNDER_100 | R100_300 | R300_500 | R500_1000 | OVER_1000
- JobStatus: PENDING | ANALYZING_STRUCTURE | ANALYZING_LIGHT | ANALYZING_FLOW | GENERATING | COMPLETED | FAILED
```

## 변경 절차

1. 변경 필요를 발견한 쪽이 리더에게 변경안 제안 (SendMessage)
2. 리더가 명세서 기준으로 판단 후 계약 문서 갱신
3. 리더가 BE/FE 양측에 변경 통지 — 통지 전에 코드를 먼저 바꾸지 않는다
