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

    public record Consents(
            boolean termsOfService,
            boolean privacyPolicy,
            boolean imageProcessing,
            boolean marketing
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일은 필수입니다.") String email,
            @NotBlank(message = "비밀번호는 필수입니다.") String password
    ) {
    }

    public record RefreshRequest(
            @NotBlank(message = "refreshToken은 필수입니다.") String refreshToken
    ) {
    }

    public record ConsentUpdateRequest(boolean marketing) {
    }

    // --- 응답 ---

    public record UserInfo(Long userId, String email, String nickname) {
        public static UserInfo of(User u) {
            return new UserInfo(u.getId(), u.getEmail(), u.getNickname());
        }
    }

    /** signup / login 응답: accessToken + refreshToken + user */
    public record AuthResponse(String accessToken, String refreshToken, UserInfo user) {
    }

    /** refresh 응답: accessToken + refreshToken */
    public record TokenResponse(String accessToken, String refreshToken) {
    }

    public record ConsentResponse(boolean marketing) {
    }
}
