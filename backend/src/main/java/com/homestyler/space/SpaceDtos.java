package com.homestyler.space;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * M2 SPACE 요청·응답 DTO. 필드명·구조는 계약(_workspace/contracts/m2.md) 을 그대로 따른다.
 * enum 은 문자열로 받아 서비스에서 파싱(미정의 값 → VALID_003).
 */
public final class SpaceDtos {

    private SpaceDtos() {
    }

    // ---------- 요청 ----------

    public record CreateSpaceRequest(String spaceType, String name) {
    }

    public record OpeningRequest(String type, String wall, Double widthM) {
    }

    public record DimensionUpdateRequest(Double widthM, Double depthM, Double heightM,
                                         Boolean isUserVerified, List<OpeningRequest> openings) {
    }

    public record FurnitureItemRequest(Long furnitureId, String type, String label, Boolean keep) {
    }

    public record FurniturePutRequest(List<FurnitureItemRequest> furniture) {
    }

    // ---------- 응답 ----------

    public record SpaceCreated(Long spaceId, SpaceType spaceType, String name,
                               int photoCount, Instant createdAt) {
    }

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record SpaceListItem(Long spaceId, SpaceType spaceType, String name,
                                int photoCount, String thumbnailUrl, Instant createdAt) {
    }

    public record SpaceList(List<SpaceListItem> items) {
    }

    public record PhotoDto(Long photoId, String url, boolean isFloorPlan) {
    }

    public record OpeningDto(Long openingId, OpeningType type, Wall wall, double widthM) {
    }

    public record DimensionDto(double widthM, double depthM, double heightM, double areaPyeong,
                               Confidence confidence, boolean isUserVerified, List<OpeningDto> openings) {
    }

    public record FurnitureDto(Long furnitureId, FurnitureType type, String label,
                               boolean keep, FurnitureSource source) {
    }

    public record SpaceDetail(Long spaceId, SpaceType spaceType, String name,
                              List<PhotoDto> photos, DimensionDto dimensions, List<FurnitureDto> furniture) {
    }

    public record DetectedFurnitureDto(Long furnitureId, FurnitureType type, String label) {
    }

    public record PhotoUploadResult(Long photoId, String url, boolean isFloorPlan,
                                    QualityCheck qualityCheck, List<DetectedFurnitureDto> detectedFurniture) {
    }

    public record DimensionResult(Long spaceId, double widthM, double depthM, double heightM,
                                  double areaPyeong, boolean isUserVerified, List<OpeningDto> openings) {
    }

    public record FurnitureListResult(List<FurnitureDto> furniture) {
    }

    public record SpaceIdResult(Long spaceId) {
    }

    public record PhotoIdResult(Long photoId) {
    }
}
