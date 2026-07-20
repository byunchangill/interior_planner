package com.homestyler.share;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 공유 링크 (M4 결정 3). 공개 웹뷰(/share/{token})의 진입점.
 * token 은 추측 불가한 128bit 난수(URL-safe). 만료(expiresAt 지남) 또는 revoked 면 공개 뷰에서 SHARE_001(410).
 */
@Entity
@Table(name = "share_links")
@EntityListeners(AuditingEntityListener.class)
public class ShareLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Long recommendationId;

    /** null 이면 무기한(expiresIn=NONE). */
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean includeOriginalPhotos;

    @Column(nullable = false)
    private boolean revoked;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    protected ShareLink() {
    }

    public ShareLink(String token, Long recommendationId, Instant expiresAt, boolean includeOriginalPhotos) {
        this.token = token;
        this.recommendationId = recommendationId;
        this.expiresAt = expiresAt;
        this.includeOriginalPhotos = includeOriginalPhotos;
    }

    /** 만료되었거나 회수되어 공개 뷰에서 열 수 없는 상태. */
    public boolean isInactive() {
        return revoked || (expiresAt != null && expiresAt.isBefore(Instant.now()));
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public Long getRecommendationId() {
        return recommendationId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isIncludeOriginalPhotos() {
        return includeOriginalPhotos;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void revoke() {
        this.revoked = true;
    }
}
