import api from './client';

export const getMyActivity = () => api.get('/users/me/activity');
