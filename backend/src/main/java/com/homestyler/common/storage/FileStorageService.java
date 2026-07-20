package com.homestyler.common.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 스토리지 추상화. dev 는 LocalFileStorage(로컬 파일시스템),
 * prod 는 오브젝트 스토리지 어댑터로 교체 가능하게 인터페이스로 분리한다.
 */
public interface FileStorageService {

    /**
     * 이미지를 저장한다. 저장 과정에서 EXIF 등 모든 메타데이터(GPS 포함)를 제거한다.
     * @return 저장된 UUID 파일명 (예: "ab12cd.jpg"). 서빙 URL 은 "/files/" + 반환값.
     */
    String store(MultipartFile file);

    /** 저장된 파일을 물리 삭제한다. 파일이 없어도 예외를 던지지 않는다. */
    void delete(String storedFilename);
}
