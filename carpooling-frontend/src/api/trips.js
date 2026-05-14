import api from './client';

// Driver: publish a trip
export const publishTrip = (data) => api.post('/trips', data);

// Driver: my published trips (new model with seat counts)
export const getMyDriverTrips = () => api.get('/trips/driver/published');

// Driver: bookings for a specific trip
export const getTripBookings = (tripId) => api.get(`/trips/${tripId}/bookings`);

// Passenger: browse org feed
export const getTripFeed = (params = {}) => api.get('/trips/feed', { params });

// Passenger: trip detail
export const getTripById = (tripId) => api.get(`/trips/${tripId}`);

// Passenger: book a seat
export const bookTrip = (tripId, data = {}) => api.post(`/trips/${tripId}/book`, data);

// Passenger: cancel a booking
export const cancelBooking = (tripId, bookingId) =>
  api.delete(`/trips/${tripId}/bookings/${bookingId}`);

// Passenger: my bookings (new model)
export const getMyBookings = () => api.get('/trips/bookings/my');

// Legacy — kept for PassengerTripsScreen backward compat during transition
export const getMyPassengerTrips = () => api.get('/trips/passenger/my');
