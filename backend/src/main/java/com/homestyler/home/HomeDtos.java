package com.homestyler.home;

import java.util.List;

/** M1 HOME 응답 DTO. 필드명은 계약(m1.md)을 문자 그대로 따른다. */
public final class HomeDtos {

    private HomeDtos() {
    }

    // GET /home/summary
    public record HomeSummary(String nickname,
                              List<RecentSpace> recentSpaces,
                              List<StyleHighlight> styleHighlights) {
    }

    public record RecentSpace(Long spaceId, String name, String thumbnailUrl) {
    }

    public record StyleHighlight(String styleType, String title, String thumbnailUrl) {
    }

    // GET /styles
    public record StyleList(List<StyleListItem> items) {
    }

    public record StyleListItem(String styleType, String title, String thumbnailUrl, String description) {
    }

    // GET /styles/{styleType}
    public record StyleDetail(String styleType, String title, String description,
                              List<String> keywords, List<GalleryItem> gallery) {
    }

    public record GalleryItem(String imageUrl, String caption) {
    }
}
