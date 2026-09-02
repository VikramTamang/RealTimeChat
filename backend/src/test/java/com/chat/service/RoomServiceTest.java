package com.chat.service;

import com.chat.model.dto.CreateRoomRequest;
import com.chat.model.dto.RoomDto;
import com.chat.model.dto.UserDto;
import com.chat.model.entity.RoomEntity;
import com.chat.model.entity.RoomMemberEntity;
import com.chat.model.entity.UserEntity;
import com.chat.model.enums.RoomRole;
import com.chat.repository.MessageRepository;
import com.chat.repository.RoomMemberRepository;
import com.chat.repository.RoomRepository;
import com.chat.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;
    @Mock
    private RoomMemberRepository roomMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private AuthService authService;

    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomService = new RoomService(roomRepository, roomMemberRepository, userRepository, messageRepository, authService);
    }

    @Test
    void shouldCreateGroupRoomSuccessfully() {
        String creatorId = "user-1";
        UserEntity creator = new UserEntity("alice", "alice@example.com", "hash");
        creator.setId(creatorId);

        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));

        RoomEntity savedRoom = new RoomEntity("General", "General chat", true, creatorId);
        savedRoom.setId("room-gen-1");
        when(roomRepository.save(any(RoomEntity.class))).thenReturn(savedRoom);
        when(roomRepository.findById("room-gen-1")).thenReturn(Optional.of(savedRoom));

        RoomMemberEntity ownerMember = new RoomMemberEntity(savedRoom, creator, RoomRole.OWNER);
        when(roomMemberRepository.findAllByRoomIdWithUser("room-gen-1")).thenReturn(List.of(ownerMember));
        when(authService.toUserDto(creator)).thenReturn(new UserDto(creatorId, "alice", "alice@example.com", null, null));

        CreateRoomRequest request = new CreateRoomRequest("General", "General chat", true, null);
        RoomDto result = roomService.createRoom(request, creatorId);

        assertNotNull(result);
        assertEquals("General", result.name());
        assertTrue(result.isGroup());
        verify(roomMemberRepository).save(any(RoomMemberEntity.class));
    }

    @Test
    void shouldCreateDirectRoomBetweenTwoUsers() {
        String u1 = "user-alice";
        String u2 = "user-bob";

        UserEntity user1 = new UserEntity("alice", "alice@test.com", "h1");
        user1.setId(u1);
        UserEntity user2 = new UserEntity("bob", "bob@test.com", "h2");
        user2.setId(u2);

        when(roomRepository.findDirectRoomBetweenUsers(u1, u2)).thenReturn(Optional.empty());
        when(userRepository.findById(u1)).thenReturn(Optional.of(user1));
        when(userRepository.findById(u2)).thenReturn(Optional.of(user2));

        RoomEntity directRoom = new RoomEntity("DM", "Direct", false, u1);
        directRoom.setId("dm-123");
        when(roomRepository.save(any(RoomEntity.class))).thenReturn(directRoom);
        when(roomRepository.findById("dm-123")).thenReturn(Optional.of(directRoom));

        RoomDto result = roomService.getOrCreateDirectRoom(u1, u2);
        assertNotNull(result);
        assertFalse(result.isGroup());
    }
}
