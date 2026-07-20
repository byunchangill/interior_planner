package com.homestyler.recommendation;

import com.homestyler.recommendation.RecommendationDtos.FitCheck;
import com.homestyler.recommendation.RecommendationDtos.FitScore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 적합도 점수(FR-RECO-015) — Mock 이 아닌 실제 산술 계산.
 * 공간 치수(widthM/depthM)와 배치 가구 치수(mm→m)로 통로 폭·벽 길이 대비를 판정한다.
 * 경계값(통로 0.6/0.4m, 벽 여유 0.2m)은 계약 규칙을 따르며 단위 테스트로 고정한다.
 */
@Component
public class FitScoreCalculator {

    // 경계값 (m)
    static final double AISLE_GOOD = 0.6;
    static final double AISLE_CHECK = 0.4;
    static final double WALL_SLACK_MIN = 0.2;

    // 판정별 배점
    private static final int GOOD_SCORE = 100;
    private static final int CHECK_SCORE = 70;
    private static final int BLOCKED_SCORE = 30;

    /** 배치 가구 1건의 치수(m). */
    public record ItemDim(String label, double widthM, double depthM) {
        static ItemDim fromMm(String label, int widthMm, int depthMm) {
            return new ItemDim(label, widthMm / 1000.0, depthMm / 1000.0);
        }
    }

    public FitScore compute(double widthM, double depthM, List<ItemDim> items) {
        List<FitCheck> checks = new ArrayList<>();
        List<String> measureBeforeBuy = new ArrayList<>();

        // 검사 1: 통로 폭 = 세로 길이 − 배치 가구 depth 합
        // 물리 치수는 cm 단위로 반올림해 비교(부동소수 경계 오차 제거 + 표시 cm 와 판정 일치).
        double sumDepth = items.stream().mapToDouble(ItemDim::depthM).sum();
        double aisle = roundCm(depthM - sumDepth);
        Verdict aisleVerdict = aisle >= AISLE_GOOD ? Verdict.GOOD
                : aisle >= AISLE_CHECK ? Verdict.CHECK
                : Verdict.BLOCKED;
        checks.add(new FitCheck("통로 폭", aisleVerdict.name(),
                aisle >= 0
                        ? "가구 배치 후 통로 " + cm(aisle) + "cm"
                        : "가구 배치 시 통로가 " + cm(-aisle) + "cm 부족"));
        if (aisleVerdict != Verdict.GOOD) {
            measureBeforeBuy.add("세로 길이(방 깊이)");
        }

        // 검사 2: 가장 넓은 가구 폭 vs 벽 길이(가로)
        ItemDim widest = items.stream().max((a, b) -> Double.compare(a.widthM(), b.widthM())).orElse(null);
        if (widest != null) {
            double slack = roundCm(widthM - widest.widthM());
            Verdict wallVerdict = slack < 0 ? Verdict.BLOCKED
                    : slack < WALL_SLACK_MIN ? Verdict.CHECK
                    : Verdict.GOOD;
            checks.add(new FitCheck(widest.label() + " 폭 vs 벽 길이", wallVerdict.name(),
                    slack >= 0
                            ? "여유 " + cm(slack) + "cm" + (wallVerdict == Verdict.CHECK ? " — 구매 전 실측 권장" : "")
                            : "가구 폭이 벽 길이를 " + cm(-slack) + "cm 초과"));
            if (wallVerdict != Verdict.GOOD) {
                measureBeforeBuy.add("가로 벽 길이");
            }
        }

        int total = checks.isEmpty() ? 100
                : (int) Math.round(checks.stream().mapToInt(c -> score(c.verdict())).average().orElse(100));

        return new FitScore(total, checks, measureBeforeBuy);
    }

    private static int score(String verdict) {
        return switch (Verdict.valueOf(verdict)) {
            case GOOD -> GOOD_SCORE;
            case CHECK -> CHECK_SCORE;
            case BLOCKED -> BLOCKED_SCORE;
        };
    }

    private static long cm(double meters) {
        return Math.round(meters * 100);
    }

    /** m 값을 cm 단위로 반올림(부동소수 경계 오차 제거). */
    private static double roundCm(double meters) {
        return Math.round(meters * 100) / 100.0;
    }
}
