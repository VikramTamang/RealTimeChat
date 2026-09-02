package com.chat.service;

import com.chat.model.dto.ChatMessageDto;
import com.chat.model.dto.CreateRoomRequest;
import com.chat.model.dto.RoomDto;
import com.chat.model.dto.UserDto;
import com.chat.model.entity.MessageEntity;
import com.chat.model.entity.RoomEntity;
import com.chat.model.entity.RoomMemberEntity;
import com.chat.model.entity.UserEntity;
import com.chat.model.enums.RoomRole;
import com.chat.repository.MessageRepository;
import com.chat.repository.RoomMemberRepository;
import com.chat.repository.RoomRepository;
import com.chat.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;

    public RoomService(
            RoomRepository roomRepository,
            RoomMemberRepository roomMemberRepository,
            UserRepository userRepository,
            MessageRepository messageRepository,
            AuthService authService) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
    }

    @Transactional
    public RoomDto createRoom(CreateRoomRequest request, String creatorUserId) {
        UserEntity creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Creator user not found"));

        RoomEntity room = new RoomEntity(
                request.name().trim(),
                request.description(),
                request.isGroup(),
                creatorUserId
        );

        RoomEntity savedRoom = roomRepository.save(room);

        // Add creator as OWNER
        RoomMemberEntity ownerMember = new RoomMemberEntity(savedRoom, creator, RoomRole.OWNER);
        roomMemberRepository.save(ownerMember);

        // Add optional initial members
        if (request.memberUserIds() != null) {
            for (String memberId : request.memberUserIds()) {
                if (!memberId.equals(creatorUserId)) {
                    userRepository.findById(memberId).ifPresent(user -> {
                        RoomMemberEntity member = new RoomMemberEntity(savedRoom, user, RoomRole.MEMBER);
                        roomMemberRepository.save(member);
                    });
                }
            }
        }

        return getRoomDto(savedRoom.getId());
    }

    @Transactional
    public RoomDto getOrCreateDirectRoom(String user1Id, String user2Id) {
        if (user1Id.equals(user2Id)) {
            throw new IllegalArgumentException("Cannot create a direct room with yourself");
        }

        Optional<RoomEntity> existing = roomRepository.findDirectRoomBetweenUsers(user1Id, user2Id);
        if (existing.isPresent()) {
            return getRoomDto(existing.get().getId());
        }

        UserEntity user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("User 1 not found"));
        UserEntity user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("User 2 not found"));

        String directRoomName = "DM: " + user1.getUsername() + " & " + user2.getUsername();
        RoomEntity room = new RoomEntity(directRoomName, "Direct chat", false, user1Id);
        room = roomRepository.save(room);

        RoomMemberEntity m1 = new RoomMemberEntity(room, user1, RoomRole.MEMBER);
        RoomMemberEntity m2 = new RoomMemberEntity(room, user2, RoomRole.MEMBER);
        roomMemberRepository.save(m1);
        roomMemberRepository.save(m2);

        return getRoomDto(room.getId());
    }

    @Transactional
    public RoomDto joinRoom(String roomId, String userId) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (!room.isGroup()) {
            throw new IllegalStateException("Cannot join a direct 1:1 private chat room");
        }

        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            return getRoomDto(roomId);
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        RoomMemberEntity member = new RoomMemberEntity(room, user, RoomRole.MEMBER);
        roomMemberRepository.save(member);

        return getRoomDto(roomId);
    }

    @Transactional(readOnly = true)
    public List<RoomDto> getUserRooms(String userId) {
        List<RoomEntity> rooms = roomRepository.findAllByUserId(userId);
        return rooms.stream().map(room -> mapToDto(room, userId)).toList();
    }

    @Transactional(readOnly = true)
    public List<RoomDto> getPublicRooms(String currentUserId) {
        List<RoomEntity> rooms = roomRepository.findAllPublicGroupRooms();
        return rooms.stream().map(room -> mapToDto(room, currentUserId)).toList();
    }

    @Transactional(readOnly = true)
    public RoomDto getRoomDto(String roomId) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        return mapToDto(room, null);
    }

    @Transactional(readOnly = true)
    public boolean isMember(String roomId, String userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    private RoomDto mapToDto(RoomEntity room, String currentUserId) {
        List<RoomMemberEntity> memberEntities = roomMemberRepository.findAllByRoomIdWithUser(room.getId());
        List<UserDto> members = memberEntities.stream()
                .map(m -> authService.toUserDto(m.getUser()))
                .toList();

        ChatMessageDto lastMessage = messageRepository.findFirstByRoomIdOrderByCreatedAtDesc(room.getId())
                .map(this::toMessageDto)
                .orElse(null);

        String displayName = room.getName();
        // If it's a 1:1 room and current user is provided, show the other user's name
        if (!room.isGroup() && currentUserId != null && members.size() == 2) {
            for (UserDto m : members) {
                if (!m.id().equals(currentUserId)) {
                    displayName = m.username();
                    break;
                }
            }
        }

        return new RoomDto(
                room.getId(),
                displayName,
                room.getDescription(),
                room.isGroup(),
                room.getCreatedBy(),
                room.getCreatedAt(),
                memberEntities.size(),
                lastMessage,
                members
        );
    }

    private ChatMessageDto toMessageDto(MessageEntity entity) {
        return new ChatMessageDto(
                entity.getId(),
                entity.getRoomId(),
                entity.getSenderId(),
                entity.getSenderUsername(),
                null,
                null,
                entity.getContent(),
                entity.getType(),
                entity.getCreatedAt()
        );
    }
}
