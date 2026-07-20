package com.homestyler.space;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 개구부(창/문). 치수(Dimension)에 소속. */
@Entity
@Table(name = "openings")
public class Opening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dimension_id", nullable = false)
    private Dimension dimension;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OpeningType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Wall wall;

    @Column(nullable = false)
    private double widthM;

    protected Opening() {
    }

    public Opening(OpeningType type, Wall wall, double widthM) {
        this.type = type;
        this.wall = wall;
        this.widthM = widthM;
    }

    public Long getId() {
        return id;
    }

    public OpeningType getType() {
        return type;
    }

    public Wall getWall() {
        return wall;
    }

    public double getWidthM() {
        return widthM;
    }

    public void setDimension(Dimension dimension) {
        this.dimension = dimension;
    }
}
