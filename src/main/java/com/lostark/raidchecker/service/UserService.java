package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.User;
import com.lostark.raidchecker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  // 회원가입
  @Transactional
  public User register(String username, String password) {
    if (userRepository.existsByUsername(username)) {
      throw new RuntimeException("이미 존재하는 사용자입니다.");
    }

    User user = new User();
    user.setUsername(username);
    user.setPassword(passwordEncoder.encode(password)); // TODO: 나중에 암호화 필요

    return userRepository.save(user);
  }

  // 로그인
  public User login(String username, String password) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    if (!passwordEncoder.matches(password, user.getPassword())) { // TODO: 나중에 암호화 비교
      throw new RuntimeException("비밀번호가 일치하지 않습니다.");
    }

    return user;
  }

  // 사용자 조회
  public User getUser(Long userId) {
    return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
  }
}
