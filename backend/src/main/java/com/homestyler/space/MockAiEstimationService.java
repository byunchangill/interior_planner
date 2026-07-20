package com.homestyler.space;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Mock AI. 공간 유형별로 그럴듯한 치수(confidence 포함)와 대표 가구 1~2종을 반환한다.
 * 실제 이미지 분석은 M3 에서 도입.
 */
@Service
public class MockAiEstimationService implements AiEstimationService {

    private static final Map<SpaceType, Estimation> PRESETS = Map.of(
            SpaceType.LIVING_ROOM, new Estimation(
                    new EstimatedDimension(4.2, 3.5, 2.3, Confidence.MEDIUM),
                    List.of(new EstimatedFurniture(FurnitureType.SOFA, "3인용 소파"),
                            new EstimatedFurniture(FurnitureType.TV_STAND, "TV 거실장"))),
            SpaceType.BEDROOM, new Estimation(
                    new EstimatedDimension(3.6, 3.0, 2.3, Confidence.MEDIUM),
                    List.of(new EstimatedFurniture(FurnitureType.BED, "퀸 침대"),
                            new EstimatedFurniture(FurnitureType.WARDROBE, "3문 옷장"))),
            SpaceType.KITCHEN, new Estimation(
                    new EstimatedDimension(3.0, 2.4, 2.3, Confidence.LOW),
                    List.of(new EstimatedFurniture(FurnitureType.TABLE, "4인 식탁"))),
            SpaceType.STUDY, new Estimation(
                    new EstimatedDimension(2.7, 2.4, 2.3, Confidence.MEDIUM),
                    List.of(new EstimatedFurniture(FurnitureType.TABLE, "책상"),
                            new EstimatedFurniture(FurnitureType.BOOKSHELF, "책장"))),
            SpaceType.ETC, new Estimation(
                    new EstimatedDimension(3.0, 3.0, 2.3, Confidence.LOW),
                    List.of())
    );

    @Override
    public Estimation estimate(SpaceType spaceType) {
        return PRESETS.getOrDefault(spaceType, PRESETS.get(SpaceType.ETC));
    }
}
