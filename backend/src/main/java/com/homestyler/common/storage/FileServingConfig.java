package com.homestyler.common.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** 업로드된 파일을 /files/** 경로로 서빙한다 (SecurityConfig 에서 permitAll). */
@Configuration
public class FileServingConfig implements WebMvcConfigurer {

    private final String location;

    public FileServingConfig(@Value("${storage.local.dir:uploads}") String dir) {
        this.location = Paths.get(dir).toAbsolutePath().normalize().toUri().toString();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location);
    }
}
