package com.homestyler.share;

import com.homestyler.common.ApiResponse;
import com.homestyler.share.ShareDtos.PublicShareView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공개 공유 웹뷰 (비인증). SecurityConfig 에서 /api/v1/share/** permitAll.
 * 만료·회수된 링크는 SHARE_001(HTTP 410).
 */
@RestController
@RequestMapping("/api/v1/share")
public class PublicShareController {

    private final ShareService service;

    public PublicShareController(ShareService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    public ApiResponse<PublicShareView> view(@PathVariable String token) {
        return ApiResponse.ok(service.publicView(token));
    }
}
