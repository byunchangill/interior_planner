package com.homestyler.common.exception;

import com.homestyler.common.ApiError;
import com.homestyler.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 모든 예외를 표준 ApiResponse 실패 포맷으로 변환한다.
 * Bean Validation 실패는 COMMON_400 으로 통일한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity
                .status(code.getStatus())
                .body(ApiResponse.error(new ApiError(code.name(), e.getMessage())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String message = fieldError != null
                ? fieldError.getDefaultMessage()
                : ErrorCode.COMMON_400.getMessage();
        return ResponseEntity
                .status(ErrorCode.COMMON_400.getStatus())
                .body(ApiResponse.error(new ApiError(ErrorCode.COMMON_400.name(), message)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        return ResponseEntity
                .status(ErrorCode.COMMON_500.getStatus())
                .body(ApiResponse.error(new ApiError(ErrorCode.COMMON_500.name(), ErrorCode.COMMON_500.getMessage())));
    }
}
