package com.homestyler.auth;

import com.homestyler.auth.AuthDtos.ConsentResponse;
import com.homestyler.auth.AuthDtos.IssuedTokens;
import com.homestyler.auth.AuthDtos.LoginRequest;
import com.homestyler.auth.AuthDtos.SignupRequest;
import com.homestyler.auth.AuthDtos.UserInfo;
import com.homestyler.auth.SocialOAuthClient.SocialUserInfo;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.common.security.JwtProvider;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final LoginAttemptLimiter loginAttemptLimiter;
    private final Map<AuthProvider, SocialOAuthClient> socialClients;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtProvider jwtProvider,
                       LoginAttemptLimiter loginAttemptLimiter,
                       List<SocialOAuthClient> socialClients) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.loginAttemptLimiter = loginAttemptLimiter;
        this.socialClients = new EnumMap<>(AuthProvider.class);
        socialClients.forEach(c -> this.socialClients.put(c.provider(), c));
    }

    public IssuedTokens signup(SignupRequest req) {
        var c = req.consents();
        // 필수 동의만 검증(약관·개인정보·공간사진처리). AI학습·마케팅은 선택이라 강제하지 않는다.
        if (!c.termsOfService() || !c.privacyPolicy() || !c.imageProcessing()) {
            throw new ApiException(ErrorCode.AUTH_004);
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(ErrorCode.VALID_001, "이미 사용 중인 이메일입니다.");
        }
        User user = userRepository.save(new User(
                req.email(),
                passwordEncoder.encode(req.password()),
                req.nickname(),
                c.termsOfService(), c.privacyPolicy(), c.imageProcessing(), c.aiTraining(), c.marketing()));
        return issueAuth(user);
    }

    public IssuedTokens login(LoginRequest req) {
        loginAttemptLimiter.check(req.email()); // 15분 창 5회 실패 시 AUTH_005
        User user = userRepository.findByEmail(req.email())
                .filter(u -> u.getPassword() != null) // 소셜 전용 계정(비밀번호 없음)은 이메일 로그인 대상 아님
                .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
                .orElseThrow(() -> {
                    loginAttemptLimiter.onFailure(req.email());
                    return new ApiException(ErrorCode.AUTH_001);
                });
        loginAttemptLimiter.onSuccess(req.email());
        return issueAuth(user);
    }

    /** 카카오/구글 인가 코드 → 사용자 조회/자동가입 → JWT 발급. */
    public IssuedTokens socialLogin(AuthProvider provider, String code) {
        SocialOAuthClient client = socialClients.get(provider);
        if (client == null) {
            throw new ApiException(ErrorCode.AUTH_006, "지원하지 않는 로그인 방식입니다.");
        }
        SocialUserInfo info = client.exchangeAndFetchUser(code);

        User user = userRepository.findByProviderAndProviderId(provider, info.providerId())
                .orElseGet(() -> createSocialUser(provider, info));
        return issueAuth(user);
    }

    private User createSocialUser(AuthProvider provider, SocialUserInfo info) {
        // 이메일이 없는 제공자(예: 카카오 비즈 앱 미전환)는 내부용 더미 이메일을 발급한다.
        String email = info.email() != null ? info.email()
                : provider.name().toLowerCase() + "_" + info.providerId() + "@social.homestyler.local";
        if (userRepository.existsByEmail(email)) {
            // 다른 방식(로컬 또는 타 제공자)으로 이미 가입된 이메일 — v1엔 계정 연동 기능이 없어 충돌로 처리
            throw new ApiException(ErrorCode.VALID_001, "이미 다른 방식으로 가입된 이메일입니다.");
        }
        String nickname = info.nickname() != null ? info.nickname() : provider.name() + " 사용자";
        return userRepository.save(new User(email, nickname, provider, info.providerId()));
    }

    public IssuedTokens refresh(String refreshToken) {
        Long userId;
        try {
            userId = jwtProvider.parseRefreshUserId(refreshToken);
        } catch (JwtException e) {
            throw new ApiException(ErrorCode.AUTH_002);
        }
        RefreshToken stored = refreshTokenRepository.findByUserId(userId)
                .filter(rt -> rt.getToken().equals(refreshToken))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_002));

        String newAccess = jwtProvider.createAccessToken(userId);
        String newRefresh = jwtProvider.createRefreshToken(userId);
        stored.rotate(newRefresh, jwtProvider.refreshExpiry());
        return new IssuedTokens(newAccess, newRefresh, null);
    }

    /** 서버 측 refreshToken 폐기 — 이후 해당 세션의 refresh 는 AUTH_002 로 실패한다. */
    public void logout(Long userId) {
        refreshTokenRepository.findByUserId(userId).ifPresent(refreshTokenRepository::delete);
    }

    @Transactional(readOnly = true)
    public UserInfo me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_001));
        return UserInfo.of(user);
    }

    public ConsentResponse updateMarketingConsent(Long userId, boolean marketing) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_001));
        user.setMarketing(marketing);
        return new ConsentResponse(marketing);
    }

    private IssuedTokens issueAuth(User user) {
        String access = jwtProvider.createAccessToken(user.getId());
        String refresh = jwtProvider.createRefreshToken(user.getId());
        refreshTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        rt -> rt.rotate(refresh, jwtProvider.refreshExpiry()),
                        () -> refreshTokenRepository.save(
                                new RefreshToken(user.getId(), refresh, jwtProvider.refreshExpiry())));
        return new IssuedTokens(access, refresh, UserInfo.of(user));
    }
}
