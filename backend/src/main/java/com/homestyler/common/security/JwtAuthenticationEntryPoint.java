package com.homestyler.common.security;

import com.homestyler.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 미인증/토큰오류 요청에 대한 401 응답을 표준 ApiResponse 실패 포맷으로 직접 작성한다.
 * 필터가 기록한 authErrorCode(AUTH_001/AUTH_002)가 있으면 그 코드를, 없으면 COMMON_401.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        String code = (String) request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_ATTR);
        ErrorCode errorCode = switch (code == null ? "" : code) {
            case "AUTH_001" -> ErrorCode.AUTH_001;
            case "AUTH_002" -> ErrorCode.AUTH_002;
            default -> ErrorCode.COMMON_401;
        };
        response.setStatus(errorCode.getStatus().value());
        response.setContentType("application/json;charset=UTF-8");
        String body = "{\"success\":false,\"error\":{\"code\":\"" + errorCode.name()
                + "\",\"message\":\"" + errorCode.getMessage() + "\"}}";
        response.getWriter().write(new String(body.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));
    }
}
