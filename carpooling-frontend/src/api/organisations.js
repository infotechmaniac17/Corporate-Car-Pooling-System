import api from './client';

export const getAllOrganisations = () =>
  api.get('/organisations');

export const getOrganisation = (id) =>
  api.get(`/organisations/${id}`);

export const getOrgOffices = (orgId) =>
  api.get(`/organisations/${orgId}/offices`);
