package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.GuardianContactRequest;
import com.carpooling.dto.response.GuardianContactResponse;
import com.carpooling.entity.GuardianContact;
import com.carpooling.entity.User;
import com.carpooling.repository.GuardianContactRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.GuardianContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GuardianContactServiceImpl implements GuardianContactService {

    private final GuardianContactRepository guardianContactRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public GuardianContactResponse addContact(Long userId, GuardianContactRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        GuardianContact contact = guardianContactRepository.save(GuardianContact.builder()
                .user(user)
                .name(request.getName())
                .phone(request.getPhone())
                .relation(request.getRelation())
                .build());

        return toResponse(contact);
    }

    @Override
    public List<GuardianContactResponse> getContacts(Long userId) {
        return guardianContactRepository.findByUserId(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteContact(Long contactId, Long userId) {
        GuardianContact contact = guardianContactRepository.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("GuardianContact", contactId));
        if (!contact.getUser().getId().equals(userId)) {
            throw new BusinessException("Not authorized to delete this contact", HttpStatus.FORBIDDEN);
        }
        guardianContactRepository.delete(contact);
    }

    private GuardianContactResponse toResponse(GuardianContact c) {
        return GuardianContactResponse.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .name(c.getName())
                .phone(c.getPhone())
                .relation(c.getRelation())
                .build();
    }
}
