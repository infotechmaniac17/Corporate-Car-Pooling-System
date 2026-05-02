import api from './client';

export const submit = (data) =>
  api.post('/ratings', data);

export const getUserRatings = (userId) =>
  api.get(`/ratings/user/${userId}`);
