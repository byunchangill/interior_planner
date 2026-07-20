package com.homestyler.common.storage;

import org.springframework.web.multipart.MultipartFile;

/** 파일 스토리지 추상화. 구현체는 Supabase Storage 연동(SupabaseFileStorage) 하나뿐이다. */
public interface FileStorageService {

    /**
     * 이미지를 저장한다. 저장 과정에서 EXIF 등 모든 메타데이터(GPS 포함)를 제거한다.
     * @return 저장된 UUID 파일명 (예: "ab12cd.jpg"). 서빙 URL 은 "/files/" + 반환값.
     */
    String store(MultipartFile file);

    /** 저장된 파일의 원본 바이트를 가져온다. 없으면 null. */
    byte[] fetch(String storedFilename);

    /** 저장된 파일을 물리 삭제한다. 파일이 없어도 예외를 던지지 않는다. */
    void delete(String storedFilename);
}
