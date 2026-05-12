import api from './client';

export const getMyGuardians = () => api.get('/users/me/guardians');
export const addGuardian = (data) => api.post('/users/me/guardians', data);
export const deleteGuardian = (id) => api.delete(`/users/me/guardians/${id}`);
