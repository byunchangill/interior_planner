package com.homestyler.mypage;

import java.time.Instant;
import java.util.List;

/**
 * M5 MY/DATA 요청/응답 DTO. 필드명은 계약(m5.md)을 문자 그대로 따른다.
 */
public final class MyPageDtos {

    private MyPageDtos() {
    }

    // --- GET /me/profile ---

    public record ProfileResponse(Long userId, String email, String nickname,
                                  Consents consents, Stats stats) {
    }

    public record Consents(boolean termsOfService, boolean privacyPolicy,
                           boolean imageProcessing, boolean marketing) {
    }

    public record Stats(long spaceCount, long savedRecommendationCount, long photoCount) {
    }

    // --- PATCH /me ---

    /** 둘 다 nullable — 전달된 필드만 수정. */
    public record UpdateMeRequest(String nickname, Boolean marketing) {
    }

    public record UpdateMeResponse(Long userId, String nickname, boolean marketing) {
    }

    // --- GET /me/images ---

    public record ImagesResponse(List<ImageItem> items) {
    }

    public record ImageItem(Long photoId, Long spaceId, String spaceName, String url,
                            boolean isFloorPlan, Instant uploadedAt) {
    }

    // --- DELETE /me/images ---

    public record DeleteImagesRequest(List<Long> imageIds, boolean deleteAll,
                                      Boolean keepResults, boolean confirmShareRevoke) {
    }

    public record DeleteImagesResponse(int deletedCount, int revokedShareLinks, int deletedRecommendations) {
    }

    // --- DELETE /me (회원 탈퇴) ---

    public record DeleteMeRequest(String password) {
    }

    public record DeleteMeResponse(boolean deleted) {
    }
}
