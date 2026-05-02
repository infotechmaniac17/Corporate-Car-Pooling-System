package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class RatingResponse {
    private Long id;
    private Long givenById;
    private String givenByName;
    private Long givenToId;
    private String givenToName;
    private Short score;
    private String comment;
    private OffsetDateTime createdAt;
}
