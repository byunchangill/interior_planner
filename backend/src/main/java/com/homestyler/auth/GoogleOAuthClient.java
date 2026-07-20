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

/** 구글 로그인 어댑터. 인가 코드 → 토큰 교환 → 사용자 정보 조회 (OAuth 2.0 / userinfo). */
@Component
public class GoogleOAuthClient implements SocialOAuthClient {

    private final RestClient restClient = RestClient.create();
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public GoogleOAuthClient(@Value("${oauth.google.client-id}") String clientId,
                             @Value("${oauth.google.client-secret}") String clientSecret,
                             @Value("${oauth.google.redirect-uri}") String redirectUri) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    @Override
    public AuthProvider provider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public SocialUserInfo exchangeAndFetchUser(String code) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "authorization_code");
            form.add("client_id", clientId);
            form.add("client_secret", clientSecret);
            form.add("redirect_uri", redirectUri);
            form.add("code", code);

            TokenResponse token = restClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);

            UserResponse user = restClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header("Authorization", "Bearer " + token.accessToken())
                    .retrieve()
                    .body(UserResponse.class);

            // 미검증 이메일은 계정 연동(email 매칭) 근거로 쓸 수 없으므로 null 처리 — AuthService 가 더미 이메일로 대체
            String email = Boolean.TRUE.equals(user.emailVerified()) ? user.email() : null;
            return new SocialUserInfo(user.sub(), email, user.name());
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AUTH_006, "구글 로그인 처리 중 오류가 발생했습니다.");
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TokenResponse(@JsonProperty("access_token") String accessToken) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record UserResponse(String sub, String email,
                                @JsonProperty("email_verified") Boolean emailVerified, String name) {
    }
}
