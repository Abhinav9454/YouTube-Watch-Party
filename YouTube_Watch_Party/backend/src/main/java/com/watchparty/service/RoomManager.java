package com.watchparty.service;

import com.watchparty.model.Participant;
import com.watchparty.model.PlayState;
import com.watchparty.model.Role;
import com.watchparty.model.Room;
import com.watchparty.model.entity.ChatMessageEntity;
import com.watchparty.model.entity.RoomEntity;
import com.watchparty.repository.ChatMessageRepository;
import com.watchparty.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing rooms in memory for low-latency real-time synchronization,
 * backed by SQL database for persistence.
 */
@Service
public class RoomManager {
    private static final Logger log = LoggerFactory.getLogger(RoomManager.class);

    private final RoomRepository roomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final Map<String, Room> activeRooms = new ConcurrentHashMap<>();

    public RoomManager(RoomRepository roomRepository, ChatMessageRepository chatMessageRepository) {
        this.roomRepository = roomRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    /**
     * Creates a new room and persists it in SQL database.
     */
    @Transactional
    public Room createRoom(String requestedRoomId, String name, String creatorUsername, String initialVideoId, String passcode) {
        String roomId = (requestedRoomId != null && !requestedRoomId.trim().isEmpty())
                ? requestedRoomId.trim().toUpperCase()
                : generateRoomCode();

        String videoId = (initialVideoId != null && !initialVideoId.trim().isEmpty())
                ? extractVideoId(initialVideoId)
                : "dQw4w9WgXcQ";

        String roomName = (name != null && !name.trim().isEmpty()) ? name.trim() : "Watch Party (" + roomId + ")";

        // Persist to SQL
        RoomEntity entity = new RoomEntity(roomId, roomName, creatorUsername, videoId);
        entity.setPasscode(passcode != null && !passcode.trim().isEmpty() ? passcode.trim() : null);
        roomRepository.save(entity);

        Room room = new Room(roomId, roomName, videoId, null);
        room.setPasscode(entity.getPasscode());
        activeRooms.put(roomId, room);
        log.info("Created watch party room [{}] with initial video [{}]", roomId, videoId);
        return room;
    }

    public Room createRoom(String requestedRoomId, String name, String creatorUsername, String initialVideoId) {
        return createRoom(requestedRoomId, name, creatorUsername, initialVideoId, null);
    }

    /**
     * Retrieves an existing room from memory or SQL database.
     */
    public Room getOrCreateRoom(String roomId, String username) {
        if (roomId == null || roomId.trim().isEmpty()) {
            return null;
        }
        roomId = roomId.trim().toUpperCase();

        // 1. Check in-memory active rooms
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room;
        }

        // 2. Fallback to SQL database
        Optional<RoomEntity> entityOpt = roomRepository.findByRoomId(roomId);
        if (entityOpt.isPresent()) {
            RoomEntity entity = entityOpt.get();
            room = new Room(entity.getRoomId(), entity.getName(), entity.getCurrentVideoId(), null);
            try {
                if (entity.getPlayState() != null) {
                    room.setPlayState(PlayState.valueOf(entity.getPlayState()));
                }
            } catch (Exception ignored) {
            }
            room.setCurrentTime(entity.getCurrentTime());
            activeRooms.put(roomId, room);
            log.info("Loaded room [{}] from SQL database", roomId);
            return room;
        }

        // 3. Auto-create if not found
        return createRoom(roomId, "Party " + roomId, username, "dQw4w9WgXcQ");
    }

    public Room getRoom(String roomId) {
        if (roomId == null) return null;
        String cleanId = roomId.trim().toUpperCase();
        Room room = activeRooms.get(cleanId);
        if (room == null) {
            return getOrCreateRoom(cleanId, "Host");
        }
        return room;
    }

    public List<RoomEntity> getAllPersistedRooms() {
        return roomRepository.findTop20ByOrderByUpdatedAtDesc();
    }

    /**
     * Adds a participant to a room.
     */
    public Participant joinRoom(String roomId, String participantId, String username) {
        Room room = getOrCreateRoom(roomId != null ? roomId.trim().toUpperCase() : null, username);
        if (room == null) {
            return null;
        }

        boolean isFirstUser = room.getParticipants().isEmpty();
        Role assignedRole = isFirstUser ? Role.HOST : Role.PARTICIPANT;

        Participant participant = new Participant(participantId, username, assignedRole);
        room.addParticipant(participant);
        log.info("User [{}] ({}) joined room [{}] with role [{}]", username, participantId, roomId, assignedRole);
        return participant;
    }

    /**
     * Removes a participant from a room.
     */
    public Participant leaveRoom(String roomId, String participantId) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            Participant removed = room.removeParticipant(participantId);
            if (removed != null) {
                log.info("User [{}] left room [{}]", removed.getUsername(), roomId);
            }
            return removed;
        }
        return null;
    }

    /**
     * RBAC verification: Checks if user has playback control privileges.
     */
    public boolean canControlPlayback(String roomId, String participantId) {
        Room room = activeRooms.get(roomId);
        if (room == null) return false;
        Participant p = room.getParticipant(participantId);
        return p != null && p.getRole().canControlPlayback();
    }

    /**
     * RBAC verification: Checks if user is Host.
     */
    public boolean isHost(String roomId, String participantId) {
        Room room = activeRooms.get(roomId);
        if (room == null) return false;
        Participant p = room.getParticipant(participantId);
        return p != null && p.getRole().canManageRoom();
    }

    /**
     * Play action: updates room state.
     */
    public boolean play(String roomId, String participantId, Double time) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            if (time != null) {
                room.setCurrentTime(time);
            }
            room.setPlayState(PlayState.PLAYING);
            syncRoomToDb(room);
            return true;
        }
        return false;
    }

    /**
     * Pause action: updates room state.
     */
    public boolean pause(String roomId, String participantId, Double time) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            if (time != null) {
                room.setCurrentTime(time);
            }
            room.setPlayState(PlayState.PAUSED);
            syncRoomToDb(room);
            return true;
        }
        return false;
    }

    /**
     * Seek action: updates room time position.
     */
    public boolean seek(String roomId, String participantId, double time) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            room.setCurrentTime(time);
            syncRoomToDb(room);
            return true;
        }
        return false;
    }

    /**
     * Change video action.
     */
    public boolean changeVideo(String roomId, String participantId, String rawVideoInput) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            String videoId = extractVideoId(rawVideoInput);
            room.setVideoId(videoId);
            room.setPlayState(PlayState.PAUSED);
            syncRoomToDb(room);
            return true;
        }
        return false;
    }

    /**
     * Role assignment by Host.
     */
    public boolean assignRole(String roomId, String hostParticipantId, String targetUserId, Role newRole) {
        if (!isHost(roomId, hostParticipantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.assignRole(targetUserId, newRole);
        }
        return false;
    }

    /**
     * Remove / Kick participant by Host.
     */
    public boolean removeParticipant(String roomId, String hostParticipantId, String targetUserId) {
        if (!isHost(roomId, hostParticipantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            Participant removed = room.removeParticipant(targetUserId);
            return removed != null;
        }
        return false;
    }

    /**
     * Transfer Host privileges to another participant.
     */
    public boolean transferHost(String roomId, String currentHostId, String targetUserId) {
        if (!isHost(roomId, currentHostId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.transferHost(currentHostId, targetUserId);
        }
        return false;
    }

    /**
     * Shared Video Queue / Playlist Operations
     */
    public boolean addToQueue(String roomId, String videoId, String title, String addedBy) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            String extractedId = extractVideoId(videoId);
            room.addToPlaylist(new com.watchparty.model.QueueItem(extractedId, title, addedBy));
            return true;
        }
        return false;
    }

    public boolean removeFromQueue(String roomId, String queueItemId) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.removeFromPlaylist(queueItemId);
        }
        return false;
    }

    public boolean playQueueItem(String roomId, String participantId, String queueItemId) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            for (com.watchparty.model.QueueItem item : room.getPlaylist()) {
                if (item.getId().equals(queueItemId)) {
                    room.removeFromPlaylist(queueItemId);
                    room.setVideoId(item.getVideoId());
                    room.setPlayState(PlayState.PLAYING);
                    syncRoomToDb(room);
                    return true;
                }
            }
        }
        return false;
    }

    public boolean changeSpeed(String roomId, String participantId, double speed) {
        if (!canControlPlayback(roomId, participantId)) {
            return false;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            room.setPlaybackSpeed(speed);
            syncRoomToDb(room);
            return true;
        }
        return false;
    }

    public boolean setHandRaised(String roomId, String participantId, boolean raised) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            Participant p = room.getParticipant(participantId);
            if (p != null) {
                p.setHandRaised(raised);
                return true;
            }
        }
        return false;
    }

    public com.watchparty.model.Poll createPoll(String roomId, String userId, String question, List<String> options) {
        if (!canControlPlayback(roomId, userId)) {
            return null;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            Participant p = room.getParticipant(userId);
            String creatorName = p != null ? p.getUsername() : "Host";
            return room.createPoll(question, options, userId, creatorName);
        }
        return null;
    }

    public boolean votePoll(String roomId, String userId, String pollId, int optionIndex) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.votePoll(pollId, optionIndex, userId);
        }
        return false;
    }

    public com.watchparty.model.Poll endPoll(String roomId, String userId) {
        if (!canControlPlayback(roomId, userId)) {
            return null;
        }
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.endPoll();
        }
        return null;
    }

    public com.watchparty.model.Bookmark addBookmark(String roomId, String userId, double time, String title) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            Participant p = room.getParticipant(userId);
            String creatorName = p != null ? p.getUsername() : "Guest";
            return room.addBookmark(time, title, creatorName);
        }
        return null;
    }

    public boolean removeBookmark(String roomId, String userId, String bookmarkId) {
        Room room = activeRooms.get(roomId);
        if (room != null) {
            return room.removeBookmark(bookmarkId);
        }
        return false;
    }

    /**
     * Chat message persistence.
     */
    @Transactional
    public ChatMessageEntity saveChatMessage(String roomId, String senderId, String senderName, String senderRole, String message) {
        ChatMessageEntity chat = new ChatMessageEntity(roomId, senderId, senderName, senderRole, message);
        return chatMessageRepository.save(chat);
    }

    public List<ChatMessageEntity> getChatHistory(String roomId) {
        String cleanId = (roomId != null) ? roomId.trim().toUpperCase() : "";
        return chatMessageRepository.findTop50ByRoomIdOrderByTimestampAsc(cleanId);
    }

    @Transactional
    public void syncRoomToDb(Room room) {
        try {
            Optional<RoomEntity> opt = roomRepository.findByRoomId(room.getRoomId());
            RoomEntity entity = opt.orElseGet(() -> new RoomEntity(room.getRoomId(), room.getName(), "system", room.getVideoId()));
            entity.setCurrentVideoId(room.getVideoId());
            entity.setPlayState(room.getPlayState().name());
            entity.setCurrentTime(room.getCalculatedCurrentTime());
            entity.setUpdatedAt(Instant.now());
            roomRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to sync room [{}] to SQL DB: {}", room.getRoomId(), e.getMessage());
        }
    }

    /**
     * Generates a 6-character room code (e.g. PARTY-492 or alphanumeric).
     */
    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
    private static final java.util.regex.Pattern YOUTUBE_REGEX = java.util.regex.Pattern.compile(

            "(?:youtu\\.be/|youtube(?:-nocookie)?\\.com/(?:embed/|v/|shorts/|live/|watch\\?v=|watch\\?.+&v=))([a-zA-Z0-9_-]{11})",
            java.util.regex.Pattern.CASE_INSENSITIVE
    );

    private static final java.util.regex.Pattern IFRAME_SRC_REGEX = java.util.regex.Pattern.compile(
            "<iframe[^>]*\\s+src=[\"']([^\"']+)[\"']",
            java.util.regex.Pattern.CASE_INSENSITIVE
    );

    /**
     * Extracts YouTube Video ID from full URLs, HTML <iframe> embed codes, or returns raw string if already ID.
     */
    public static String extractVideoId(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "dQw4w9WgXcQ";
        }
        String trimmed = input.trim();
        if (trimmed.matches("^[a-zA-Z0-9_-]{11}$")) {
            return trimmed;
        }

        // If an HTML <iframe> tag was provided, extract the src URL
        java.util.regex.Matcher iframeMatcher = IFRAME_SRC_REGEX.matcher(trimmed);
        if (iframeMatcher.find()) {
            trimmed = iframeMatcher.group(1);
        }

        java.util.regex.Matcher matcher = YOUTUBE_REGEX.matcher(trimmed);
        if (matcher.find()) {
            return matcher.group(1);
        }

        // Fallback for query param or path
        java.util.regex.Matcher fallback = java.util.regex.Pattern.compile("(?:embed/|v=|v/)([a-zA-Z0-9_-]{11})").matcher(trimmed);
        if (fallback.find()) {
            return fallback.group(1);
        }

        return trimmed;
    }
}
