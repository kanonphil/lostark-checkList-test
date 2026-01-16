package com.lostark.raidchecker.config;

import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.repository.RaidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
  private final RaidRepository raidRepository;

  @Override
  public void run(String... args) {
    // 이미 데이터가 있으면 스킵
    if (raidRepository.count() > 0) {
      return;
    }

    // 레이드 초기 데이터
    // 카제로스 2막 노말 (1관: 5,500G, 2관: 11,000G)
    Raid raid1 = new Raid("카제로스 2막", "노말", 1670.0, 1, 16500);
    raid1.addGate(1, 5500, 1820);
    raid1.addGate(2, 11000, 3720);

    // 카제로스 2막 하드 (1관: 7,500G, 2관: 15,500G)
    Raid raid2 = new Raid("카제로스 2막", "하드", 1690.0, 2, 23000);
    raid2.addGate(1, 7500, 2400);
    raid2.addGate(2, 15500, 5100);

    // 카제로스 3막 노말 (1관: 4,000G, 2관: 7,000G, 3관: 10,000G)
    Raid raid3 = new Raid("카제로스 3막", "노말", 1680.0, 3, 21000);
    raid3.addGate(1, 4000, 1300);
    raid3.addGate(2, 7000, 2350);
    raid3.addGate(3, 10000, 3360);

    // 카제로스 3막 하드 (1관: 5,000G, 2관: 8,000G, 3관: 14,000G)
    Raid raid4 = new Raid("카제로스 3막", "하드", 1700.0, 4, 27000);
    raid4.addGate(1, 5000, 1650);
    raid4.addGate(2, 8000, 2640);
    raid4.addGate(3, 14000, 4060);

    // 카제로스 4막 노말 (1관: 12,500G, 2관: 20,500G)
    Raid raid5 = new Raid("카제로스 4막", "노말", 1700.0, 5, 33000);
    raid5.addGate(1, 12500, 4000);
    raid5.addGate(2, 20500, 6560);

    // 카제로스 4막 하드 (1관: 15,000G, 2관: 27,000G)
    Raid raid6 = new Raid("카제로스 4막", "하드", 1720.0, 6, 42000);
    raid6.addGate(1, 15000, 4800);
    raid6.addGate(2, 27000, 8640);

    // 카제로스 종막 노말 (1관: 14,000G, 2관: 26,000G)
    Raid raid7 = new Raid("카제로스 종막", "노말", 1710.0, 7, 40000);
    raid7.addGate(1, 14000, 4480);
    raid7.addGate(2, 26000, 8320);

    // 카제로스 종막 하드 (1관: 17,000G, 2관: 35,000G)
    Raid raid8 = new Raid("카제로스 종막", "하드", 1730.0, 8, 52000);
    raid8.addGate(1, 17000, 5440);
    raid8.addGate(2, 35000, 11200);

    // 세르카 노말 (1관: 14,000G, 2관: 21,000G)
    Raid raid9 = new Raid("세르카", "노말", 1710.0, 9, 35000);
    raid9.addGate(1, 14000, 4480);
    raid9.addGate(2, 21000, 6720);

    // 세르카 하드 (1관: 17,500G, 2관: 26,500G)
    Raid raid10 = new Raid("세르카", "하드", 1730.0, 10, 44000);
    raid10.addGate(1, 17500, 5600);
    raid10.addGate(2, 26500, 8480);

    // 세르카 나이트메어 (1관: 21,000G, 2관: 33,000G)
    Raid raid11 = new Raid("세르카", "나이트메어", 1750.0, 11, 54000);
    raid11.addGate(1, 21000, 6720);
    raid11.addGate(2, 33000, 10560);

    raidRepository.save(raid1);
    raidRepository.save(raid2);
    raidRepository.save(raid3);
    raidRepository.save(raid4);
    raidRepository.save(raid5);
    raidRepository.save(raid6);
    raidRepository.save(raid7);
    raidRepository.save(raid8);
    raidRepository.save(raid9);
    raidRepository.save(raid10);
    raidRepository.save(raid11);

    System.out.println("✅ 레이드 초기 데이터 생성 완료!");
  }
}