import api from './client';

export const submitDriverRequest = (formData) =>
  api.post('/role-requests/driver', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const submitPassengerRequest = () =>
  api.post('/role-requests/passenger');

export const getMyRoleRequests = () =>
  api.get('/role-requests/me');

export const adminGetRoleRequests = (status = 'PENDING') =>
  api.get(`/admin/role-requests?status=${status}`);

export const adminApproveRequest = (id) =>
  api.post(`/admin/role-requests/${id}/approve`);

export const adminRejectRequest = (id, reason) =>
  api.post(`/admin/role-requests/${id}/reject`, { reason });
