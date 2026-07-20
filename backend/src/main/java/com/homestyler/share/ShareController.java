package com.homestyler.share;

import com.homestyler.common.ApiResponse;
import com.homestyler.share.ShareDtos.CompareRequest;
import com.homestyler.share.ShareDtos.CompareResult;
import com.homestyler.share.ShareDtos.CreateShareLinkRequest;
import com.homestyler.share.ShareDtos.RevokeResult;
import com.homestyler.share.ShareDtos.SaveResult;
import com.homestyler.share.ShareDtos.SavedList;
import com.homestyler.share.ShareDtos.SelectResult;
import com.homestyler.share.ShareDtos.ShareLinkList;
import com.homestyler.share.ShareDtos.ShareLinkResult;
import com.homestyler.share.ShareDtos.ShoppingList;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** M4(SAVE) 인증 API — 저장·비교·공유 링크 관리·구매목록. 공개 웹뷰는 PublicShareController. */
@RestController
@RequestMapping("/api/v1")
public class ShareController {

    private final ShareService service;

    public ShareController(ShareService service) {
        this.service = service;
    }

    // ---------- 저장 ----------

    @PostMapping("/recommendations/{recommendationId}/save")
    public ApiResponse<SaveResult> save(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.save(userId, recommendationId, true));
    }

    @DeleteMapping("/recommendations/{recommendationId}/save")
    public ApiResponse<SaveResult> unsave(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.save(userId, recommendationId, false));
    }

    @GetMapping("/saved")
    public ApiResponse<SavedList> saved(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(service.savedList(userId));
    }

    @PutMapping("/recommendations/{recommendationId}/select")
    public ApiResponse<SelectResult> select(@AuthenticationPrincipal Long userId,
                                            @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.select(userId, recommendationId));
    }

    // ---------- 비교 ----------

    @PostMapping("/recommendations/compare")
    public ApiResponse<CompareResult> compare(@AuthenticationPrincipal Long userId,
                                              @RequestBody CompareRequest req) {
        return ApiResponse.ok(service.compare(userId, req));
    }

    // ---------- 공유 링크 ----------

    @PostMapping("/recommendations/{recommendationId}/share-links")
    public ApiResponse<ShareLinkResult> createShareLink(@AuthenticationPrincipal Long userId,
                                                        @PathVariable Long recommendationId,
                                                        @RequestBody(required = false) CreateShareLinkRequest req) {
        return ApiResponse.ok(service.createShareLink(userId, recommendationId, req));
    }

    @GetMapping("/recommendations/{recommendationId}/share-links")
    public ApiResponse<ShareLinkList> listShareLinks(@AuthenticationPrincipal Long userId,
                                                     @PathVariable Long recommendationId) {
        return ApiResponse.ok(service.listShareLinks(userId, recommendationId));
    }

    @DeleteMapping("/share-links/{linkId}")
    public ApiResponse<RevokeResult> revokeShareLink(@AuthenticationPrincipal Long userId,
                                                     @PathVariable Long linkId) {
        return ApiResponse.ok(service.revokeShareLink(userId, linkId));
    }

    // ---------- 구매목록 ----------

    @GetMapping("/recommendations/{recommendationId}/shopping-list")
    public ApiResponse<ShoppingList> shoppingList(@AuthenticationPrincipal Long userId,
                                                  @PathVariable Long recommendationId,
                                                  @RequestParam(required = false) String budgetPlanRange) {
        return ApiResponse.ok(service.shoppingList(userId, recommendationId, budgetPlanRange));
    }
}
