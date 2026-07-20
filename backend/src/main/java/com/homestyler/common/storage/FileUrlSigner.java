package com.homestyler.common.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

/**
 * 업로드 파일 서빙 URL 의 HMAC 서명 (NFR-SEC: 사진 무인증 공개 방지).
 * URL 형태: /files/{filename}?exp={epochSec}&sig={base64url}
 * 모든 사진 URL 이 API 응답 시점에 새로 발급되므로 24시간 만료로 충분하다.
 * 공유 링크 회수 시 이미 발급된 서명 URL 은 만료까지 유효하다는 한계가 있다(최대 24h).
 */
@Component
public class FileUrlSigner {

    private static final long TTL_SECONDS = 24 * 3600;

    private final SecretKeySpec key;

    public FileUrlSigner(@Value("${jwt.secret}") String secret) {
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public String sign(String filename) {
        long exp = Instant.now().getEpochSecond() + TTL_SECONDS;
        return "/files/" + filename + "?exp=" + exp + "&sig=" + hmac(filename + "|" + exp);
    }

    public boolean verify(String filename, long exp, String sig) {
        if (sig == null || exp < Instant.now().getEpochSecond()) {
            return false;
        }
        return MessageDigest.isEqual( // 타이밍 공격 안전 비교
                hmac(filename + "|" + exp).getBytes(StandardCharsets.UTF_8),
                sig.getBytes(StandardCharsets.UTF_8));
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC 초기화 실패", e);
        }
    }
}
