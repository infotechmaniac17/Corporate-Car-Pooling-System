package com.carpooling.service;

import com.carpooling.dto.request.GuardianContactRequest;
import com.carpooling.dto.response.GuardianContactResponse;

import java.util.List;

public interface GuardianContactService {
    GuardianContactResponse addContact(Long userId, GuardianContactRequest request);
    List<GuardianContactResponse> getContacts(Long userId);
    void deleteContact(Long contactId, Long userId);
}
