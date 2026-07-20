package com.homestyler.common.storage;

import com.homestyler.common.exception.ApiException;
import com.homestyler.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * 로컬 파일시스템 저장 (dev). 저장 시 ImageIO 로 재인코딩하여 EXIF/GPS 등 모든 메타데이터를 제거한다
 * (NFR-PRIV-002). 원본 포맷(jpg/png)은 유지한다.
 */
@Service
public class LocalFileStorage implements FileStorageService {

    private static final long MAX_BYTES = 20L * 1024 * 1024; // 20MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png");

    private final Path root;

    public LocalFileStorage(@Value("${storage.local.dir:uploads}") String dir) {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("업로드 디렉토리 생성 실패: " + root, e);
        }
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
        Path target = root.resolve(filename);

        try {
            // 재인코딩으로 EXIF/GPS 등 메타데이터 제거
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
            if (image == null) {
                throw new ApiException(ErrorCode.VALID_002, "손상되었거나 지원하지 않는 이미지입니다.");
            }
            boolean written = ImageIO.write(image, formatName, target.toFile());
            if (!written) {
                throw new ApiException(ErrorCode.VALID_002, "이미지 저장에 실패했습니다.");
            }
            return filename;
        } catch (IOException e) {
            throw new ApiException(ErrorCode.VALID_002, "이미지 처리 중 오류가 발생했습니다.");
        }
    }

    @Override
    public void delete(String storedFilename) {
        if (storedFilename == null || storedFilename.isBlank()) {
            return;
        }
        // 경로 조작 방지: 파일명만 사용
        String safe = Paths.get(storedFilename).getFileName().toString();
        try {
            Files.deleteIfExists(root.resolve(safe));
        } catch (IOException ignored) {
            // 파일 삭제 실패는 DB 정합성에 영향 없음 — 무시
        }
    }
}
