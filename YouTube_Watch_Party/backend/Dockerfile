# Multi-stage Dockerfile for Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Constrain Maven heap and use low-overhead SerialGC for cloud build environments (e.g. Render 512MB RAM)
ENV MAVEN_OPTS="-Xms128m -Xmx384m -XX:+UseSerialGC"

COPY pom.xml ./
COPY src ./src

# Build jar cleanly without downloading progress floods to avoid buffer saturation & memory spikes
RUN mvn clean package -DskipTests -B --no-transfer-progress

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /build/target/youtube-watch-party-backend-1.0.0.jar app.jar

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 8080

ENTRYPOINT ["java", "-Xms128m", "-Xmx384m", "-XX:+UseSerialGC", "-Djava.security.egd=file:/dev/./urandom", "-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3", "-jar", "app.jar"]

