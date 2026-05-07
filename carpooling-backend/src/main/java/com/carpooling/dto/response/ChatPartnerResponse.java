package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatPartnerResponse {
    private Long userId;
    private String name;
    private String phone;
    private String role; // "DRIVER" or "PASSENGER"
}
