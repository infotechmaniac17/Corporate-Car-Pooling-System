import api from './client';

export const getMyRequests = () =>
  api.get('/rides/requests/my');

export const getDriverRequests = (rideId) =>
  api.get(`/rides/requests/ride/${rideId}`);

export const getAllDriverRequests = () =>
  api.get('/rides/requests/driver/my');

export const updateRequestStatus = (id, status) =>
  api.patch(`/rides/requests/${id}/status?status=${status}`);

export const createRequest = (data) =>
  api.post('/rides/requests', data);

export const cancelMyRequest = (requestId) =>
  api.delete(`/rides/requests/${requestId}`);

export const getSchedule = (id) =>
  api.get(`/rides/schedules/driver/${id}`);

export const createSchedule = (data) =>
  api.post('/rides/schedules', data);

// reasonCode: 'EMERGENCY' | 'VEHICLE_ISSUE' | 'PERSONAL' | 'OTHER', note: string (optional)
export const cancelSchedule = (scheduleId, reasonCode, note) =>
  api.delete(`/rides/schedules/${scheduleId}`, { data: { reasonCode, note } });
