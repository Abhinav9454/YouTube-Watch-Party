package com.watchparty.repository;

import com.watchparty.model.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, String> {
    List<ChatMessageEntity> findTop50ByRoomIdOrderByTimestampAsc(String roomId);
}
