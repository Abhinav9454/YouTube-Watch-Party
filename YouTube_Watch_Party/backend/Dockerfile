FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy ready-to-run precompiled jar
COPY target/youtube-watch-party-backend-1.0.0.jar app.jar

# Persistent storage for H2 SQL database
RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
