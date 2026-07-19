# Ralph Loop 실행 명령 (보관용)

HomeStyler 자율 완주 루프를 (재)시작할 때 아래 명령을 그대로 사용한다. 중단은 `/cancel-ralph`.

```
/ralph-loop "CLAUDE.md의 하네스 규칙과 homestyler-dev 스킬(루프 모드)을 따라 HomeStyler를 개발하라. _workspace/progress.md에서 첫 번째 미완료(TODO/IN_PROGRESS) 모듈을 골라 이번 이터레이션에서는 그 모듈 하나만 완성하라(계약→BE∥FE 팀 구현→QA High 버그 0). 완료 시 progress.md 갱신 + git commit + 팀 정리(TeamDelete) 후 종료하라. 같은 모듈이 2회 연속 이터레이션에서 실패하면 BLOCKED(사유)로 표시하고 다음 모듈로 진행하라. 모든 모듈이 DONE 또는 BLOCKED이면 _workspace/final_report.md를 작성한 뒤 <promise>HOMESTYLER_P1_COMPLETE</promise>를 출력하라." --completion-promise "HOMESTYLER_P1_COMPLETE" --max-iterations 30
```

- `--max-iterations 30` 근거: 6개 모듈 × 평균 3~5 이터레이션 + 안전 마진
- promise는 "모든 모듈 DONE/BLOCKED"가 실제로 참일 때만 출력할 것 (거짓 promise로 루프 탈출 금지)
- 루프 도중 상태 확인: `_workspace/progress.md`의 이터레이션 로그
