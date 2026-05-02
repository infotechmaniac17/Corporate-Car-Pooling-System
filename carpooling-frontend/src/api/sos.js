import api from './client';

export const trigger = (rideId) =>
  api.post('/sos/trigger', { rideId });

export const getByRide = (rideId) =>
  api.get(`/sos/ride/${rideId}`);
