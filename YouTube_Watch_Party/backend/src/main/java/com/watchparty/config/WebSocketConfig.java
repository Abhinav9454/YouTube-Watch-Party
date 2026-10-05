package com.watchparty.config;

import com.watchparty.websocket.WatchPartyWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WatchPartyWebSocketHandler watchPartyWebSocketHandler;

    public WebSocketConfig(WatchPartyWebSocketHandler watchPartyWebSocketHandler) {
        this.watchPartyWebSocketHandler = watchPartyWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(watchPartyWebSocketHandler, "/ws/party")
                .setAllowedOrigins("*");
    }
}
