package com.chat.repository;

import com.chat.model.entity.RoomMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMemberEntity, String> {

    Optional<RoomMemberEntity> findByRoomIdAndUserId(String roomId, String userId);

    boolean existsByRoomIdAndUserId(String roomId, String userId);

    @Query("SELECT rm FROM RoomMemberEntity rm JOIN FETCH rm.user WHERE rm.room.id = :roomId")
    List<RoomMemberEntity> findAllByRoomIdWithUser(@Param("roomId") String roomId);

    long countByRoomId(String roomId);

    void deleteByRoomIdAndUserId(String roomId, String userId);
}
