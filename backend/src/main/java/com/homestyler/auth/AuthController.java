package com.homestyler.auth;

import com.homestyler.auth.AuthDtos.AuthResponse;
import com.homestyler.auth.AuthDtos.ConsentResponse;
import com.homestyler.auth.AuthDtos.ConsentUpdateRequest;
import com.homestyler.auth.AuthDtos.IssuedTokens;
import com.homestyler.auth.AuthDtos.LoginRequest;
import com.homestyler.auth.AuthDtos.SignupRequest;
import com.homestyler.auth.AuthDtos.SocialLoginRequest;
import com.homestyler.auth.AuthDtos.TokenResponse;
import com.homestyler.auth.AuthDtos.UserInfo;
import com.homestyler.common.ApiResponse;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * refreshToken 은 응답 본문이 아닌 httpOnly 쿠키(SameSite=Strict, Path=/api/v1/auth)로만
 * 오간다 — XSS 로 JS 가 탈취할 수 없다. accessToken(1시간)만 본문으로 반환한다.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "refreshToken";

    private final AuthService authService;
    private final long refreshTtlSeconds;
    private final boolean cookieSecure;

    public AuthController(AuthService authService,
                          @Value("${jwt.refresh-ttl-seconds}") long refreshTtlSeconds,
                          @Value("${jwt.cookie-secure}") boolean cookieSecure) {
        this.authService = authService;
        this.refreshTtlSeconds = refreshTtlSeconds;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/signup")
    public ApiResponse<AuthResponse> signup(@Valid @RequestBody SignupRequest req,
                                            HttpServletResponse res) {
        IssuedTokens t = authService.signup(req);
        setRefreshCookie(res, t.refreshToken(), refreshTtlSeconds);
        return ApiResponse.ok(new AuthResponse(t.accessToken(), t.user()));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req,
                                           HttpServletResponse res) {
        IssuedTokens t = authService.login(req);
        setRefreshCookie(res, t.refreshToken(), refreshTtlSeconds);
        return ApiResponse.ok(new AuthResponse(t.accessToken(), t.user()));
    }

    @PostMapping("/kakao")
    public ApiResponse<AuthResponse> kakaoLogin(@Valid @RequestBody SocialLoginRequest req,
                                                HttpServletResponse res) {
        IssuedTokens t = authService.socialLogin(AuthProvider.KAKAO, req.code());
        setRefreshCookie(res, t.refreshToken(), refreshTtlSeconds);
        return ApiResponse.ok(new AuthResponse(t.accessToken(), t.user()));
    }

    @PostMapping("/google")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody SocialLoginRequest req,
                                                 HttpServletResponse res) {
        IssuedTokens t = authService.socialLogin(AuthProvider.GOOGLE, req.code());
        setRefreshCookie(res, t.refreshToken(), refreshTtlSeconds);
        return ApiResponse.ok(new AuthResponse(t.accessToken(), t.user()));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse res) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_002);
        }
        IssuedTokens t = authService.refresh(refreshToken);
        setRefreshCookie(res, t.refreshToken(), refreshTtlSeconds);
        return ApiResponse.ok(new TokenResponse(t.accessToken()));
    }

    /** 서버 refreshToken 폐기 + 쿠키 삭제. */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Long userId, HttpServletResponse res) {
        authService.logout(userId);
        setRefreshCookie(res, "", 0);
        return ApiResponse.ok(null);
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

    private void setRefreshCookie(HttpServletResponse res, String token, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/v1/auth") // refresh·logout 요청에만 실려간다
                .maxAge(maxAgeSeconds)
                .build();
        res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
