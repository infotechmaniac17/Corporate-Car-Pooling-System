import api from './client';

export const findMatches = (data) =>
  api.post('/rides/match', data);
