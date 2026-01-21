package com.lostark.raidchecker;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling  // ✅ 주간 자동 초기화
public class RaidCheckerApplication {

	@PostConstruct
	public void init() {
		// ✅ JVM 전역 시간대를 한국으로 설정
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		System.out.println("✅ Application timezone set to: " + TimeZone.getDefault().getID());
	}

	public static void main(String[] args) {
		SpringApplication.run(RaidCheckerApplication.class, args);
	}
}