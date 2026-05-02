package com.carpooling.repository;

import com.carpooling.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByGivenToId(Long userId);
    List<Rating> findByGivenById(Long userId);
    boolean existsByGivenByIdAndGivenToId(Long givenById, Long givenToId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.givenTo.id = :userId")
    Double calculateAverageRating(@Param("userId") Long userId);
}
