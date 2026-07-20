package com.homestyler.space;

/** 공간 유형. 계약 Enums 정의와 문자 그대로 일치. */
public enum SpaceType {
    LIVING_ROOM("거실"),
    BEDROOM("침실"),
    KITCHEN("주방"),
    STUDY("서재"),
    ETC("기타");

    private final String korName;

    SpaceType(String korName) {
        this.korName = korName;
    }

    public String korName() {
        return korName;
    }
}
