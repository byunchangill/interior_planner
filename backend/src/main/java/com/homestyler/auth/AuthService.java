package com.homestyler.auth;

import com.homestyler.auth.AuthDtos.AuthResponse;
import com.homestyler.auth.AuthDtos.ConsentResponse;
import com.homestyler.auth.AuthDtos.LoginRequest;
import com.homestyler.auth.AuthDtos.SignupRequest;
import com.homestyler.auth.AuthDtos.TokenResponse;
import com.homestyler.auth.AuthDtos.UserInfo;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import com.homestyler.common.security.JwtProvider;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtProvider jwtProvider) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    public AuthResponse signup(SignupRequest req) {
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

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_001));
        return issueAuth(user);
    }

    public TokenResponse refresh(String refreshToken) {
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
        return new TokenResponse(newAccess, newRefresh);
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

    private AuthResponse issueAuth(User user) {
        String access = jwtProvider.createAccessToken(user.getId());
        String refresh = jwtProvider.createRefreshToken(user.getId());
        refreshTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        rt -> rt.rotate(refresh, jwtProvider.refreshExpiry()),
                        () -> refreshTokenRepository.save(
                                new RefreshToken(user.getId(), refresh, jwtProvider.refreshExpiry())));
        return new AuthResponse(access, refresh, UserInfo.of(user));
    }
}
