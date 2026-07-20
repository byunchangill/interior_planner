package com.homestyler.recommendation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 비동기 분석 워커. 전용 Executor 에서 JobStatus 를 단계별로(시간차) 진행시킨다.
 * 각 단계 전환은 AnalysisJobStore(프록시)를 통해 독립 트랜잭션으로 커밋 → 폴러에게 즉시 노출.
 * 실패 시 자동 재시도 1회, 최종 실패는 FAILED + 사유 저장(NFR-AVAIL-002).
 */
@Component
public class AnalysisWorker {

    private static final Logger log = LoggerFactory.getLogger(AnalysisWorker.class);

    // 단계별 시뮬레이션 지연(ms). 총 ~12초 — 테스트 가능하도록 짧게.
    private static final long[] STEP_MS = {2000, 2000, 2000, 2500, 2000};
    private static final JobStatus[] STEPS = {
            JobStatus.ANALYZING_STRUCTURE, JobStatus.ANALYZING_LIGHT, JobStatus.ANALYZING_FLOW,
            JobStatus.GENERATING_RECO, JobStatus.GENERATING_VISUAL
    };

    private final AnalysisJobStore store;

    public AnalysisWorker(AnalysisJobStore store) {
        this.store = store;
    }

    @Async("analysisExecutor")
    public void run(Long jobId) {
        try {
            execute(jobId);
        } catch (Exception first) {
            log.warn("분석 잡 {} 1차 실패, 재시도합니다.", jobId, first);
            try {
                execute(jobId);
            } catch (Exception second) {
                log.error("분석 잡 {} 최종 실패.", jobId, second);
                store.fail(jobId, "분석 처리 중 오류가 발생했습니다.");
            }
        }
    }

    private void execute(Long jobId) throws InterruptedException {
        for (int i = 0; i < STEPS.length; i++) {
            store.advance(jobId, STEPS[i]);
            Thread.sleep(STEP_MS[i]);
        }
        store.complete(jobId);
    }
}
