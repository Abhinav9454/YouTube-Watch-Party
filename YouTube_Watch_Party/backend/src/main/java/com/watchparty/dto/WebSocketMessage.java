package com.watchparty.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.HashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WebSocketMessage {
    private String type;
    private Map<String, Object> payload = new HashMap<>();

    public WebSocketMessage() {
    }

    public WebSocketMessage(String type, Map<String, Object> payload) {
        this.type = type;
        this.payload = payload != null ? payload : new HashMap<>();
    }

    public static WebSocketMessage of(String type, Map<String, Object> payload) {
        return new WebSocketMessage(type, payload);
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }
}
