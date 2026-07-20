package com.homestyler.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;

/** 분석 잡 저장소. */
public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, Long> {

    /** 동시 분석 제한(LIMIT_001): 종료되지 않은(QUEUED~GENERATING_VISUAL) 잡 존재 여부. */
    boolean existsByUserIdAndStatusNotIn(Long userId, java.util.Collection<JobStatus> terminal);

    // M5(MY/DATA)
    /** 삭제 대상 공간에 진행 중(QUEUED~GENERATING_VISUAL) 분석 존재 여부 (AI_005). */
    boolean existsBySpaceIdInAndStatusNotIn(java.util.Collection<Long> spaceIds,
                                            java.util.Collection<JobStatus> terminal);

    java.util.List<AnalysisJob> findByUserId(Long userId);
}
