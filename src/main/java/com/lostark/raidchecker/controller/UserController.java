package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.User;
import com.lostark.raidchecker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  // 회원가입
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
    try {
      String username = request.get("username");
      String password = request.get("password");

      User user = userService.register(username, password);
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  // 로그인
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
    try {
      String username = request.get("username");
      String password = request.get("password");

      User user = userService.login(username, password);
      return ResponseEntity.ok(user);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
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
}