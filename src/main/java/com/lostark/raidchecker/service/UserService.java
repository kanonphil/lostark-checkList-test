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

  // 회원가입 (보안 질문 포함)
  @Transactional
  public User register(String username, String password, String securityQuestion, String securityAnswer) {
    if (userRepository.existsByUsername(username)) {
      throw new RuntimeException("이미 존재하는 사용자입니다.");
    }

    User user = new User();
    user.setUsername(username);
    user.setPassword(passwordEncoder.encode(password));
    user.setSecurityQuestion(securityQuestion);
    user.setSecurityAnswer(passwordEncoder.encode(securityAnswer)); // 답변도 암호화

    return userRepository.save(user);
  }

  // 로그인
  public User login(String username, String password) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new RuntimeException("비밀번호가 일치하지 않습니다.");
    }

    return user;
  }

  // 사용자 조회
  public User getUser(Long userId) {
    return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
  }

  // 비밀번호 변경 (로그인 상태)
  @Transactional
  public void changePassword(Long userId, String currentPassword, String newPassword) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    // 현재 비밀번호 확인
    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
      throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
    }

    // 새 비밀번호로 변경
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
  }

  // 보안 질문 조회
  public String getSecurityQuestion(String username) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    if (user.getSecurityQuestion() == null || user.getSecurityQuestion().isEmpty()) {
      throw new RuntimeException("보안 질문이 설정되지 않았습니다.");
    }

    return user.getSecurityQuestion();
  }

  // 비밀번호 재설정 (보안 질문 확인)
  @Transactional
  public void resetPassword(String username, String securityAnswer, String newPassword) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    if (user.getSecurityAnswer() == null || user.getSecurityAnswer().isEmpty()) {
      throw new RuntimeException("보안 질문이 설정되지 않았습니다.");
    }

    // 보안 답변 확인
    if (!passwordEncoder.matches(securityAnswer, user.getSecurityAnswer())) {
      throw new RuntimeException("보안 답변이 일치하지 않습니다.");
    }

    // 비밀번호 재설정
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
  }
}