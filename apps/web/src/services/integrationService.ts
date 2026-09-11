import api from './api';

export const integrationService = {
  getConnections: () => api.get('/integrations'),
  getConnection: (provider: string) => api.get(`/integrations/${provider}`),
  getAuthUrl: (provider: string) => api.get(`/integrations/${provider}/auth-url`),
  handleCallback: (provider: string, data: any) => api.post(`/integrations/${provider}/callback`, data),
  disconnect: (provider: string) => api.delete(`/integrations/${provider}`),
};
