package com.carpooling.service;

import com.carpooling.dto.request.DriverRoleRequestDto;
import com.carpooling.dto.response.RoleRequestResponse;
import com.carpooling.enums.VerificationStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface RoleRequestService {

    RoleRequestResponse submitDriverRequest(Long userId, DriverRoleRequestDto dto,
                                            MultipartFile licenseDoc,
                                            MultipartFile idProofDoc,
                                            MultipartFile rcDoc,
                                            MultipartFile insuranceDoc);

    void submitPassengerRequest(Long userId);

    List<RoleRequestResponse> listByStatus(VerificationStatus status, Long adminId);

    List<RoleRequestResponse> getMyRequests(Long userId);

    RoleRequestResponse approve(Long requestId, Long adminId);

    RoleRequestResponse reject(Long requestId, Long adminId, String reason);
}
