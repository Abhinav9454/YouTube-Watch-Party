package com.watchparty.model;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * OOP Domain Model representing an active Watch Party Room.
 * Encapsulates playback state, participants, and role enforcement.
 */
public class Room {
    private final String roomId;
    private String name;
    private String videoId;
    private PlayState playState;
    private double currentTime; // in seconds
    private double playbackSpeed = 1.0;
    private String passcode; // optional room passcode
    private long lastUpdatedTimestamp; // epoch millis
    private String hostId;
    private final Map<String, Participant> participants = new ConcurrentHashMap<>();
    private final List<QueueItem> playlist = new CopyOnWriteArrayList<>();
    private final List<Bookmark> bookmarks = new CopyOnWriteArrayList<>();
    private Poll activePoll;
    private TriviaQuestion activeTrivia;
    private final Map<String, Integer> userScores = new ConcurrentHashMap<>();

    public Room(String roomId, String name, String videoId, String hostId) {
        this.roomId = roomId;
        this.name = name;
        this.videoId = videoId != null && !videoId.trim().isEmpty() ? videoId : "dQw4w9WgXcQ";
        this.playState = PlayState.PAUSED;
        this.currentTime = 0.0;
        this.lastUpdatedTimestamp = System.currentTimeMillis();
        this.hostId = hostId;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
        this.currentTime = 0.0;
        this.lastUpdatedTimestamp = System.currentTimeMillis();
    }

    public PlayState getPlayState() {
        return playState;
    }

    public void setPlayState(PlayState playState) {
        // compute elapsed time before state change
        this.currentTime = getCalculatedCurrentTime();
        this.playState = playState;
        this.lastUpdatedTimestamp = System.currentTimeMillis();
    }

    public double getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(double currentTime) {
        this.currentTime = Math.max(0.0, currentTime);
        this.lastUpdatedTimestamp = System.currentTimeMillis();
    }

    public long getLastUpdatedTimestamp() {
        return lastUpdatedTimestamp;
    }

    /**
     * Calculates the estimated current playback position accounting for elapsed time while playing.
     */
    public double getCalculatedCurrentTime() {
        if (playState == PlayState.PLAYING) {
            long elapsedMillis = System.currentTimeMillis() - lastUpdatedTimestamp;
            return currentTime + ((elapsedMillis / 1000.0) * playbackSpeed);
        }
        return currentTime;
    }

    public String getHostId() {
        return hostId;
    }

    public void setHostId(String hostId) {
        this.hostId = hostId;
    }

    public Collection<Participant> getParticipants() {
        return participants.values();
    }

    public Participant getParticipant(String participantId) {
        return participants.get(participantId);
    }

    public void addParticipant(Participant participant) {
        // If this is the designated host or first participant, ensure role is HOST
        if (participants.isEmpty() || participant.getId().equals(hostId)) {
            participant.setRole(Role.HOST);
            this.hostId = participant.getId();
        } else if (participant.getRole() == null) {
            participant.setRole(Role.PARTICIPANT);
        }
        participants.put(participant.getId(), participant);
    }

    public Participant removeParticipant(String participantId) {
        Participant removed = participants.remove(participantId);
        // If the removed participant was the host, reassign host to another participant if available
        if (participantId != null && participantId.equals(hostId)) {
            var it = participants.values().iterator();
            if (it.hasNext()) {
                Participant newHost = it.next();
                if (newHost != null) {
                    newHost.setRole(Role.HOST);
                    this.hostId = newHost.getId();
                }
            } else {
                this.hostId = null;
            }
        }
        return removed;
    }

    public boolean assignRole(String targetUserId, Role newRole) {
        Participant target = participants.get(targetUserId);
        if (target != null) {
            target.setRole(newRole);
            return true;
        }
        return false;
    }

    public boolean transferHost(String currentHostId, String newHostId) {
        if (!currentHostId.equals(this.hostId)) {
            return false;
        }
        Participant newHost = participants.get(newHostId);
        Participant oldHost = participants.get(currentHostId);
        if (newHost != null && oldHost != null) {
            newHost.setRole(Role.HOST);
            oldHost.setRole(Role.MODERATOR);
            this.hostId = newHostId;
            return true;
        }
        return false;
    }

    public boolean isEmpty() {
        return participants.isEmpty();
    }

    public double getPlaybackSpeed() {
        return playbackSpeed;
    }

    public void setPlaybackSpeed(double playbackSpeed) {
        this.playbackSpeed = playbackSpeed;
        this.lastUpdatedTimestamp = System.currentTimeMillis();
    }

    public String getPasscode() {
        return passcode;
    }

    public void setPasscode(String passcode) {
        this.passcode = passcode;
    }

    public boolean validatePasscode(String input) {
        if (this.passcode == null || this.passcode.trim().isEmpty()) {
            return true;
        }
        return this.passcode.trim().equals(input != null ? input.trim() : "");
    }

    public List<QueueItem> getPlaylist() {
        return playlist;
    }

    public void addToPlaylist(QueueItem item) {
        playlist.add(item);
    }

    public boolean removeFromPlaylist(String itemId) {
        return playlist.removeIf(item -> item.getId().equals(itemId));
    }

    public QueueItem playNextPlaylistItem() {
        if (!playlist.isEmpty()) {
            QueueItem next = playlist.remove(0);
            setVideoId(next.getVideoId());
            setPlayState(PlayState.PLAYING);
            return next;
        }
        return null;
    }

    public Poll getActivePoll() {
        return activePoll;
    }

    public void setActivePoll(Poll activePoll) {
        this.activePoll = activePoll;
    }

    public Poll createPoll(String question, List<String> options, String creatorId, String creatorName) {
        this.activePoll = new Poll(question, options, creatorId, creatorName);
        return this.activePoll;
    }

    public boolean votePoll(String pollId, int optionIndex, String userId) {
        if (this.activePoll != null && this.activePoll.getId().equals(pollId)) {
            return this.activePoll.vote(userId, optionIndex);
        }
        return false;
    }

    public Poll endPoll() {
        if (this.activePoll != null) {
            this.activePoll.setActive(false);
            Poll finished = this.activePoll;
            this.activePoll = null;
            return finished;
        }
        return null;
    }

    public List<Bookmark> getBookmarks() {
        return bookmarks;
    }

    public Bookmark addBookmark(double time, String title, String createdBy) {
        Bookmark bm = new Bookmark(time, title, createdBy);
        bookmarks.add(bm);
        return bm;
    }

    public boolean removeBookmark(String bookmarkId) {
        return bookmarks.removeIf(b -> b.getId().equals(bookmarkId));
    }

    public TriviaQuestion getActiveTrivia() {
        return activeTrivia;
    }

    public void setActiveTrivia(TriviaQuestion activeTrivia) {
        this.activeTrivia = activeTrivia;
    }

    public Map<String, Integer> getUserScores() {
        return userScores;
    }

    public TriviaQuestion startTrivia(String question, List<String> options, int correctIndex, int duration, String creatorName) {
        this.activeTrivia = new TriviaQuestion(question, options, correctIndex, duration, creatorName);
        return this.activeTrivia;
    }

    public boolean answerTrivia(String userId, int optionIndex) {
        if (this.activeTrivia != null && this.activeTrivia.isActive()) {
            return this.activeTrivia.submitAnswer(userId, optionIndex);
        }
        return false;
    }

    private Map<String, Object> activeSubtitles;

    public Map<String, Object> getActiveSubtitles() {
        return activeSubtitles;
    }

    public void setActiveSubtitles(Map<String, Object> activeSubtitles) {
        this.activeSubtitles = activeSubtitles;
    }

    public Map<String, Object> endTrivia() {
        if (this.activeTrivia == null) return null;

        this.activeTrivia.setActive(false);
        int correctIndex = this.activeTrivia.getCorrectIndex();

        // Award points to correct answers (+100 XP)
        for (Map.Entry<String, Integer> entry : this.activeTrivia.getUserAnswers().entrySet()) {
            String uId = entry.getKey();
            int ans = entry.getValue();
            if (ans == correctIndex) {
                userScores.merge(uId, 100, Integer::sum);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("triviaId", this.activeTrivia.getId());
        result.put("question", this.activeTrivia.getQuestion());
        result.put("correctIndex", correctIndex);
        result.put("correctOption", (correctIndex >= 0 && correctIndex < this.activeTrivia.getOptions().size()) ? this.activeTrivia.getOptions().get(correctIndex) : "");
        result.put("userAnswers", this.activeTrivia.getUserAnswers());
        result.put("leaderboard", userScores);

        this.activeTrivia = null;
        return result;
    }
}
