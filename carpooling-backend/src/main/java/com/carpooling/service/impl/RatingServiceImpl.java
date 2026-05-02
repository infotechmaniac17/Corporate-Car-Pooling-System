package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.RatingRequest;
import com.carpooling.dto.response.RatingResponse;
import com.carpooling.entity.Rating;
import com.carpooling.entity.User;
import com.carpooling.repository.RatingRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Rating submitRating(Long givenById, RatingRequest request) {
        if (givenById.equals(request.getGivenToId())) {
            throw new BusinessException("Cannot rate yourself");
        }
        if (ratingRepository.existsByGivenByIdAndGivenToId(givenById, request.getGivenToId())) {
            throw new BusinessException("Already rated this user");
        }

        User givenBy = userRepository.findById(givenById)
                .orElseThrow(() -> new ResourceNotFoundException("User", givenById));
        User givenTo = userRepository.findById(request.getGivenToId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getGivenToId()));

        Rating rating = ratingRepository.save(Rating.builder()
                .givenBy(givenBy)
                .givenTo(givenTo)
                .score(request.getScore())
                .comment(request.getComment())
                .build());

        recomputeAverageRating(givenTo);

        return rating;
    }

    @Override
    public List<RatingResponse> getRatingsForUser(Long userId) {
        return ratingRepository.findByGivenToId(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<RatingResponse> getMyGivenRatings(Long userId) {
        return ratingRepository.findByGivenById(userId)
                .stream().map(this::toResponse).toList();
    }

    private void recomputeAverageRating(User user) {
        Double avg = ratingRepository.calculateAverageRating(user.getId());
        if (avg != null) {
            user.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
            userRepository.save(user);
        }
    }

    private RatingResponse toResponse(Rating r) {
        return RatingResponse.builder()
                .id(r.getId())
                .givenById(r.getGivenBy().getId())
                .givenByName(r.getGivenBy().getName())
                .givenToId(r.getGivenTo().getId())
                .givenToName(r.getGivenTo().getName())
                .score(r.getScore())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
