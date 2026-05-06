import api from './client';

export const getMe = () =>
  api.get('/users/me/rides');

export const getUser = (userId) =>
  api.get(`/users/${userId}`);

export const updateMe = (data) =>
  api.patch('/users/me', data);

export const getProfileStats = () =>
  api.get('/users/me/profile-stats');

export const getGuardians = () =>
  api.get('/users/me/guardians');
