package com.homestyler.share;

import com.homestyler.recommendation.RecommendationDtos.Materials;

import java.time.Instant;
import java.util.List;

/** M4 요청·응답 DTO 모음. 계약 m4.md 의 필드명/구조를 문자 그대로 따른다. */
public final class ShareDtos {

    private ShareDtos() {
    }

    // ---------- 저장 ----------

    public record SaveResult(Long recommendationId, boolean saved) {
    }

    public record SelectResult(Long recommendationId, boolean selected) {
    }

    public record SavedList(List<SavedItem> items) {
    }

    public record SavedItem(
            Long recommendationId,
            Long spaceId,
            String spaceName,
            String style,
            String conceptTitle,
            String thumbnailUrl,
            long budgetTotal,
            int fitScoreTotal,
            boolean selected,
            Instant savedAt) {
    }

    // ---------- 비교 ----------

    public record CompareRequest(List<Long> recommendationIds, String compareKey) {
    }

    public record CompareResult(boolean sameSpace, List<CompareColumn> columns) {
    }

    public record CompareColumn(
            Long recommendationId,
            String style,
            String conceptTitle,
            String thumbnailUrl,
            long budgetTotal,
            int fitScoreTotal,
            MaterialSummary materialSummary,
            List<String> keywords) {
    }

    public record MaterialSummary(String wallpaper, String flooring) {
    }

    // ---------- 공유 링크 ----------

    public record CreateShareLinkRequest(String expiresIn, Boolean includeOriginalPhotos) {
    }

    public record ShareLinkResult(
            Long linkId,
            String token,
            String shareUrl,
            Instant expiresAt,
            boolean includeOriginalPhotos) {
    }

    public record ShareLinkList(List<ShareLinkItem> items) {
    }

    public record ShareLinkItem(
            Long linkId,
            String shareUrl,
            Instant expiresAt,
            boolean revoked,
            Instant createdAt) {
    }

    public record RevokeResult(Long linkId, boolean revoked) {
    }

    // ---------- 공개 웹뷰 (비인증, 보기 전용) ----------

    public record PublicShareView(
            String style,
            String conceptTitle,
            String conceptDescription,
            List<String> keywords,
            long budgetTotal,
            int fitScoreTotal,
            Materials materials,
            List<PublicItem> items,
            String afterImageUrl,
            List<String> originalPhotos,
            List<String> disclaimers) {
    }

    /** 공개 뷰 아이템 — 구매링크 등 민감정보 제외(보기 전용). */
    public record PublicItem(
            String brand,
            String name,
            int widthMm,
            int depthMm,
            int heightMm,
            long price,
            String position) {
    }

    // ---------- 구매목록 ----------

    public record ShoppingList(
            SpaceSummary spaceSummary,
            List<String> measureBeforeBuy,
            List<ShoppingItem> items,
            long totalPrice) {
    }

    public record SpaceSummary(double widthM, double depthM, double heightM) {
    }

    public record ShoppingItem(
            String brand,
            String name,
            int widthMm,
            int depthMm,
            int heightMm,
            long price,
            String purchaseUrl) {
    }
}
