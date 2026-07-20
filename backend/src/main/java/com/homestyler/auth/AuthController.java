package com.homestyler.auth;

import com.homestyler.auth.AuthDtos.AuthResponse;
import com.homestyler.auth.AuthDtos.ConsentResponse;
import com.homestyler.auth.AuthDtos.ConsentUpdateRequest;
import com.homestyler.auth.AuthDtos.LoginRequest;
import com.homestyler.auth.AuthDtos.RefreshRequest;
import com.homestyler.auth.AuthDtos.SignupRequest;
import com.homestyler.auth.AuthDtos.TokenResponse;
import com.homestyler.auth.AuthDtos.UserInfo;
import com.homestyler.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ApiResponse<AuthResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ApiResponse.ok(authService.signup(req));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ApiResponse.ok(authService.refresh(req.refreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<UserInfo> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(authService.me(userId));
    }

    @PostMapping("/consents")
    public ApiResponse<ConsentResponse> consents(@AuthenticationPrincipal Long userId,
                                                 @RequestBody ConsentUpdateRequest req) {
        return ApiResponse.ok(authService.updateMarketingConsent(userId, req.marketing()));
    }
}
