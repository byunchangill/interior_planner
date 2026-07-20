package com.homestyler.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 계정 연동 — 사용자 1명이 LOCAL(비밀번호) + KAKAO + GOOGLE 을 동시에 가질 수 있다.
 * 소셜 로그인 시 이메일이 기존 유저와 일치하면 새 행만 추가되어 연동된다 (AuthService.linkOrCreateUser).
 */
@Entity
@Table(name = "social_accounts", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "providerId"}))
@EntityListeners(AuditingEntityListener.class)
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    @Column(nullable = false)
    private String providerId;

    @CreatedDate
    @Column(updatable = false)
    private Instant linkedAt;

    protected SocialAccount() {
    }

    public SocialAccount(Long userId, AuthProvider provider, String providerId) {
        this.userId = userId;
        this.provider = provider;
        this.providerId = providerId;
    }

    public Long getUserId() {
        return userId;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }
}
