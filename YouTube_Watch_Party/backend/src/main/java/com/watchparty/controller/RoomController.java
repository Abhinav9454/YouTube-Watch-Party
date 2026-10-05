package com.watchparty.controller;

import com.watchparty.dto.CreateRoomRequest;
import com.watchparty.dto.RoomResponse;
import com.watchparty.model.Room;
import com.watchparty.model.entity.ChatMessageEntity;
import com.watchparty.model.entity.RoomEntity;
import com.watchparty.service.RoomManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RoomController {

    private final RoomManager roomManager;

    public RoomController(RoomManager roomManager) {
        this.roomManager = roomManager;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "YouTube Watch Party Backend",
                "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/rooms")
    public ResponseEntity<RoomResponse> createRoom(@RequestBody(required = false) CreateRoomRequest request) {
        String name = request != null ? request.getName() : null;
        String creator = request != null ? request.getCreatorUsername() : "Host";
        String videoId = request != null ? request.getInitialVideoId() : null;
        String passcode = request != null ? request.getPasscode() : null;

        Room room = roomManager.createRoom(null, name, creator, videoId, passcode);
        return ResponseEntity.ok(new RoomResponse(
                room.getRoomId(),
                room.getName(),
                room.getVideoId(),
                room.getPlayState(),
                room.getCurrentTime(),
                room.getPlaybackSpeed(),
                room.getPasscode() != null && !room.getPasscode().isEmpty(),
                room.getHostId(),
                room.getParticipants(),
                room.getPlaylist()
        ));
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<RoomEntity>> listRooms() {
        return ResponseEntity.ok(roomManager.getAllPersistedRooms());
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String roomId) {
        Room room = roomManager.getRoom(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new RoomResponse(
                room.getRoomId(),
                room.getName(),
                room.getVideoId(),
                room.getPlayState(),
                room.getCurrentTime(),
                room.getPlaybackSpeed(),
                room.getPasscode() != null && !room.getPasscode().isEmpty(),
                room.getHostId(),
                room.getParticipants(),
                room.getPlaylist()
        ));
    }

    @GetMapping("/rooms/{roomId}/chat")
    public ResponseEntity<List<ChatMessageEntity>> getChatHistory(@PathVariable String roomId) {
        return ResponseEntity.ok(roomManager.getChatHistory(roomId));
    }
}
