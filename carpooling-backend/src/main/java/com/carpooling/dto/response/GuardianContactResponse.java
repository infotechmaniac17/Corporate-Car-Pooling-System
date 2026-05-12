package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class GuardianContactResponse {
    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String relation;
    private String email;
}
