import api from './client';

export const getMe = () =>
  api.get('/users/me/rides');

export const getGuardians = () =>
  api.get('/users/me/guardians');
