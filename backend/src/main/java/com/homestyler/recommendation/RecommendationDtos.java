package com.homestyler.recommendation;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** M3 요청·응답 DTO 모음. 계약 m3.md 의 필드명/구조를 문자 그대로 따른다. */
public final class RecommendationDtos {

    private RecommendationDtos() {
    }

    // ---------- 요청 ----------

    public record AnalyzeRequest(
            Long spaceId,
            List<String> styles,
            String budgetRange,
            List<String> preferredColors,
            List<String> requiredFurniture,
            List<Long> keepFurnitureIds,
            LifestyleDto lifestyle) {
    }

    public record LifestyleDto(
            Integer householdSize,
            Boolean hasChildren,
            Boolean hasPets,
            Boolean worksFromHome,
            Boolean cooksOften,
            String storagePreference,
            String housingType,
            Integer residenceYears) {
    }

    // ---------- POST /analyses ----------

    public record AnalysisCreated(Long analysisId, String status, int estimatedSeconds) {
    }

    // ---------- GET /analyses/{id} ----------

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AnalysisStatusView(
            Long analysisId,
            String status,
            int progress,
            String currentStepLabel,
            List<Long> recommendationIds,
            List<String> styles,
            String failureReason) {
    }

    // ---------- GET /recommendations/{id} ----------

    public record RecommendationDetail(
            Long recommendationId,
            Long analysisId,
            Long spaceId,
            String style,
            Concept concept,
            LayoutSection layout,
            Materials materials,
            List<String> spaceTips,
            List<String> storage,
            KeepFurnitureLayout keepFurnitureLayout,
            List<BudgetPlan> budgetPlans,
            List<ProductItem> items,
            FitScore fitScore,
            List<String> disclaimers) {
    }

    public record Concept(String title, String description, List<String> keywords) {
    }

    public record LayoutSection(String imageUrl, String flowDescription, String reason) {
    }

    public record Materials(MaterialSpec wallpaper, MaterialSpec flooring, MaterialSpec lighting, MaterialSpec curtain) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record MaterialSpec(String color, String material, String reason, Boolean expertRequired) {
        public static MaterialSpec of(String color, String material, String reason) {
            return new MaterialSpec(color, material, reason, null);
        }
    }

    public record KeepFurnitureLayout(String description, List<Long> furnitureIds) {
    }

    public record BudgetPlan(String range, String title, long totalPrice, List<Long> itemIds) {
    }

    public record ProductItem(
            Long itemId,
            String brand,
            String name,
            String category,
            int widthMm,
            int depthMm,
            int heightMm,
            long price,
            String purchaseUrl,
            String position,
            String reason,
            boolean expertRequired) {
    }

    public record FitScore(int total, List<FitCheck> checks, List<String> measureBeforeBuy) {
    }

    public record FitCheck(String label, String verdict, String detail) {
    }

    // ---------- GET /recommendations/{id}/visuals ----------

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Visuals(List<VisualPair> pairs, Boolean partial) {
    }

    public record VisualPair(String beforeUrl, String afterUrl, String viewLabel) {
    }

    // ---------- POST /recommendations/{id}/visuals/regenerate ----------

    public record RegenResult(String status) {
    }
}
