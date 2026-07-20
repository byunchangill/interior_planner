package com.homestyler.mypage;

import com.homestyler.common.ApiResponse;
import com.homestyler.mypage.MyPageDtos.DeleteImagesRequest;
import com.homestyler.mypage.MyPageDtos.DeleteImagesResponse;
import com.homestyler.mypage.MyPageDtos.DeleteMeRequest;
import com.homestyler.mypage.MyPageDtos.DeleteMeResponse;
import com.homestyler.mypage.MyPageDtos.ImagesResponse;
import com.homestyler.mypage.MyPageDtos.ProfileResponse;
import com.homestyler.mypage.MyPageDtos.UpdateMeRequest;
import com.homestyler.mypage.MyPageDtos.UpdateMeResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * M5 MY/DATA — 마이페이지·데이터 관리·회원 탈퇴 (계약 m5.md).
 * 모든 엔드포인트 인증 필요, 본인 데이터만 다룬다.
 */
@RestController
@RequestMapping("/api/v1/me")
public class MyPageController {

    private final MyPageService myPageService;

    public MyPageController(MyPageService myPageService) {
        this.myPageService = myPageService;
    }

    @GetMapping("/profile")
    public ApiResponse<ProfileResponse> profile(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(myPageService.profile(userId));
    }

    @PatchMapping
    public ApiResponse<UpdateMeResponse> updateMe(@AuthenticationPrincipal Long userId,
                                                  @RequestBody UpdateMeRequest req) {
        return ApiResponse.ok(myPageService.updateMe(userId, req));
    }

    @GetMapping("/images")
    public ApiResponse<ImagesResponse> images(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(myPageService.images(userId));
    }

    @DeleteMapping("/images")
    public ApiResponse<DeleteImagesResponse> deleteImages(@AuthenticationPrincipal Long userId,
                                                          @RequestBody DeleteImagesRequest req) {
        return ApiResponse.ok(myPageService.deleteImages(userId, req));
    }

    @DeleteMapping
    public ApiResponse<DeleteMeResponse> deleteAccount(@AuthenticationPrincipal Long userId,
                                                       @RequestBody DeleteMeRequest req) {
        return ApiResponse.ok(myPageService.deleteAccount(userId, req));
    }
}
