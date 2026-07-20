package com.homestyler.recommendation;

import com.homestyler.common.ApiResponse;
import com.homestyler.recommendation.RecommendationDtos.AnalysisCreated;
import com.homestyler.recommendation.RecommendationDtos.AnalysisStatusView;
import com.homestyler.recommendation.RecommendationDtos.AnalyzeRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 비동기 분석 잡 API (RECO-003 진행 화면 구동). */
@RestController
@RequestMapping("/api/v1/analyses")
public class AnalysisController {

    private static final int ESTIMATED_SECONDS = 15;

    private final AnalysisJobStore store;
    private final AnalysisWorker worker;

    public AnalysisController(AnalysisJobStore store, AnalysisWorker worker) {
        this.store = store;
        this.worker = worker;
    }

    /** 분석 생성 — 검증 후 잡을 커밋하고, 커밋된 뒤 비동기 워커를 트리거해 202 즉시 반환. */
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<AnalysisCreated> create(@AuthenticationPrincipal Long userId,
                                               @RequestBody AnalyzeRequest req) {
        Long analysisId = store.create(userId, req); // 트랜잭션 커밋됨
        worker.run(analysisId);                       // 별도 스레드에서 단계 진행 시작
        return ApiResponse.ok(new AnalysisCreated(analysisId, JobStatus.QUEUED.name(), ESTIMATED_SECONDS));
    }

    /** 상태 폴링. */
    @GetMapping("/{analysisId}")
    public ApiResponse<AnalysisStatusView> status(@AuthenticationPrincipal Long userId,
                                                  @PathVariable Long analysisId) {
        return ApiResponse.ok(store.poll(analysisId, userId));
    }
}
