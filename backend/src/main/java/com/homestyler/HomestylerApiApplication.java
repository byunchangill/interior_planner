package com.homestyler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class HomestylerApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(HomestylerApiApplication.class, args);
	}

}
