package com.homestyler.recommendation;

import com.homestyler.common.ApiResponse;
import com.homestyler.recommendation.RecommendationDtos.RecommendationDetail;
import com.homestyler.recommendation.RecommendationDtos.RegenResult;
import com.homestyler.recommendation.RecommendationDtos.Visuals;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 추천 상세·전후 비교 API (RECO-004/005/006/007). */
@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    @GetMapping("/{recommendationId}")
    public ApiResponse<RecommendationDetail> detail(@AuthenticationPrincipal Long userId,
                                                    @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.detail(recommendationId, userId));
    }

    @GetMapping("/{recommendationId}/visuals")
    public ApiResponse<Visuals> visuals(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.visuals(recommendationId, userId));
    }

    @PostMapping("/{recommendationId}/visuals/regenerate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiResponse<RegenResult> regenerate(@AuthenticationPrincipal Long userId,
                                               @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.regenerate(recommendationId, userId));
    }
}
