package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.User;
import com.lostark.raidchecker.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  // 회원가입 (보안 질문 추가)
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
    try {
      String username = request.get("username");
      String password = request.get("password");
      String securityQuestion = request.get("securityQuestion");
      String securityAnswer = request.get("securityAnswer");

      User user = userService.register(username, password, securityQuestion, securityAnswer);
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // 로그인
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpSession session) {
    try {
      String username = request.get("username");
      String password = request.get("password");

      User user = userService.login(username, password);

      // 세션에 사용자 정보 저장
      session.setAttribute("userId", user.getId());
      session.setAttribute("username", user.getUsername());

      System.out.println("세션 ID: " + session.getId()); // 디버깅용
      System.out.println("저장된 userId: " + session.getAttribute("userId"));

      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpSession session) {
    session.invalidate();
    return ResponseEntity.ok().build();
  }

  // 현재 로그인 사용자 확인용 (optional)
  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser(HttpSession session) {
    Long userId = (Long) session.getAttribute("userId");
    String username = (String) session.getAttribute("username");

    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    Map<String, Object> user = new HashMap<>();
    user.put("id", userId);
    user.put("username", username);

    return ResponseEntity.ok(user);
  }

  // 내 정보 조회
  @GetMapping("/{userId}")
  public ResponseEntity<?> getUser(@PathVariable Long userId) {
    try {
      User user = userService.getUser(userId);
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // ✅ 비밀번호 변경
  @PostMapping("/{userId}/change-password")
  public ResponseEntity<?> changePassword(
          @PathVariable Long userId,
          @RequestBody Map<String, String> request
  ) {
    try {
      String currentPassword = request.get("currentPassword");
      String newPassword = request.get("newPassword");

      userService.changePassword(userId, currentPassword, newPassword);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // ✅ 보안 질문 조회
  @GetMapping("/security-question")
  public ResponseEntity<?> getSecurityQuestion(@RequestParam String username) {
    try {
      String question = userService.getSecurityQuestion(username);
      Map<String, String> response = new HashMap<>();
      response.put("securityQuestion", question);
      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // ✅ 비밀번호 재설정
  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
    try {
      String username = request.get("username");
      String securityAnswer = request.get("securityAnswer");
      String newPassword = request.get("newPassword");

      userService.resetPassword(username, securityAnswer, newPassword);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}