# Multi-stage Dockerfile for YouTube Watch Party Backend (Render Cloud Build)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY YouTube_Watch_Party/backend/pom.xml ./
COPY YouTube_Watch_Party/backend/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /build/target/youtube-watch-party-backend-1.0.0.jar app.jar

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3", "-jar", "app.jar"]
