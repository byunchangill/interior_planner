package com.homestyler.recommendation;

/**
 * 비동기 분석 잡 상태. progress/한글 라벨은 계약 m3.md 진행률 매핑표의 유일한 정의처.
 * FAILED 의 progress 는 -1(무의미) — 폴링 응답은 잡에 저장된 마지막 progress 를 사용한다.
 */
public enum JobStatus {
    QUEUED(0, "분석 대기 중..."),
    ANALYZING_STRUCTURE(20, "구조·치수 분석 중..."),
    ANALYZING_LIGHT(40, "채광 분석 중..."),
    ANALYZING_FLOW(60, "동선 분석 중..."),
    GENERATING_RECO(80, "맞춤 추천 생성 중..."),
    GENERATING_VISUAL(90, "전후 비교 시각화 생성 중..."),
    COMPLETED(100, "완료"),
    FAILED(-1, "분석에 실패했습니다.");

    private final int progress;
    private final String label;

    JobStatus(int progress, String label) {
        this.progress = progress;
        this.label = label;
    }

    public int getProgress() {
        return progress;
    }

    public String getLabel() {
        return label;
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == FAILED;
    }
}
