import api from './client';

export const getAllOrganisations = () =>
  api.get('/organisations');

export const getOrganisation = (id) =>
  api.get(`/organisations/${id}`);
