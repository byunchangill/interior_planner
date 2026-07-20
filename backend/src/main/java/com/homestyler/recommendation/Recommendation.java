package com.homestyler.recommendation;

import com.homestyler.home.StyleType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 추천안. 잡당 선택 스타일 수만큼 생성된다.
 * 상세 콘텐츠(8섹션·items·fitScore)는 저장하지 않고, 조회 시 잡 조건 + 공간 데이터로
 * 결정적으로 재생성한다(styleIndex 로 itemId 등을 안정적으로 파생). 저장은 식별·소유 정보만.
 */
@Entity
@Table(name = "recommendations")
@EntityListeners(AuditingEntityListener.class)
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long spaceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StyleType style;

    @Column(nullable = false)
    private int styleIndex;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    protected Recommendation() {
    }

    public Recommendation(Long jobId, Long userId, Long spaceId, StyleType style, int styleIndex) {
        this.jobId = jobId;
        this.userId = userId;
        this.spaceId = spaceId;
        this.style = style;
        this.styleIndex = styleIndex;
    }

    public Long getId() {
        return id;
    }

    public Long getJobId() {
        return jobId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getSpaceId() {
        return spaceId;
    }

    public StyleType getStyle() {
        return style;
    }

    public int getStyleIndex() {
        return styleIndex;
    }
}
