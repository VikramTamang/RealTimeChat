package com.chat.controller;

import com.chat.model.dto.UserDto;
import com.chat.model.entity.UserEntity;
import com.chat.repository.UserRepository;
import com.chat.security.UserPrincipal;
import com.chat.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam(name = "q", defaultValue = "") String query,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<UserEntity> users = userRepository.searchUsers(query, userPrincipal.getId());
        List<UserDto> dtos = users.stream().map(authService::toUserDto).toList();
        return ResponseEntity.ok(dtos);
    }
}
