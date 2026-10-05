# Multi-stage Dockerfile for Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml ./
COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /build/target/youtube-watch-party-backend-1.0.0.jar app.jar

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3", "-jar", "app.jar"]
