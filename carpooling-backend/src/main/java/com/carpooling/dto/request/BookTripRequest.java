package com.carpooling.dto.request;

import lombok.Data;

@Data
public class BookTripRequest {
    private Double pickupLat;
    private Double pickupLng;
    private String pickupLabel;
    private Double dropoffLat;
    private Double dropoffLng;
    private String dropoffLabel;
}
