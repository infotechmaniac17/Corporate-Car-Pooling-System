package com.carpooling.service;

import com.carpooling.dto.response.UserActivityResponse;

public interface UserActivityService {
    UserActivityResponse getActivity(Long userId);
    void assertNoActiveSchedule(Long userId);
    void assertNoOpenRequest(Long userId);
}
