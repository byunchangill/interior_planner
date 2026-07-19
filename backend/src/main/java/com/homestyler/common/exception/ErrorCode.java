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
    COMMON_500(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");

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
