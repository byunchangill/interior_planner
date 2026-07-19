package com.homestyler.common.exception;

/**
 * 비즈니스 예외. 컨트롤러/서비스는 이 예외만 throw 하고,
 * 포맷팅은 GlobalExceptionHandler 가 전담한다 (컨트롤러 try-catch 금지).
 */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
