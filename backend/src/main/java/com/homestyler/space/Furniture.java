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

/** 가구. 공간에 소속. source 는 AI 인식 여부를 보존한다. */
@Entity
@Table(name = "furniture")
public class Furniture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FurnitureType type;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private boolean keep;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FurnitureSource source;

    protected Furniture() {
    }

    public Furniture(Space space, FurnitureType type, String label, boolean keep, FurnitureSource source) {
        this.space = space;
        this.type = type;
        this.label = label;
        this.keep = keep;
        this.source = source;
    }

    public Long getId() {
        return id;
    }

    public FurnitureType getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    public boolean isKeep() {
        return keep;
    }

    public FurnitureSource getSource() {
        return source;
    }

    public void update(FurnitureType type, String label, boolean keep) {
        this.type = type;
        this.label = label;
        this.keep = keep;
    }
}
