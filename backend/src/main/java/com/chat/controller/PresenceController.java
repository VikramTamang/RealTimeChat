package com.chat.controller;

import com.chat.model.dto.PresenceDto;
import com.chat.security.UserPrincipal;
import com.chat.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> sendHeartbeat(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        presenceService.heartbeat(userPrincipal.getId(), userPrincipal.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<Map<String, String>> getBatchPresence(@RequestBody List<String> userIds) {
        Map<String, String> statusMap = presenceService.getBatchPresence(userIds);
        return ResponseEntity.ok(statusMap);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PresenceDto> getUserPresence(
            @PathVariable("userId") String userId,
            @RequestParam(name = "username", defaultValue = "") String username) {
        PresenceDto presence = presenceService.getPresence(userId, username);
        return ResponseEntity.ok(presence);
    }
}
