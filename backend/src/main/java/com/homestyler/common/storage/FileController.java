package com.homestyler.common.storage;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Paths;

/**
 * 업로드 파일 서빙 — FileUrlSigner 의 HMAC 서명이 있어야만 응답한다
 * (기존 정적 리소스 핸들러는 무인증 공개라 제거). SecurityConfig 의 /files/** permitAll 은
 * 유지 — 인가는 서명이 담당한다 (img 태그는 Authorization 헤더를 못 싣는다).
 */
@RestController
public class FileController {

    private final FileStorageService storage;
    private final FileUrlSigner signer;

    public FileController(FileStorageService storage, FileUrlSigner signer) {
        this.storage = storage;
        this.signer = signer;
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<byte[]> serve(@PathVariable String filename,
                                          @RequestParam(required = false) Long exp,
                                          @RequestParam(required = false) String sig) {
        String safe = Paths.get(filename).getFileName().toString(); // 경로 조작 방지
        // style_* 는 사용자 데이터가 아닌 공개 스타일 에셋 — 서명 불요 (StyleType 이 정적 URL 생성)
        if (!safe.startsWith("style_")
                && (exp == null || !signer.verify(safe, exp, sig))) {
            throw new ApiException(ErrorCode.AUTH_003);
        }
        byte[] bytes = storage.fetch(safe);
        if (bytes == null) {
            throw new ApiException(ErrorCode.RES_001);
        }
        MediaType type = safe.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(type).body(bytes);
    }
}
