package com.homestyler.space;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 공간 사진. storedFilename 은 스토리지 내부의 UUID 파일명이며,
 * 외부에 노출하는 서빙 URL 은 서비스에서 "/files/" + storedFilename 으로 조립한다.
 */
@Entity
@Table(name = "space_photos")
@EntityListeners(AuditingEntityListener.class)
public class SpacePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Column(nullable = false)
    private String storedFilename;

    @Column(nullable = false)
    private boolean isFloorPlan;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    protected SpacePhoto() {
    }

    public SpacePhoto(String storedFilename, boolean isFloorPlan) {
        this.storedFilename = storedFilename;
        this.isFloorPlan = isFloorPlan;
    }

    public Long getId() {
        return id;
    }

    public String getStoredFilename() {
        return storedFilename;
    }

    public boolean isFloorPlan() {
        return isFloorPlan;
    }

    public void setSpace(Space space) {
        this.space = space;
    }
}
