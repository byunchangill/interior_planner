package com.homestyler.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * M1 AUTH 요청/응답 DTO. 필드명은 계약(m1.md)을 문자 그대로 따른다.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignupRequest(
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            @NotBlank(message = "이메일은 필수입니다.")
            String email,

            // 8~20자, 영문+숫자 포함
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,20}$",
                    message = "비밀번호는 영문과 숫자를 포함한 8~20자여야 합니다.")
            String password,

            @NotBlank(message = "닉네임은 필수입니다.")
            String nickname,

            @NotNull(message = "동의 항목은 필수입니다.")
            @Valid
            Consents consents
    ) {
    }

    // 필수: termsOfService·privacyPolicy·imageProcessing / 선택: aiTraining·marketing
    public record Consents(
            boolean termsOfService,
            boolean privacyPolicy,
            boolean imageProcessing,
            boolean aiTraining,
            boolean marketing
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일은 필수입니다.") String email,
            @NotBlank(message = "비밀번호는 필수입니다.") String password
    ) {
    }

    public record ConsentUpdateRequest(boolean marketing) {
    }

    public record SocialLoginRequest(
            @NotBlank(message = "code는 필수입니다.") String code
    ) {
    }

    // --- 응답 ---

    public record UserInfo(Long userId, String email, String nickname) {
        public static UserInfo of(User u) {
            return new UserInfo(u.getId(), u.getEmail(), u.getNickname());
        }
    }

    /** signup / login 응답 본문: accessToken + user. refreshToken 은 httpOnly 쿠키로만 내려간다. */
    public record AuthResponse(String accessToken, UserInfo user) {
    }

    /** refresh 응답 본문: accessToken. refreshToken 은 httpOnly 쿠키로 회전된다. */
    public record TokenResponse(String accessToken) {
    }

    /** 서비스 내부 발급 결과 — refreshToken 은 컨트롤러가 쿠키로만 내보내고 본문에서 제외한다. */
    public record IssuedTokens(String accessToken, String refreshToken, UserInfo user) {
    }

    public record ConsentResponse(boolean marketing) {
    }
}
