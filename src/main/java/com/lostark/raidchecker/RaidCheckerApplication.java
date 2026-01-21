package com.lostark.raidchecker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RaidCheckerApplication {

	public static void main(String[] args) {
		SpringApplication.run(RaidCheckerApplication.class, args);
	}

}
