package com.homestyler.home;

import java.util.List;

/**
 * 인테리어 스타일 6종 정적 카탈로그 (계약 m1.md Enums 기준).
 * DB 테이블 없이 상수로 제공. 썸네일/갤러리 경로는 서빙 URL 문자열(실제 파일 없어도 됨).
 */
public enum StyleType {

    MODERN("모던 스타일", "군더더기 없는 라인과 무채색 배색의 도시적인 분위기",
            List.of("무채색", "메탈", "심플")),
    MINIMAL("미니멀 스타일", "최소한의 소품과 여백으로 완성하는 정돈된 공간",
            List.of("여백", "화이트", "정돈")),
    NATURAL("내추럴 스타일", "식물과 천연 소재로 채운 편안하고 따뜻한 분위기",
            List.of("식물", "린넨", "따뜻함")),
    NORDIC("북유럽 스타일", "밝은 우드톤과 화이트 배색의 아늑한 감성",
            List.of("화이트", "우드", "미니멀")),
    HOTEL("호텔 스타일", "다크톤과 포인트 조명으로 완성하는 고급스러운 무드",
            List.of("다크톤", "조명", "럭셔리")),
    WOOD("우드 스타일", "짙은 원목 가구가 중심이 되는 클래식하고 묵직한 분위기",
            List.of("원목", "브라운", "클래식"));

    private final String title;
    private final String description;
    private final List<String> keywords;

    StyleType(String title, String description, List<String> keywords) {
        this.title = title;
        this.description = description;
        this.keywords = keywords;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public String thumbnailUrl() {
        return "/files/style_" + name().toLowerCase() + ".jpg";
    }

    /** 상세 화면용 갤러리 이미지 3종 (경로 문자열만). */
    public List<HomeDtos.GalleryItem> gallery() {
        String base = "/files/style_" + name().toLowerCase();
        return List.of(
                new HomeDtos.GalleryItem(base + "_1.jpg", "거실 예시"),
                new HomeDtos.GalleryItem(base + "_2.jpg", "침실 예시"),
                new HomeDtos.GalleryItem(base + "_3.jpg", "주방 예시"));
    }
}
