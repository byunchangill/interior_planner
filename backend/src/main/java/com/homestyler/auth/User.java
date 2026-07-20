package com.homestyler.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // BCrypt 해시

    @Column(nullable = false)
    private String nickname;

    // 동의 항목 (FR-AUTH-003)
    private boolean termsOfService;
    private boolean privacyPolicy;
    private boolean imageProcessing;
    private boolean marketing;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    protected User() {
    }

    public User(String email, String password, String nickname,
                boolean termsOfService, boolean privacyPolicy,
                boolean imageProcessing, boolean marketing) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.termsOfService = termsOfService;
        this.privacyPolicy = privacyPolicy;
        this.imageProcessing = imageProcessing;
        this.marketing = marketing;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public boolean isTermsOfService() {
        return termsOfService;
    }

    public boolean isPrivacyPolicy() {
        return privacyPolicy;
    }

    public boolean isImageProcessing() {
        return imageProcessing;
    }

    public boolean isMarketing() {
        return marketing;
    }

    public void setMarketing(boolean marketing) {
        this.marketing = marketing;
    }
}
