package com.lostark.raidchecker.service;

import com.lostark.raidchecker.dto.LostArkCharacterResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
@RequiredArgsConstructor
public class LostArkApiService {

  @Value("${lostark.api.base-url}")
  private String baseUrl;

  @Value("${lostark.api.key}")
  private String apiKey;

  public LostArkCharacterResponse getCharacterInfo(String characterName) {
    RestTemplate restTemplate = new RestTemplate();

    URI uri = UriComponentsBuilder
            .fromHttpUrl(baseUrl)
            .path("/armories/characters/{characterName}/profiles")
            .buildAndExpand(characterName)
            .encode()
            .toUri();

    HttpHeaders headers = new HttpHeaders();
    headers.set("authorization", "bearer " + apiKey);
    headers.set("accept", "application/json");

    HttpEntity<String> entity = new HttpEntity<>(headers);

    try {
      ResponseEntity<LostArkCharacterResponse> response = restTemplate.exchange(
              uri,
              HttpMethod.GET,
              entity,
              LostArkCharacterResponse.class
      );
      return response.getBody();
    } catch (Exception e) {
      throw new RuntimeException("캐릭터 정보를 가져올 수 없습니다: " + e.getMessage());
    }
  }
}