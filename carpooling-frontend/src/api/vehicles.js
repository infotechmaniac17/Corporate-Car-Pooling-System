import api from './client';

export const getMyVehicles = () => api.get('/vehicles/my');
export const addVehicle    = (data) => api.post('/vehicles', data);
export const deleteVehicle = (vehicleId) => api.delete(`/vehicles/${vehicleId}`);
