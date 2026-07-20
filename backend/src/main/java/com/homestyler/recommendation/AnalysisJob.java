package com.homestyler.recommendation;

import com.homestyler.home.StyleType;
import com.homestyler.space.FurnitureType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 비동기 분석 잡. 요청 조건(스타일·예산·생활방식 등)을 그대로 보존하여
 * 추천 상세를 요청 시점에 결정적으로(deterministic) 재생성할 수 있게 한다.
 * 상태/진행률은 @Async 워커가 단계별로 갱신하고 GET 폴링으로 노출한다.
 */
@Entity
@Table(name = "analysis_jobs")
@EntityListeners(AuditingEntityListener.class)
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long spaceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Column(nullable = false)
    private int progress;

    private String failureReason;

    @ElementCollection
    @CollectionTable(name = "analysis_job_styles", joinColumns = @JoinColumn(name = "job_id"))
    @Enumerated(EnumType.STRING)
    @OrderColumn(name = "style_order")
    @Column(name = "style")
    private List<StyleType> styles = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetRange budgetRange;

    @ElementCollection
    @CollectionTable(name = "analysis_job_colors", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "color")
    private List<String> preferredColors = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "analysis_job_required_furniture", joinColumns = @JoinColumn(name = "job_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "furniture_type")
    private List<FurnitureType> requiredFurniture = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "analysis_job_keep_furniture", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "furniture_id")
    private List<Long> keepFurnitureIds = new ArrayList<>();

    @Embedded
    private Lifestyle lifestyle;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    protected AnalysisJob() {
    }

    public AnalysisJob(Long userId, Long spaceId, List<StyleType> styles, BudgetRange budgetRange,
                       List<String> preferredColors, List<FurnitureType> requiredFurniture,
                       List<Long> keepFurnitureIds, Lifestyle lifestyle) {
        this.userId = userId;
        this.spaceId = spaceId;
        this.status = JobStatus.QUEUED;
        this.progress = JobStatus.QUEUED.getProgress();
        this.styles = styles;
        this.budgetRange = budgetRange;
        this.preferredColors = preferredColors == null ? new ArrayList<>() : preferredColors;
        this.requiredFurniture = requiredFurniture == null ? new ArrayList<>() : requiredFurniture;
        this.keepFurnitureIds = keepFurnitureIds == null ? new ArrayList<>() : keepFurnitureIds;
        this.lifestyle = lifestyle;
    }

    /** 진행 단계 전환. progress 는 상태의 정의값을 따른다(FAILED 제외 — 마지막 값 유지). */
    public void advanceTo(JobStatus next) {
        this.status = next;
        if (next != JobStatus.FAILED) {
            this.progress = next.getProgress();
        }
    }

    public void fail(String reason) {
        this.status = JobStatus.FAILED;
        this.failureReason = reason;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getSpaceId() {
        return spaceId;
    }

    public JobStatus getStatus() {
        return status;
    }

    public int getProgress() {
        return progress;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public List<StyleType> getStyles() {
        return styles;
    }

    public BudgetRange getBudgetRange() {
        return budgetRange;
    }

    public List<String> getPreferredColors() {
        return preferredColors;
    }

    public List<FurnitureType> getRequiredFurniture() {
        return requiredFurniture;
    }

    public List<Long> getKeepFurnitureIds() {
        return keepFurnitureIds;
    }

    public Lifestyle getLifestyle() {
        return lifestyle;
    }
}
