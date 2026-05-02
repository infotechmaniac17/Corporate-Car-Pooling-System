import api from './client';

export const getMyRequests = () =>
  api.get('/rides/requests/my');

export const getDriverRequests = (rideId) =>
  api.get(`/rides/requests/ride/${rideId}`);

export const updateRequestStatus = (id, status) =>
  api.patch(`/rides/requests/${id}/status?status=${status}`);

export const createRequest = (data) =>
  api.post('/rides/requests', data);

export const getSchedule = (id) =>
  api.get(`/rides/schedules/driver/${id}`);

export const createSchedule = (data) =>
  api.post('/rides/schedules', data);
