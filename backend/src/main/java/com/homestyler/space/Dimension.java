package com.homestyler.space;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

/** 공간 치수 (1:1 with Space). 개구부 목록을 소유. areaPyeong 은 저장하지 않고 응답 시 계산. */
@Entity
@Table(name = "dimensions")
public class Dimension {

    private static final double SQM_PER_PYEONG = 3.3058;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "space_id", nullable = false, unique = true)
    private Space space;

    @Column(nullable = false)
    private double widthM;

    @Column(nullable = false)
    private double depthM;

    @Column(nullable = false)
    private double heightM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Confidence confidence;

    @Column(nullable = false)
    private boolean isUserVerified;

    @OneToMany(mappedBy = "dimension", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Opening> openings = new ArrayList<>();

    protected Dimension() {
    }

    public Dimension(double widthM, double depthM, double heightM, Confidence confidence, boolean isUserVerified) {
        this.widthM = widthM;
        this.depthM = depthM;
        this.heightM = heightM;
        this.confidence = confidence;
        this.isUserVerified = isUserVerified;
    }

    /** 소수 첫째 자리로 반올림한 평수. */
    public double areaPyeong() {
        double pyeong = (widthM * depthM) / SQM_PER_PYEONG;
        return Math.round(pyeong * 10.0) / 10.0;
    }

    public void replaceOpenings(List<Opening> newOpenings) {
        openings.clear();
        for (Opening o : newOpenings) {
            o.setDimension(this);
            openings.add(o);
        }
    }

    public Long getId() {
        return id;
    }

    public double getWidthM() {
        return widthM;
    }

    public double getDepthM() {
        return depthM;
    }

    public double getHeightM() {
        return heightM;
    }

    public Confidence getConfidence() {
        return confidence;
    }

    public boolean isUserVerified() {
        return isUserVerified;
    }

    public List<Opening> getOpenings() {
        return openings;
    }

    public void update(double widthM, double depthM, double heightM, boolean isUserVerified) {
        this.widthM = widthM;
        this.depthM = depthM;
        this.heightM = heightM;
        this.isUserVerified = isUserVerified;
    }

    public void setSpace(Space space) {
        this.space = space;
    }
}
