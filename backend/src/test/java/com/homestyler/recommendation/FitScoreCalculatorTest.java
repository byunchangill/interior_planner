package com.homestyler.recommendation;

import com.homestyler.recommendation.FitScoreCalculator.ItemDim;
import com.homestyler.recommendation.RecommendationDtos.FitCheck;
import com.homestyler.recommendation.RecommendationDtos.FitScore;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 적합도 점수 경계값 검증 (계약: 통로 0.6/0.4m, 벽 여유 0.2m).
 * 통로 폭 = depthM − Σ(가구 depth), 벽 여유 = widthM − 최대 가구 width.
 */
class FitScoreCalculatorTest {

    private final FitScoreCalculator calc = new FitScoreCalculator();

    private String aisleVerdict(double depthM, double itemDepthM) {
        // 벽 검사는 항상 GOOD 이 되도록 넉넉한 방 폭 사용
        FitScore fs = calc.compute(10.0, depthM, List.of(new ItemDim("x", 0.5, itemDepthM)));
        return fs.checks().get(0).verdict();
    }

    @Test
    void aisle_atExactly_0_6_isGood() {
        assertEquals("GOOD", aisleVerdict(2.0, 1.4));   // 통로 0.60m
    }

    @Test
    void aisle_justBelow_0_6_isCheck() {
        assertEquals("CHECK", aisleVerdict(2.0, 1.41));  // 통로 0.59m
    }

    @Test
    void aisle_atExactly_0_4_isCheck() {
        assertEquals("CHECK", aisleVerdict(2.0, 1.6));   // 통로 0.40m
    }

    @Test
    void aisle_justBelow_0_4_isBlocked() {
        assertEquals("BLOCKED", aisleVerdict(2.0, 1.61)); // 통로 0.39m
    }

    private String wallVerdict(double widthM, double itemWidthM) {
        // 통로 검사는 항상 GOOD 이 되도록 넉넉한 방 깊이 사용
        FitScore fs = calc.compute(widthM, 10.0, List.of(new ItemDim("x", itemWidthM, 0.5)));
        return fs.checks().get(1).verdict();
    }

    @Test
    void wall_slack_atExactly_0_2_isGood() {
        assertEquals("GOOD", wallVerdict(3.0, 2.8));   // 여유 0.20m
    }

    @Test
    void wall_slack_justBelow_0_2_isCheck() {
        assertEquals("CHECK", wallVerdict(3.0, 2.81)); // 여유 0.19m
    }

    @Test
    void wall_negativeSlack_isBlocked() {
        assertEquals("BLOCKED", wallVerdict(3.0, 3.01)); // 폭 초과
    }

    @Test
    void allGood_scores100_andNoMeasureBeforeBuy() {
        FitScore fs = calc.compute(4.2, 3.5, List.of(ItemDim.fromMm("소파", 2180, 920)));
        assertEquals(100, fs.total());
        assertTrue(fs.measureBeforeBuy().isEmpty());
    }

    @Test
    void nonGoodChecks_collectMeasureBeforeBuy() {
        // 통로 BLOCKED + 벽 CHECK → 두 치수 항목 모두 수집, 총점 = (30+70)/2 = 50
        FitScore fs = calc.compute(3.0, 2.0, List.of(new ItemDim("장", 2.81, 1.7)));
        assertEquals(2, fs.measureBeforeBuy().size());
        assertEquals(50, fs.total());
        for (FitCheck c : fs.checks()) {
            assertTrue(c.verdict().equals("BLOCKED") || c.verdict().equals("CHECK"));
        }
    }

    @Test
    void noItems_scores100() {
        FitScore fs = calc.compute(4.0, 3.0, List.of());
        assertEquals(100, fs.total());
    }
}
