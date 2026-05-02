import api from './client';

export const getMessages = (rideId) =>
  api.get(`/chat/ride/${rideId}`);

export const sendMessage = (data) =>
  api.post('/chat/send', data);

export const markRead = (rideId) =>
  api.patch(`/chat/ride/${rideId}/read`);
