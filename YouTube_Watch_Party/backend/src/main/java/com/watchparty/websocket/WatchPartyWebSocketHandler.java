package com.watchparty.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchparty.dto.WebSocketMessage;
import com.watchparty.model.Participant;
import com.watchparty.model.PlayState;
import com.watchparty.model.Role;
import com.watchparty.model.Room;
import com.watchparty.model.entity.ChatMessageEntity;
import com.watchparty.service.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class WatchPartyWebSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(WatchPartyWebSocketHandler.class);

    private final RoomManager roomManager;
    private final ObjectMapper objectMapper;

    // Room ID -> Set of active WebSocketSessions
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    // Session ID -> Room ID
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();
    // Session ID -> User ID
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();
    // User ID -> WebSocketSession
    private final Map<String, WebSocketSession> userSessionMap = new ConcurrentHashMap<>();

    public WatchPartyWebSocketHandler(RoomManager roomManager, ObjectMapper objectMapper) {
        this.roomManager = roomManager;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connected: session ID={}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            WebSocketMessage msg = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            if (msg == null || msg.getType() == null) {
                return;
            }

            String type = msg.getType();
            Map<String, Object> payload = msg.getPayload() != null ? msg.getPayload() : Collections.emptyMap();

            switch (type) {
                case "join_room":
                    handleJoinRoom(session, payload);
                    break;
                case "leave_room":
                    handleLeaveRoom(session);
                    break;
                case "play":
                    handlePlay(session, payload);
                    break;
                case "pause":
                    handlePause(session, payload);
                    break;
                case "seek":
                    handleSeek(session, payload);
                    break;
                case "change_video":
                    handleChangeVideo(session, payload);
                    break;
                case "assign_role":
                    handleAssignRole(session, payload);
                    break;
                case "remove_participant":
                    handleRemoveParticipant(session, payload);
                    break;
                case "transfer_host":
                    handleTransferHost(session, payload);
                    break;
                case "chat_message":
                    handleChatMessage(session, payload);
                    break;
                case "reaction":
                    handleReaction(session, payload);
                    break;
                case "request_sync":
                    handleRequestSync(session);
                    break;
                case "request_control":
                    handleRequestControl(session, payload);
                    break;
                case "approve_control":
                    handleApproveControl(session, payload);
                    break;
                case "add_to_queue":
                    handleAddToQueue(session, payload);
                    break;
                case "remove_from_queue":
                    handleRemoveFromQueue(session, payload);
                    break;
                case "play_queue_item":
                    handlePlayQueueItem(session, payload);
                    break;
                case "change_speed":
                    handleChangeSpeed(session, payload);
                    break;
                case "raise_hand":
                    handleRaiseHand(session, payload);
                    break;
                case "create_poll":
                    handleCreatePoll(session, payload);
                    break;
                case "vote_poll":
                    handleVotePoll(session, payload);
                    break;
                case "end_poll":
                    handleEndPoll(session, payload);
                    break;
                case "play_sound":
                    handlePlaySound(session, payload);
                    break;
                case "add_bookmark":
                    handleAddBookmark(session, payload);
                    break;
                case "jump_bookmark":
                    handleJumpBookmark(session, payload);
                    break;
                case "delete_bookmark":
                    handleDeleteBookmark(session, payload);
                    break;
                case "user_typing":
                    handleUserTyping(session, payload);
                    break;
                case "webrtc_signal":
                    handleWebRtcSignal(session, payload);
                    break;
                case "webrtc_media_state":
                    handleWebRtcMediaState(session, payload);
                    break;
                case "send_gift":
                    handleSendGift(session, payload);
                    break;
                case "start_trivia":
                    handleStartTrivia(session, payload);
                    break;
                case "answer_trivia":
                    handleAnswerTrivia(session, payload);
                    break;
                case "end_trivia":
                    handleEndTrivia(session, payload);
                    break;
                case "clear_chat":
                    handleClearChat(session);
                    break;
                case "broadcast_announcement":
                    handleBroadcastAnnouncement(session, payload);
                    break;
                case "mute_all":
                    handleMuteAll(session);
                    break;
                default:
                    log.warn("Unknown message type received: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing WebSocket message: {}", e.getMessage(), e);
            sendDirect(session, "error_message", Map.of("message", "Internal error: " + e.getMessage()));
        }
    }

    private void handleJoinRoom(WebSocketSession session, Map<String, Object> payload) {
        String roomId = (String) payload.get("roomId");
        String username = (String) payload.get("username");
        String userId = (String) payload.get("userId");

        if (roomId == null || roomId.trim().isEmpty()) {
            sendDirect(session, "error_message", Map.of("message", "Invalid room code"));
            return;
        }

        roomId = roomId.trim();
        if (username == null || username.trim().isEmpty()) {
            username = "Guest-" + session.getId().substring(0, 4);
        } else {
            username = username.trim();
        }

        if (userId == null || userId.trim().isEmpty()) {
            userId = UUID.randomUUID().toString();
        }

        Room existingRoom = roomManager.getRoom(roomId);
        if (existingRoom != null && existingRoom.getPasscode() != null) {
            String passcode = (String) payload.get("passcode");
            if (!existingRoom.validatePasscode(passcode)) {
                sendDirect(session, "error_message", Map.of("message", "Incorrect room password", "code", "AUTH_FAILED"));
                return;
            }
        }

        // Register session mappings
        sessionRoomMap.put(session.getId(), roomId);
        sessionUserMap.put(session.getId(), userId);
        userSessionMap.put(userId, session);
        roomSessions.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);

        Participant participant = roomManager.joinRoom(roomId, userId, username);
        Room room = roomManager.getRoom(roomId);

        // 1. Notify room that user joined
        broadcastToRoom(roomId, "user_joined", Map.of(
                "userId", userId,
                "username", username,
                "role", participant.getRole().name(),
                "participants", room.getParticipants(),
                "roomName", room.getName()
        ));

        // 2. Send immediate initial synchronization state to the joining user
        Map<String, Object> syncPayload = new HashMap<>();
        syncPayload.put("videoId", room.getVideoId());
        syncPayload.put("playState", room.getPlayState().name());
        syncPayload.put("currentTime", room.getCalculatedCurrentTime());
        syncPayload.put("playbackSpeed", room.getPlaybackSpeed());
        syncPayload.put("playlist", room.getPlaylist());
        syncPayload.put("bookmarks", room.getBookmarks());
        syncPayload.put("activePoll", room.getActivePoll());
        syncPayload.put("serverTimestamp", System.currentTimeMillis());
        syncPayload.put("assignedRole", participant.getRole().name());
        syncPayload.put("userId", userId);
        sendDirect(session, "sync_state", syncPayload);
    }

    private void handlePlay(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double time = getDoubleValue(payload.get("currentTime"));
        boolean success = roomManager.play(roomId, userId, time);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        } else {
            sendDirect(session, "error_message", Map.of("message", "Permission denied: Only Host or Moderator can play video"));
        }
    }

    private void handlePause(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double time = getDoubleValue(payload.get("currentTime"));
        boolean success = roomManager.pause(roomId, userId, time);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        } else {
            sendDirect(session, "error_message", Map.of("message", "Permission denied: Only Host or Moderator can pause video"));
        }
    }

    private void handleSeek(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double time = getDoubleValue(payload.get("time"));
        if (time == null) {
            time = getDoubleValue(payload.get("currentTime"));
        }
        if (time == null) time = 0.0;

        boolean success = roomManager.seek(roomId, userId, time);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        } else {
            sendDirect(session, "error_message", Map.of("message", "Permission denied: Only Host or Moderator can seek"));
        }
    }

    private void handleChangeVideo(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        String videoId = (String) payload.get("videoId");
        if (videoId == null || videoId.trim().isEmpty()) {
            videoId = (String) payload.get("url");
        }

        if (videoId == null || videoId.trim().isEmpty()) {
            sendDirect(session, "error_message", Map.of("message", "Video URL or ID cannot be empty"));
            return;
        }

        boolean success = roomManager.changeVideo(roomId, userId, videoId);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        } else {
            sendDirect(session, "error_message", Map.of("message", "Permission denied: Only Host or Moderator can change video"));
        }
    }

    private void handleAssignRole(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String hostUserId = sessionUserMap.get(session.getId());
        String targetUserId = (String) payload.get("userId");
        String roleStr = (String) payload.get("role");

        if (roomId == null || hostUserId == null || targetUserId == null || roleStr == null) return;

        try {
            Role newRole = Role.valueOf(roleStr.toUpperCase());
            boolean success = roomManager.assignRole(roomId, hostUserId, targetUserId, newRole);
            if (success) {
                Room room = roomManager.getRoom(roomId);
                Participant target = room.getParticipant(targetUserId);
                broadcastToRoom(roomId, "role_assigned", Map.of(
                        "userId", targetUserId,
                        "username", target != null ? target.getUsername() : "User",
                        "role", newRole.name(),
                        "participants", room.getParticipants()
                ));
            } else {
                sendDirect(session, "error_message", Map.of("message", "Only the Host can assign roles"));
            }
        } catch (IllegalArgumentException e) {
            sendDirect(session, "error_message", Map.of("message", "Invalid role: " + roleStr));
        }
    }

    private void handleRemoveParticipant(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String hostUserId = sessionUserMap.get(session.getId());
        String targetUserId = (String) payload.get("userId");

        if (roomId == null || hostUserId == null || targetUserId == null) return;

        boolean success = roomManager.removeParticipant(roomId, hostUserId, targetUserId);
        if (success) {
            Room room = roomManager.getRoom(roomId);

            // Notify target user specifically
            WebSocketSession targetSession = userSessionMap.get(targetUserId);
            if (targetSession != null && targetSession.isOpen()) {
                sendDirect(targetSession, "participant_removed", Map.of(
                        "userId", targetUserId,
                        "kicked", true,
                        "message", "You were removed from the room by the host"
                ));
            }

            // Broadcast to the rest of the room
            broadcastToRoom(roomId, "participant_removed", Map.of(
                    "userId", targetUserId,
                    "participants", room.getParticipants()
            ));
        } else {
            sendDirect(session, "error_message", Map.of("message", "Only the Host can remove participants"));
        }
    }

    private void handleTransferHost(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String currentHostId = sessionUserMap.get(session.getId());
        String targetUserId = (String) payload.get("userId");

        if (roomId == null || currentHostId == null || targetUserId == null) return;

        boolean success = roomManager.transferHost(roomId, currentHostId, targetUserId);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastToRoom(roomId, "role_assigned", Map.of(
                    "userId", targetUserId,
                    "role", Role.HOST.name(),
                    "hostTransferred", true,
                    "participants", room.getParticipants()
            ));
        } else {
            sendDirect(session, "error_message", Map.of("message", "Only the Host can transfer host privileges"));
        }
    }

    private void handleChatMessage(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String text = (String) payload.get("message");

        if (roomId == null || userId == null || text == null || text.trim().isEmpty()) return;

        Room room = roomManager.getRoom(roomId);
        if (room == null) return;
        Participant p = room.getParticipant(userId);
        String senderName = p != null ? p.getUsername() : "Anonymous";
        String senderRole = p != null ? p.getRole().name() : "PARTICIPANT";

        ChatMessageEntity saved = roomManager.saveChatMessage(roomId, userId, senderName, senderRole, text.trim());

        broadcastToRoom(roomId, "chat_broadcast", Map.of(
                "id", saved.getId(),
                "senderId", userId,
                "senderName", senderName,
                "senderRole", senderRole,
                "message", saved.getMessage(),
                "timestamp", saved.getTimestamp().toString()
        ));
    }

    private void handleReaction(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String emoji = (String) payload.get("emoji");

        if (roomId == null || emoji == null) return;

        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;
        String senderName = p != null ? p.getUsername() : "Someone";

        broadcastToRoom(roomId, "reaction_broadcast", Map.of(
                "emoji", emoji,
                "senderId", userId != null ? userId : "",
                "senderName", senderName
        ));
    }

    private void handleRequestSync(WebSocketSession session) {
        String roomId = sessionRoomMap.get(session.getId());
        if (roomId != null) {
            Room room = roomManager.getRoom(roomId);
            if (room != null) {
                sendDirect(session, "sync_state", Map.of(
                        "videoId", room.getVideoId(),
                        "playState", room.getPlayState().name(),
                        "currentTime", room.getCalculatedCurrentTime(),
                        "serverTimestamp", System.currentTimeMillis()
                ));
            }
        }
    }

    private void handleLeaveRoom(WebSocketSession session) {
        cleanUpSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        cleanUpSession(session);
    }

    private void cleanUpSession(WebSocketSession session) {
        String roomId = sessionRoomMap.remove(session.getId());
        String userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            userSessionMap.remove(userId);
        }

        if (roomId != null && userId != null) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }

            Participant removed = roomManager.leaveRoom(roomId, userId);
            Room room = roomManager.getRoom(roomId);
            if (removed != null && room != null) {
                broadcastToRoom(roomId, "user_left", Map.of(
                        "userId", userId,
                        "username", removed.getUsername(),
                        "participants", room.getParticipants()
                ));
            }
        }
    }

    private void broadcastSyncState(String roomId, Room room) {
        Map<String, Object> syncPayload = new HashMap<>();
        syncPayload.put("videoId", room.getVideoId());
        syncPayload.put("playState", room.getPlayState().name());
        syncPayload.put("currentTime", room.getCalculatedCurrentTime());
        syncPayload.put("playbackSpeed", room.getPlaybackSpeed());
        syncPayload.put("playlist", room.getPlaylist());
        syncPayload.put("bookmarks", room.getBookmarks());
        syncPayload.put("activePoll", room.getActivePoll());
        syncPayload.put("serverTimestamp", System.currentTimeMillis());
        broadcastToRoom(roomId, "sync_state", syncPayload);
    }

    private void handleRequestControl(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Room room = roomManager.getRoom(roomId);
        if (room == null) return;
        Participant p = room.getParticipant(userId);
        if (p == null) return;

        // Broadcast control request to the room, especially for the host/mods to see
        broadcastToRoom(roomId, "control_requested", Map.of(
                "userId", userId,
                "username", p.getUsername(),
                "message", p.getUsername() + " is requesting playback control"
        ));
    }

    private void handleApproveControl(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String hostUserId = sessionUserMap.get(session.getId());
        String targetUserId = (String) payload.get("userId");
        if (roomId == null || hostUserId == null || targetUserId == null) return;

        if (roomManager.isHost(roomId, hostUserId)) {
            roomManager.assignRole(roomId, hostUserId, targetUserId, Role.MODERATOR);
            Room room = roomManager.getRoom(roomId);
            Participant target = room.getParticipant(targetUserId);
            broadcastToRoom(roomId, "role_assigned", Map.of(
                    "userId", targetUserId,
                    "username", target != null ? target.getUsername() : "User",
                    "role", Role.MODERATOR.name(),
                    "participants", room.getParticipants()
            ));
        }
    }

    private void handleAddToQueue(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        String videoId = (String) payload.get("videoId");
        String title = (String) payload.get("title");
        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;
        String addedBy = p != null ? p.getUsername() : "Guest";

        if (videoId != null && !videoId.trim().isEmpty()) {
            roomManager.addToQueue(roomId, videoId, title, addedBy);
            broadcastToRoom(roomId, "queue_updated", Map.of(
                    "playlist", room.getPlaylist()
            ));
        }
    }

    private void handleRemoveFromQueue(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String queueItemId = (String) payload.get("queueItemId");
        if (roomId == null || userId == null || queueItemId == null) return;

        Room room = roomManager.getRoom(roomId);
        if (room != null && (roomManager.canControlPlayback(roomId, userId) || true)) {
            roomManager.removeFromQueue(roomId, queueItemId);
            broadcastToRoom(roomId, "queue_updated", Map.of(
                    "playlist", room.getPlaylist()
            ));
        }
    }

    private void handlePlayQueueItem(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String queueItemId = (String) payload.get("queueItemId");
        if (roomId == null || userId == null || queueItemId == null) return;

        boolean success = roomManager.playQueueItem(roomId, userId, queueItemId);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
            broadcastToRoom(roomId, "queue_updated", Map.of(
                    "playlist", room.getPlaylist()
            ));
        }
    }

    private void handleChangeSpeed(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double speed = getDoubleValue(payload.get("speed"));
        if (speed == null) speed = 1.0;

        boolean success = roomManager.changeSpeed(roomId, userId, speed);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        }
    }

    private void handleRaiseHand(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Boolean raised = (Boolean) payload.get("raised");
        boolean isRaised = raised != null ? raised : true;

        roomManager.setHandRaised(roomId, userId, isRaised);
        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;

        broadcastToRoom(roomId, "hand_raised", Map.of(
                "userId", userId,
                "username", p != null ? p.getUsername() : "User",
                "raised", isRaised,
                "participants", room != null ? room.getParticipants() : Collections.emptyList()
        ));
    }

    private void broadcastToRoom(String roomId, String type, Map<String, Object> payload) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;

        try {
            String json = objectMapper.writeValueAsString(WebSocketMessage.of(type, payload));
            TextMessage textMessage = new TextMessage(json);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        synchronized (session) {
                            session.sendMessage(textMessage);
                        }
                    } catch (IOException e) {
                        log.warn("Failed to send message to session {}: {}", session.getId(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket message: {}", e.getMessage());
        }
    }

    private void sendDirect(WebSocketSession session, String type, Map<String, Object> payload) {
        if (session == null || !session.isOpen()) return;
        try {
            String json = objectMapper.writeValueAsString(WebSocketMessage.of(type, payload));
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Failed to send direct message to session {}: {}", session.getId(), e.getMessage());
        }
    }

    private Double getDoubleValue(Object obj) {
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        } else if (obj instanceof String) {
            try {
                return Double.parseDouble((String) obj);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private void handleCreatePoll(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        String question = (String) payload.get("question");
        @SuppressWarnings("unchecked")
        List<String> options = (List<String>) payload.get("options");

        if (question == null || question.trim().isEmpty() || options == null || options.size() < 2) {
            sendDirect(session, "error_message", Map.of("message", "Poll must have a question and at least 2 options"));
            return;
        }

        com.watchparty.model.Poll poll = roomManager.createPoll(roomId, userId, question.trim(), options);
        if (poll != null) {
            broadcastToRoom(roomId, "poll_updated", Map.of("poll", poll));
        } else {
            sendDirect(session, "error_message", Map.of("message", "Permission denied: Only Host or Moderator can create polls"));
        }
    }

    private void handleVotePoll(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        String pollId = (String) payload.get("pollId");
        Object optIdxObj = payload.get("optionIndex");
        if (pollId == null || optIdxObj == null) return;

        int optionIndex = optIdxObj instanceof Number ? ((Number) optIdxObj).intValue() : Integer.parseInt(optIdxObj.toString());
        boolean success = roomManager.votePoll(roomId, userId, pollId, optionIndex);
        if (success) {
            Room room = roomManager.getRoom(roomId);
            if (room != null && room.getActivePoll() != null) {
                broadcastToRoom(roomId, "poll_updated", Map.of("poll", room.getActivePoll()));
            }
        }
    }

    private void handleEndPoll(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        com.watchparty.model.Poll endedPoll = roomManager.endPoll(roomId, userId);
        if (endedPoll != null) {
            broadcastToRoom(roomId, "poll_ended", Map.of("poll", endedPoll));
        } else {
            sendDirect(session, "error_message", Map.of("message", "Only Host or Moderator can end the poll"));
        }
    }

    private void handlePlaySound(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String soundId = (String) payload.get("soundId");
        if (roomId == null || soundId == null) return;

        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;
        String senderName = p != null ? p.getUsername() : "Someone";

        broadcastToRoom(roomId, "sound_played", Map.of(
                "soundId", soundId,
                "senderId", userId != null ? userId : "",
                "senderName", senderName
        ));
    }

    private void handleAddBookmark(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double time = getDoubleValue(payload.get("time"));
        if (time == null) {
            time = getDoubleValue(payload.get("currentTime"));
        }
        if (time == null) time = 0.0;
        String title = (String) payload.get("title");

        com.watchparty.model.Bookmark bm = roomManager.addBookmark(roomId, userId, time, title);
        if (bm != null) {
            Room room = roomManager.getRoom(roomId);
            broadcastToRoom(roomId, "bookmarks_updated", Map.of(
                    "bookmarks", room != null ? room.getBookmarks() : Collections.emptyList()
            ));
        }
    }

    private void handleJumpBookmark(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Double time = getDoubleValue(payload.get("time"));
        if (time != null && roomManager.canControlPlayback(roomId, userId)) {
            roomManager.seek(roomId, userId, time);
            Room room = roomManager.getRoom(roomId);
            broadcastSyncState(roomId, room);
        }
    }

    private void handleDeleteBookmark(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        String bookmarkId = (String) payload.get("bookmarkId");
        if (roomId == null || bookmarkId == null) return;

        boolean removed = roomManager.removeBookmark(roomId, userId, bookmarkId);
        if (removed) {
            Room room = roomManager.getRoom(roomId);
            broadcastToRoom(roomId, "bookmarks_updated", Map.of(
                    "bookmarks", room != null ? room.getBookmarks() : Collections.emptyList()
            ));
        }
    }

    private void handleUserTyping(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Boolean isTyping = (Boolean) payload.get("isTyping");
        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;

        broadcastToRoom(roomId, "user_typing", Map.of(
                "userId", userId,
                "username", p != null ? p.getUsername() : "User",
                "isTyping", isTyping != null ? isTyping : false
        ));
    }

    private void handleWebRtcSignal(WebSocketSession session, Map<String, Object> payload) {
        String senderUserId = sessionUserMap.get(session.getId());
        String targetUserId = (String) payload.get("targetUserId");
        if (senderUserId == null || targetUserId == null) return;

        WebSocketSession targetSession = userSessionMap.get(targetUserId);
        if (targetSession != null && targetSession.isOpen()) {
            Map<String, Object> forward = new HashMap<>(payload);
            forward.put("senderUserId", senderUserId);
            sendDirect(targetSession, "webrtc_signal", forward);
        }
    }

    private void handleWebRtcMediaState(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Map<String, Object> broadcast = new HashMap<>(payload);
        broadcast.put("userId", userId);
        broadcastToRoom(roomId, "webrtc_media_state", broadcast);
    }

    private void handleSendGift(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Room room = roomManager.getRoom(roomId);
        Participant p = room != null ? room.getParticipant(userId) : null;
        String senderName = p != null ? p.getUsername() : "Guest";

        String giftType = (String) payload.get("giftType");
        String giftIcon = (String) payload.get("giftIcon");
        String giftName = (String) payload.get("giftName");

        broadcastToRoom(roomId, "gift_broadcast", Map.of(
                "giftType", giftType != null ? giftType : "popcorn",
                "giftIcon", giftIcon != null ? giftIcon : "🍿",
                "giftName", giftName != null ? giftName : "Popcorn",
                "senderId", userId,
                "senderName", senderName
        ));
    }

    private void handleStartTrivia(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        if (!roomManager.canControlPlayback(roomId, userId)) {
            sendDirect(session, "error_message", Map.of("message", "Only Host or Moderator can start trivia"));
            return;
        }

        Room room = roomManager.getRoom(roomId);
        if (room == null) return;

        String question = (String) payload.get("question");
        @SuppressWarnings("unchecked")
        List<String> options = (List<String>) payload.get("options");
        Integer correctIndex = payload.get("correctIndex") instanceof Number ? ((Number) payload.get("correctIndex")).intValue() : 0;
        Integer duration = payload.get("duration") instanceof Number ? ((Number) payload.get("duration")).intValue() : 15;

        Participant p = room.getParticipant(userId);
        String creatorName = p != null ? p.getUsername() : "Host";

        com.watchparty.model.TriviaQuestion trivia = room.startTrivia(question, options, correctIndex, duration, creatorName);
        broadcastToRoom(roomId, "trivia_started", Map.of(
                "trivia", trivia,
                "duration", duration
        ));
    }

    private void handleAnswerTrivia(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Room room = roomManager.getRoom(roomId);
        if (room == null) return;

        Integer optionIndex = payload.get("optionIndex") instanceof Number ? ((Number) payload.get("optionIndex")).intValue() : -1;
        boolean answered = room.answerTrivia(userId, optionIndex);
        if (answered && room.getActiveTrivia() != null) {
            broadcastToRoom(roomId, "trivia_answered", Map.of(
                    "answerCount", room.getActiveTrivia().getAnswerCount()
            ));
        }
    }

    private void handleEndTrivia(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        Room room = roomManager.getRoom(roomId);
        if (room == null) return;

        Map<String, Object> result = room.endTrivia();
        if (result != null) {
            broadcastToRoom(roomId, "trivia_ended", result);
        }
    }

    private void handleClearChat(WebSocketSession session) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        if (roomManager.canControlPlayback(roomId, userId)) {
            broadcastToRoom(roomId, "chat_cleared", Map.of(
                    "clearedBy", userId,
                    "timestamp", System.currentTimeMillis()
            ));
        }
    }

    private void handleBroadcastAnnouncement(WebSocketSession session, Map<String, Object> payload) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        String announcement = (String) payload.get("announcement");
        if (announcement != null && !announcement.trim().isEmpty() && roomManager.canControlPlayback(roomId, userId)) {
            broadcastToRoom(roomId, "host_announcement", Map.of(
                    "announcement", announcement.trim(),
                    "senderId", userId,
                    "timestamp", System.currentTimeMillis()
            ));
        }
    }

    private void handleMuteAll(WebSocketSession session) {
        String roomId = sessionRoomMap.get(session.getId());
        String userId = sessionUserMap.get(session.getId());
        if (roomId == null || userId == null) return;

        if (roomManager.canControlPlayback(roomId, userId)) {
            broadcastToRoom(roomId, "mute_all", Map.of(
                    "mutedBy", userId,
                    "timestamp", System.currentTimeMillis()
            ));
        }
    }
}
