package com.watchparty.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessageEntity {

    @Id
    @Column(name = "_id", length = 64, nullable = false)
    private String id;

    @Column(name = "room_id", length = 64, nullable = false)
    private String roomId;

    @Column(name = "sender_id", length = 64)
    private String senderId;

    @Column(name = "sender_name", length = 255, nullable = false)
    private String senderName;

    @Column(name = "sender_role", length = 32)
    private String senderRole;

    @Column(name = "message", length = 2000, nullable = false)
    private String message;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public ChatMessageEntity() {
        this.id = java.util.UUID.randomUUID().toString();
    }

    public ChatMessageEntity(String roomId, String senderId, String senderName, String senderRole, String message) {
        this.id = java.util.UUID.randomUUID().toString();
        this.roomId = roomId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.message = message;
        this.timestamp = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
