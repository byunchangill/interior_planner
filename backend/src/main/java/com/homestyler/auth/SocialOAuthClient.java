package com.homestyler.auth;

/** 소셜 로그인 제공자 어댑터. 인가 코드를 받아 토큰 교환 + 사용자 정보 조회까지 수행한다. */
public interface SocialOAuthClient {

    AuthProvider provider();

    /** 인가 코드 → 액세스 토큰 교환 → 사용자 정보 조회. 실패 시 ApiException(AUTH_006). */
    SocialUserInfo exchangeAndFetchUser(String code);

    /** email 은 제공자가 동의항목으로 주지 않으면 null (예: 비즈 앱 미전환 카카오). */
    record SocialUserInfo(String providerId, String email, String nickname) {
    }
}
