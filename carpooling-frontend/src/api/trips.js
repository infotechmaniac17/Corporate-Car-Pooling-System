import api from './client';

export const getMyPassengerTrips = () => api.get('/trips/passenger/my');
export const getMyDriverTrips    = () => api.get('/trips/driver/my');
