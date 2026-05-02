package com.carpooling.service;

import com.carpooling.dto.request.RatingRequest;
import com.carpooling.entity.Rating;

public interface RatingService {
    Rating submitRating(Long givenById, RatingRequest request);
}
