package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.entity.RefreshToken;
import com.carpooling.entity.User;
import com.carpooling.repository.RefreshTokenRepository;
import com.carpooling.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final long REFRESH_EXPIRY_DAYS = 30;

    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        return refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(OffsetDateTime.now().plusDays(REFRESH_EXPIRY_DAYS))
                .revoked(false)
                .build());
    }

    @Override
    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken rt = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));
        if (Boolean.TRUE.equals(rt.getRevoked()) || rt.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Refresh token expired or revoked");
        }
        return rt;
    }

    @Override
    @Transactional
    public void revokeByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
