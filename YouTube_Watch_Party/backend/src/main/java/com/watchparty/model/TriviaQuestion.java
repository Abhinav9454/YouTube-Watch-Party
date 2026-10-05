package com.watchparty.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class TriviaQuestion {
    private String id;
    private String question;
    private List<String> options = new CopyOnWriteArrayList<>();
    private int correctIndex;
    private int durationSeconds = 15;
    private long startTime;
    private boolean active = true;
    private String creatorName;

    // userId -> option index selected
    private final Map<String, Integer> userAnswers = new ConcurrentHashMap<>();

    public TriviaQuestion() {
        this.id = UUID.randomUUID().toString();
        this.startTime = System.currentTimeMillis();
    }

    public TriviaQuestion(String question, List<String> options, int correctIndex, int durationSeconds, String creatorName) {
        this.id = UUID.randomUUID().toString();
        this.question = question;
        if (options != null) {
            this.options.addAll(options);
        }
        this.correctIndex = correctIndex;
        this.durationSeconds = durationSeconds > 0 ? durationSeconds : 15;
        this.startTime = System.currentTimeMillis();
        this.active = true;
        this.creatorName = creatorName;
    }

    public boolean submitAnswer(String userId, int optionIndex) {
        if (!active) return false;
        if (optionIndex < 0 || optionIndex >= options.size()) return false;
        userAnswers.put(userId, optionIndex);
        return true;
    }

    public boolean isUserCorrect(String userId) {
        Integer ans = userAnswers.get(userId);
        return ans != null && ans == correctIndex;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public int getCorrectIndex() {
        return correctIndex;
    }

    public void setCorrectIndex(int correctIndex) {
        this.correctIndex = correctIndex;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public Map<String, Integer> getUserAnswers() {
        return userAnswers;
    }

    public int getAnswerCount() {
        return userAnswers.size();
    }
}
