package com.carpooling.service;

import com.carpooling.dto.request.RatingRequest;
import com.carpooling.dto.response.RatingResponse;
import com.carpooling.entity.Rating;

import java.util.List;

public interface RatingService {
    Rating submitRating(Long givenById, RatingRequest request);
    List<RatingResponse> getRatingsForUser(Long userId);
    List<RatingResponse> getMyGivenRatings(Long userId);
}
