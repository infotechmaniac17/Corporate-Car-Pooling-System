package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.dto.response.UserActivityResponse;
import com.carpooling.enums.RequestStatus;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.RideRequestRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserActivityServiceImpl implements UserActivityService {

    private final RideRequestRepository rideRequestRepository;
    private final RideScheduleRepository rideScheduleRepository;

    private static final List<RequestStatus> OPEN_REQUEST_STATUSES =
            List.of(RequestStatus.PENDING, RequestStatus.ACCEPTED);

    private static final List<ScheduleStatus> ACTIVE_SCHEDULE_STATUSES =
            List.of(ScheduleStatus.CREATED, ScheduleStatus.ACTIVE, ScheduleStatus.STARTED);

    @Override
    public UserActivityResponse getActivity(Long userId) {
        boolean hasOpenRequest = rideRequestRepository
                .existsByPassengerIdAndStatusIn(userId, OPEN_REQUEST_STATUSES);

        boolean hasActiveSchedule = rideScheduleRepository
                .existsByDriverIdAndStatusIn(userId, ACTIVE_SCHEDULE_STATUSES);

        boolean hasInProgressTrip = rideScheduleRepository
                .existsByDriverIdAndStatus(userId, ScheduleStatus.STARTED);

        return UserActivityResponse.builder()
                .hasOpenRequest(hasOpenRequest)
                .hasActiveSchedule(hasActiveSchedule)
                .hasInProgressTrip(hasInProgressTrip)
                .build();
    }

    @Override
    public void assertNoActiveSchedule(Long userId) {
        if (rideScheduleRepository.existsByDriverIdAndStatusIn(userId, ACTIVE_SCHEDULE_STATUSES)) {
            throw new BusinessException(
                    "Cannot request a ride while you have an active drive scheduled. Cancel or complete your drive first.",
                    HttpStatus.CONFLICT);
        }
    }

    @Override
    public void assertNoOpenRequest(Long userId) {
        if (rideRequestRepository.existsByPassengerIdAndStatusIn(userId, OPEN_REQUEST_STATUSES)) {
            throw new BusinessException(
                    "Cannot offer a ride while you have an open ride request as a passenger. Cancel your request first.",
                    HttpStatus.CONFLICT);
        }
    }
}
