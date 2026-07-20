package com.homestyler.recommendation;

import com.homestyler.home.StyleType;
import com.homestyler.recommendation.RecommendationDtos.BudgetPlan;
import com.homestyler.recommendation.RecommendationDtos.Concept;
import com.homestyler.recommendation.RecommendationDtos.KeepFurnitureLayout;
import com.homestyler.recommendation.RecommendationDtos.LayoutSection;
import com.homestyler.recommendation.RecommendationDtos.Materials;
import com.homestyler.recommendation.RecommendationDtos.ProductItem;
import com.homestyler.space.FurnitureType;
import com.homestyler.space.SpaceType;

import java.util.List;

/**
 * 추천 콘텐츠 생성 AI (M3 Mock, 실제 어댑터 교체 가능 — M2 AiEstimationService 와 동일 패턴).
 * fitScore 는 이 서비스가 아니라 FitScoreCalculator(실제 산술)가 계산한다.
 */
public interface AiAnalysisService {

    /** 스타일 1개 + 조건으로 8섹션 추천 초안을 생성한다(결정적). */
    Draft generate(StyleType style, GenerationContext ctx);

    /** 유지할 기존 가구 참조(공간에서 조회). */
    record KeepRef(Long id, String label) {
    }

    record GenerationContext(
            long recommendationId,
            SpaceType spaceType,
            BudgetRange budget,
            List<String> preferredColors,
            List<FurnitureType> requiredFurniture,
            List<KeepRef> keepFurniture,
            Lifestyle lifestyle) {
    }

    /** fitScore 를 제외한 8섹션 초안. */
    record Draft(
            Concept concept,
            LayoutSection layout,
            Materials materials,
            List<String> spaceTips,
            List<String> storage,
            KeepFurnitureLayout keepFurnitureLayout,
            List<BudgetPlan> budgetPlans,
            List<ProductItem> items,
            List<String> disclaimers) {
    }
}
