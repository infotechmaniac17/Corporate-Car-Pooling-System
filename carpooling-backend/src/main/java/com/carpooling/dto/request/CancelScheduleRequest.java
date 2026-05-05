package com.carpooling.dto.request;

import com.carpooling.enums.CancellationReason;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CancelScheduleRequest {

    @NotNull(message = "Cancellation reason is required")
    private CancellationReason reasonCode;

    private String note;
}
