package com.chat.repository;

import com.chat.model.entity.RoomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<RoomEntity, String> {

    @Query("SELECT r FROM RoomEntity r JOIN r.members m WHERE m.user.id = :userId ORDER BY r.updatedAt DESC")
    List<RoomEntity> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT r FROM RoomEntity r WHERE r.isGroup = true ORDER BY r.createdAt DESC")
    List<RoomEntity> findAllPublicGroupRooms();

    @Query("""
        SELECT r FROM RoomEntity r
        JOIN r.members m1
        JOIN r.members m2
        WHERE r.isGroup = false
        AND m1.user.id = :user1Id
        AND m2.user.id = :user2Id
    """)
    Optional<RoomEntity> findDirectRoomBetweenUsers(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);
}
