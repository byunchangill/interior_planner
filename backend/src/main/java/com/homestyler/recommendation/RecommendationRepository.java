package com.homestyler.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** 추천안 저장소. */
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByJobIdOrderByStyleIndexAsc(Long jobId);

    // M4(SAVE)
    List<Recommendation> findBySavedTrueAndUserIdOrderBySavedAtDesc(Long userId);

    List<Recommendation> findBySpaceIdAndUserIdAndSelectedTrue(Long spaceId, Long userId);
}
