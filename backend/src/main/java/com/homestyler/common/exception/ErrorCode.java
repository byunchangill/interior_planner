package com.homestyler.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 코드·HTTP 상태·한글 메시지의 유일한 정의처.
 * 기능 명세서의 예외 처리 표와 코드·메시지를 일치시킨다.
 * M0 에서는 공통(COMMON_*) 코드만 정의하고, 모듈별 코드는 각 마일스톤에서 추가한다.
 */
public enum ErrorCode {

    COMMON_400(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    COMMON_401(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    COMMON_403(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    COMMON_404(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    COMMON_500(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    // --- M1: AUTH + HOME ---
    AUTH_001(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    AUTH_002(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    AUTH_004(HttpStatus.BAD_REQUEST, "필수 약관에 동의해야 합니다."),
    VALID_001(HttpStatus.BAD_REQUEST, "입력값 형식이 올바르지 않습니다."),
    RES_001(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),

    // --- M2: SPACE ---
    AUTH_003(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    VALID_002(HttpStatus.BAD_REQUEST, "파일 형식 또는 용량이 올바르지 않습니다."),
    VALID_003(HttpStatus.BAD_REQUEST, "입력값이 허용 범위를 벗어났습니다."),
    IMG_001(HttpStatus.UNPROCESSABLE_CONTENT, "이미지 품질이 기준에 미달합니다."),

    // --- M3: RECO ---
    LIMIT_001(HttpStatus.CONFLICT, "이미 진행 중인 분석이 있습니다. 완료 후 다시 시도하세요."),
    AI_001(HttpStatus.INTERNAL_SERVER_ERROR, "분석에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    AI_004(HttpStatus.INTERNAL_SERVER_ERROR, "시각화 생성에 실패했습니다."),
    DATA_001(HttpStatus.OK, "원본 사진이 삭제되어 일부 이미지를 표시할 수 없습니다."),

    // --- M4: SAVE ---
    // VALID_004(서로 다른 공간 비교)는 차단이 아니라 200 + sameSpace:false 로 대체되므로 throw 하지 않아 enum 미추가.
    SHARE_001(HttpStatus.GONE, "만료되었거나 회수된 공유 링크입니다."),
    LIMIT_002(HttpStatus.CONFLICT, "공유 링크는 추천안당 최대 5개까지 생성할 수 있습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
