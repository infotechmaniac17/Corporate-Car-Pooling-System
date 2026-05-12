import api from './client';

export const getLatest = (rideId) =>
  api.get(`/tracking/${rideId}/latest`);

export const sendPing = (rideId, lat, lng) =>
  api.post('/tracking/ping', { rideId, lat, lng });
