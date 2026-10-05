package com.watchparty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WatchPartyApplication {

    public static void main(String[] args) {
        SpringApplication.run(WatchPartyApplication.class, args);
        System.out.println("==================================================");
        System.out.println("  YouTube Watch Party Backend is running!");
        System.out.println("  API URL: http://localhost:8080/api/health");
        System.out.println("  WebSocket URL: ws://localhost:8080/ws/party");
        System.out.println("  H2 SQL Console: http://localhost:8080/h2-console");
        System.out.println("==================================================");
    }
}
