package com.homestyler.recommendation;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * 생활방식 설문(FR-PREF-006). 분석 조건의 일부로 잡에 임베드되어,
 * 추천 이유(FR-RECO-014) 생성 시 반영된다.
 */
@Embeddable
public class Lifestyle {

    private Integer householdSize;
    private Boolean hasChildren;
    private Boolean hasPets;
    private Boolean worksFromHome;
    private Boolean cooksOften;

    @Enumerated(EnumType.STRING)
    private StoragePreference storagePreference;

    @Enumerated(EnumType.STRING)
    private HousingType housingType;

    private Integer residenceYears;

    protected Lifestyle() {
    }

    public Lifestyle(Integer householdSize, Boolean hasChildren, Boolean hasPets, Boolean worksFromHome,
                     Boolean cooksOften, StoragePreference storagePreference, HousingType housingType,
                     Integer residenceYears) {
        this.householdSize = householdSize;
        this.hasChildren = hasChildren;
        this.hasPets = hasPets;
        this.worksFromHome = worksFromHome;
        this.cooksOften = cooksOften;
        this.storagePreference = storagePreference;
        this.housingType = housingType;
        this.residenceYears = residenceYears;
    }

    public boolean hasPets() {
        return Boolean.TRUE.equals(hasPets);
    }

    public boolean hasChildren() {
        return Boolean.TRUE.equals(hasChildren);
    }

    public boolean worksFromHome() {
        return Boolean.TRUE.equals(worksFromHome);
    }

    public boolean cooksOften() {
        return Boolean.TRUE.equals(cooksOften);
    }

    public boolean prefersStorage() {
        return storagePreference == StoragePreference.STORAGE;
    }

    public Integer getHouseholdSize() {
        return householdSize;
    }

    public StoragePreference getStoragePreference() {
        return storagePreference;
    }

    public HousingType getHousingType() {
        return housingType;
    }

    public Integer getResidenceYears() {
        return residenceYears;
    }
}
