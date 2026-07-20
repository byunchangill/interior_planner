package com.homestyler.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** 공유 링크 저장소. */
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    List<ShareLink> findByRecommendationIdOrderByIdAsc(Long recommendationId);

    long countByRecommendationId(Long recommendationId);

    Optional<ShareLink> findByToken(String token);
}
