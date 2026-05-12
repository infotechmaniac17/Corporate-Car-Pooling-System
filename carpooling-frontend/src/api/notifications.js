import api from './client';

export const getMyNotifications = () => api.get('/notifications/my');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');
