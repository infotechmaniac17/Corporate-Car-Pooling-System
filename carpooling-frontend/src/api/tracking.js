import api from './client';

export const getLatest = (rideId) =>
  api.get(`/tracking/${rideId}/latest`);
