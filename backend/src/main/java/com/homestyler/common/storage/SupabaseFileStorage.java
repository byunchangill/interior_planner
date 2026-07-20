package com.homestyler.common.storage;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

/**
 * Supabase Storage 연동. 저장 시 ImageIO 로 재인코딩하여 EXIF/GPS 등 모든 메타데이터를
 * 제거한다 (NFR-PRIV-002). 원본 포맷(jpg/png)은 유지한다.
 */
@Service
public class SupabaseFileStorage implements FileStorageService {

    private static final long MAX_BYTES = 20L * 1024 * 1024; // 20MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png");
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final HttpClient http = HttpClient.newHttpClient();
    private final String objectBaseUrl;
    private final String serviceRoleKey;

    public SupabaseFileStorage(@Value("${supabase.url}") String supabaseUrl,
                                @Value("${supabase.service-role-key}") String serviceRoleKey,
                                @Value("${supabase.storage.bucket:uploads}") String bucket) {
        this.objectBaseUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/";
        this.serviceRoleKey = serviceRoleKey;
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.VALID_002);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(ErrorCode.VALID_002, "파일 용량이 20MB 를 초과합니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType.toLowerCase())) {
            throw new ApiException(ErrorCode.VALID_002, "JPG 또는 PNG 이미지만 업로드할 수 있습니다.");
        }
        boolean png = contentType.equalsIgnoreCase("image/png");
        String formatName = png ? "png" : "jpg";
        String filename = UUID.randomUUID().toString().replace("-", "") + "." + formatName;

        byte[] reencoded = reencode(file, formatName);
        upload(filename, reencoded, contentType);
        return filename;
    }

    private byte[] reencode(MultipartFile file, String formatName) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
            if (image == null) {
                throw new ApiException(ErrorCode.VALID_002, "손상되었거나 지원하지 않는 이미지입니다.");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(image, formatName, out)) {
                throw new ApiException(ErrorCode.VALID_002, "이미지 저장에 실패했습니다.");
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new ApiException(ErrorCode.VALID_002, "이미지 처리 중 오류가 발생했습니다.");
        }
    }

    private void upload(String filename, byte[] bytes, String contentType) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(objectBaseUrl + filename))
                .timeout(TIMEOUT)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(bytes))
                .build();
        HttpResponse<String> response = send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new ApiException(ErrorCode.VALID_002, "파일 업로드에 실패했습니다.");
        }
    }

    @Override
    public byte[] fetch(String storedFilename) {
        if (storedFilename == null || storedFilename.isBlank()) {
            return null;
        }
        String safe = Paths.get(storedFilename).getFileName().toString();
        HttpRequest request = HttpRequest.newBuilder(URI.create(objectBaseUrl + safe))
                .timeout(TIMEOUT)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .GET()
                .build();
        HttpResponse<byte[]> response = send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() == 404) {
            return null;
        }
        if (response.statusCode() / 100 != 2) {
            throw new ApiException(ErrorCode.VALID_002, "파일 조회에 실패했습니다.");
        }
        return response.body();
    }

    @Override
    public void delete(String storedFilename) {
        if (storedFilename == null || storedFilename.isBlank()) {
            return;
        }
        String safe = Paths.get(storedFilename).getFileName().toString();
        HttpRequest request = HttpRequest.newBuilder(URI.create(objectBaseUrl + safe))
                .timeout(TIMEOUT)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .DELETE()
                .build();
        try {
            http.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            // 파일 삭제 실패는 DB 정합성에 영향 없음 — 무시
        }
    }

    private <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler) {
        try {
            return http.send(request, handler);
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(ErrorCode.VALID_002, "Supabase Storage 연결에 실패했습니다.");
        }
    }
}
