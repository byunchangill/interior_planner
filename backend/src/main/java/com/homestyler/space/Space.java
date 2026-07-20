package com.homestyler.space;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 공간. 사용자(userId)에 직접 소속 (결정 1: 집/Home 엔티티 생략).
 * 사진·치수(1:1)·가구를 자식으로 소유하며 삭제 시 cascade 로 함께 정리된다.
 */
@Entity
@Table(name = "spaces")
@EntityListeners(AuditingEntityListener.class)
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceType spaceType;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "space", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<SpacePhoto> photos = new ArrayList<>();

    @OneToOne(mappedBy = "space", cascade = CascadeType.ALL, orphanRemoval = true)
    private Dimension dimension;

    @OneToMany(mappedBy = "space", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Furniture> furniture = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    protected Space() {
    }

    public Space(Long userId, SpaceType spaceType, String name) {
        this.userId = userId;
        this.spaceType = spaceType;
        this.name = name;
    }

    public void addPhoto(SpacePhoto photo) {
        photo.setSpace(this);
        photos.add(photo);
    }

    public void removePhoto(SpacePhoto photo) {
        photos.remove(photo);
        photo.setSpace(null);
    }

    public void setDimension(Dimension dimension) {
        if (dimension != null) {
            dimension.setSpace(this);
        }
        this.dimension = dimension;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public SpaceType getSpaceType() {
        return spaceType;
    }

    public String getName() {
        return name;
    }

    public List<SpacePhoto> getPhotos() {
        return photos;
    }

    public Dimension getDimension() {
        return dimension;
    }

    public List<Furniture> getFurniture() {
        return furniture;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
