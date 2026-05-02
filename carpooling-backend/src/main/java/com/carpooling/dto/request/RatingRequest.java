package com.carpooling.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RatingRequest {
    @NotNull
    private Long givenToId;

    @NotNull @Min(1) @Max(5)
    private Short score;

    private String comment;
}
