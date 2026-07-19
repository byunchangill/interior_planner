package com.homestyler.common;

/**
 * 실패 응답의 error 페이로드. code 는 ErrorCode enum 이름, message 는 한글 사용자 메시지.
 */
public record ApiError(String code, String message) {
}
