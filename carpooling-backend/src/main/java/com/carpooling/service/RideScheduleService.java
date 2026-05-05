package com.carpooling.service;

import com.carpooling.dto.request.CancelScheduleRequest;
import com.carpooling.dto.request.CreateRideScheduleRequest;
import com.carpooling.dto.response.RideScheduleResponse;
import com.carpooling.enums.ScheduleStatus;

import java.util.List;

public interface RideScheduleService {
    RideScheduleResponse createSchedule(Long driverId, CreateRideScheduleRequest request);
    RideScheduleResponse getSchedule(Long scheduleId);
    List<RideScheduleResponse> getDriverSchedules(Long driverId);
    RideScheduleResponse updateStatus(Long scheduleId, Long driverId, ScheduleStatus newStatus);
    void cancelSchedule(Long scheduleId, Long driverId, CancelScheduleRequest request);
}
