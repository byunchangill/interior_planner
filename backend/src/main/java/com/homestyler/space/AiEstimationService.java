package com.homestyler.space;

import java.util.List;

/**
 * 사진 기반 치수·가구 추정. M2 는 Mock 구현, M3 에서 실제 AI 어댑터로 교체한다.
 */
public interface AiEstimationService {

    /** 공간 유형에 맞는 그럴듯한 치수·가구 추정을 생성한다. */
    Estimation estimate(SpaceType spaceType);

    record EstimatedDimension(double widthM, double depthM, double heightM, Confidence confidence) {
    }

    record EstimatedFurniture(FurnitureType type, String label) {
    }

    record Estimation(EstimatedDimension dimension, List<EstimatedFurniture> furniture) {
    }
}
