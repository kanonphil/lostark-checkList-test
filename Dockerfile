# 1. 빌드 스테이지
FROM maven:3.8.5-openjdk-17 AS build
COPY . .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# 2. 실행 스테이지 (이미지 주소를 수정했습니다)
FROM eclipse-temurin:17-jdk-alpine
COPY --from=build /target/*.jar app.jar
EXPOSE 8080

# Render 환경에 맞춰 메모리 설정 유지
ENTRYPOINT ["java", "-Xmx384m", "-Xms384m", "-jar", "/app.jar", "--server.port=8080"]