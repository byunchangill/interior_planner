package com.homestyler.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;

/** 분석 잡 저장소. */
public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, Long> {

    /** 동시 분석 제한(LIMIT_001): 종료되지 않은(QUEUED~GENERATING_VISUAL) 잡 존재 여부. */
    boolean existsByUserIdAndStatusNotIn(Long userId, java.util.Collection<JobStatus> terminal);
}
