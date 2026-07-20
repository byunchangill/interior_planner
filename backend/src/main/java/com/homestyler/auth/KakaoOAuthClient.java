package com.homestyler.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** 카카오 로그인 어댑터. 인가 코드 → 토큰 교환 → 사용자 정보 조회 (REST API). */
@Component
public class KakaoOAuthClient implements SocialOAuthClient {

    private final RestClient restClient = RestClient.create();
    private final String restApiKey;
    private final String clientSecret;
    private final String redirectUri;

    public KakaoOAuthClient(@Value("${oauth.kakao.rest-api-key}") String restApiKey,
                            @Value("${oauth.kakao.client-secret}") String clientSecret,
                            @Value("${oauth.kakao.redirect-uri}") String redirectUri) {
        this.restApiKey = restApiKey;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.KAKAO;
    }

    @Override
    public SocialUserInfo exchangeAndFetchUser(String code) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "authorization_code");
            form.add("client_id", restApiKey);
            form.add("client_secret", clientSecret);
            form.add("redirect_uri", redirectUri);
            form.add("code", code);

            TokenResponse token = restClient.post()
                    .uri("https://kauth.kakao.com/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);

            UserResponse user = restClient.get()
                    .uri("https://kapi.kakao.com/v2/user/me")
                    .header("Authorization", "Bearer " + token.accessToken())
                    .retrieve()
                    .body(UserResponse.class);

            // 미검증 이메일은 계정 연동(email 매칭) 근거로 쓸 수 없으므로 null 처리 — AuthService 가 더미 이메일로 대체
            // (구글 email_verified 와 동일 방어: 미검증 이메일로 타 계정 탈취 방지)
            KakaoAccount acct = user.kakaoAccount();
            String email = acct != null && Boolean.TRUE.equals(acct.emailVerified()) ? acct.email() : null;
            String nickname = acct == null || acct.profile() == null ? null : acct.profile().nickname();
            return new SocialUserInfo(String.valueOf(user.id()), email, nickname);
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AUTH_006, "카카오 로그인 처리 중 오류가 발생했습니다.");
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TokenResponse(@JsonProperty("access_token") String accessToken) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UserResponse(Long id, @JsonProperty("kakao_account") KakaoAccount kakaoAccount) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record KakaoAccount(String email,
                                @JsonProperty("is_email_verified") Boolean emailVerified,
                                Profile profile) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Profile(String nickname) {
    }
}
