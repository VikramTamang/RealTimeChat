package com.chat.repository;

import com.chat.model.entity.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, String> {

    @Query("SELECT m FROM MessageEntity m WHERE m.roomId = :roomId ORDER BY m.createdAt DESC")
    Page<MessageEntity> findByRoomIdOrderByCreatedAtDesc(@Param("roomId") String roomId, Pageable pageable);

    @Query("SELECT m FROM MessageEntity m WHERE m.roomId = :roomId ORDER BY m.createdAt ASC")
    Page<MessageEntity> findByRoomIdOrderByCreatedAtAsc(@Param("roomId") String roomId, Pageable pageable);

    Optional<MessageEntity> findFirstByRoomIdOrderByCreatedAtDesc(String roomId);
}
