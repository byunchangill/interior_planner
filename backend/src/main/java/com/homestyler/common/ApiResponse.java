package com.homestyler.common;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 모든 API 응답의 표준 래퍼.
 * 성공: { "success": true, "data": ... }
 * 실패: { "success": false, "error": { "code", "message" } }
 * (null 필드는 직렬화에서 제외되어 성공 응답에는 error 키가, 실패 응답에는 data 키가 나타나지 않는다.)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, ApiError error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(false, null, error);
    }
}
