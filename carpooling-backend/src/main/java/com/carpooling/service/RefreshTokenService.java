package com.carpooling.service;

import com.carpooling.entity.RefreshToken;
import com.carpooling.entity.User;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken verifyRefreshToken(String token);
    void revokeByUser(User user);
}
