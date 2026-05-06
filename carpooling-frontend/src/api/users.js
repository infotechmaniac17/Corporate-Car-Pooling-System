import api from './client';

export const getMe = () =>
  api.get('/users/me/rides');

export const getUser = (userId) =>
  api.get(`/users/${userId}`);

export const getGuardians = () =>
  api.get('/users/me/guardians');
