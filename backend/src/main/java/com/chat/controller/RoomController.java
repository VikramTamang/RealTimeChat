package com.chat.controller;

import com.chat.model.dto.ChatMessageDto;
import com.chat.model.dto.CreateRoomRequest;
import com.chat.model.dto.PageResponse;
import com.chat.model.dto.RoomDto;
import com.chat.security.UserPrincipal;
import com.chat.service.MessageService;
import com.chat.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;
    private final MessageService messageService;

    public RoomController(RoomService roomService, MessageService messageService) {
        this.roomService = roomService;
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<List<RoomDto>> getUserRooms(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<RoomDto> rooms = roomService.getUserRooms(userPrincipal.getId());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/public")
    public ResponseEntity<List<RoomDto>> getPublicRooms(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<RoomDto> rooms = roomService.getPublicRooms(userPrincipal.getId());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDto> getRoom(@PathVariable("id") String id) {
        RoomDto room = roomService.getRoomDto(id);
        return ResponseEntity.ok(room);
    }

    @PostMapping
    public ResponseEntity<RoomDto> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        RoomDto room = roomService.createRoom(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @PostMapping("/direct/{targetUserId}")
    public ResponseEntity<RoomDto> getOrCreateDirectRoom(
            @PathVariable("targetUserId") String targetUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        RoomDto room = roomService.getOrCreateDirectRoom(userPrincipal.getId(), targetUserId);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<RoomDto> joinRoom(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        RoomDto room = roomService.joinRoom(id, userPrincipal.getId());
        return ResponseEntity.ok(room);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<PageResponse<ChatMessageDto>> getRoomMessages(
            @PathVariable("id") String id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PageResponse<ChatMessageDto> messages = messageService.getRoomMessages(id, userPrincipal.getId(), page, size);
        return ResponseEntity.ok(messages);
    }
}
