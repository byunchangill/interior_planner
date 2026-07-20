package com.homestyler.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * HS256 JWT 발급·검증. accessToken 1시간 / refreshToken 30일.
 * 시크릿·만료는 application.yml(jwt.*)에서 주입 — prod 전환 시 환경변수로 대체.
 */
@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTtlSeconds;
    private final long refreshTtlSeconds;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-ttl-seconds}") long accessTtlSeconds,
            @Value("${jwt.refresh-ttl-seconds}") long refreshTtlSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSeconds = accessTtlSeconds;
        this.refreshTtlSeconds = refreshTtlSeconds;
    }

    public String createAccessToken(Long userId) {
        return build(userId, "access", accessTtlSeconds);
    }

    public String createRefreshToken(Long userId) {
        return build(userId, "refresh", refreshTtlSeconds);
    }

    public Instant refreshExpiry() {
        return Instant.now().plusSeconds(refreshTtlSeconds);
    }

    private String build(Long userId, String type, long ttlSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", type)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    /** 유효한 토큰이면 userId 반환. 만료는 ExpiredJwtException, 그 외 무효는 JwtException 전파. */
    public Long parseUserId(String token) throws JwtException {
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        if (!"access".equals(claims.get("type", String.class))) {
            throw new JwtException("not an access token");
        }
        return Long.valueOf(claims.getSubject());
    }

    /** refreshToken 전용 파싱: type=refresh 여야 하며 유효/미만료여야 userId 반환. */
    public Long parseRefreshUserId(String token) throws JwtException {
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new JwtException("not a refresh token");
        }
        return Long.valueOf(claims.getSubject());
    }

    // ExpiredJwtException 은 JwtException 하위 — 호출부에서 구분 필요 시 catch 순서로 처리
    public static boolean isExpired(JwtException e) {
        return e instanceof ExpiredJwtException;
    }
}
