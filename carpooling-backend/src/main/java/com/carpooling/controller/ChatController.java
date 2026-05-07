package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.SendMessageRequest;
import com.carpooling.dto.response.ChatMessageResponse;
import com.carpooling.dto.response.ChatPartnerResponse;
import com.carpooling.entity.ChatMessage;
import com.carpooling.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            HttpServletRequest httpRequest) {
        Long senderId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(chatService.sendMessage(senderId, request)));
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getMessages(rideId)));
    }

    @PatchMapping("/ride/{rideId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        chatService.markMessagesRead(rideId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Messages marked as read", null));
    }

    @GetMapping("/ride/{rideId}/partners")
    public ResponseEntity<ApiResponse<List<ChatPartnerResponse>>> getPartners(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(chatService.getPartners(rideId, userId)));
    }

    @GetMapping("/ride/{rideId}/unread")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(chatService.getUnreadCount(rideId, userId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
