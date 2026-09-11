import api from './api';

export const caseService = {
  list: (params?: { page?: number; limit?: number; status?: string; legalArea?: string; processType?: string; responsibleLawyer?: string }) =>
    api.get('/cases', { params }),

  get: (id: string) => api.get(`/cases/${id}`),

  getSummary: (id: string) => api.get(`/cases/${id}/summary`),

  create: (data: any) => api.post('/cases', data),

  update: (id: string, data: any) => api.put(`/cases/${id}`, data),

  delete: (id: string) => api.delete(`/cases/${id}`),

  getFacts: (id: string) => api.get(`/cases/${id}/facts`),
  addFact: (id: string, data: any) => api.post(`/cases/${id}/facts`, data),
  updateFact: (id: string, factId: string, data: any) => api.put(`/cases/${id}/facts/${factId}`, data),
  deleteFact: (id: string, factId: string) => api.delete(`/cases/${id}/facts/${factId}`),

  getTimeline: (id: string) => api.get(`/cases/${id}/timeline`),
  addEvent: (id: string, data: any) => api.post(`/cases/${id}/timeline`, data),
  updateEvent: (id: string, eventId: string, data: any) => api.put(`/cases/${id}/timeline/${eventId}`, data),
  deleteEvent: (id: string, eventId: string) => api.delete(`/cases/${id}/timeline/${eventId}`),

  getPersons: (id: string) => api.get(`/cases/${id}/persons`),
  addPerson: (id: string, data: any) => api.post(`/cases/${id}/persons`, data),
  updatePerson: (id: string, personId: string, data: any) => api.put(`/cases/${id}/persons/${personId}`, data),
  deletePerson: (id: string, personId: string) => api.delete(`/cases/${id}/persons/${personId}`),

  getEvidence: (id: string) => api.get(`/cases/${id}/evidence`),
  addEvidence: (id: string, data: any) => api.post(`/cases/${id}/evidence`, data),
  updateEvidence: (id: string, evidenceId: string, data: any) => api.put(`/cases/${id}/evidence/${evidenceId}`, data),
  deleteEvidence: (id: string, evidenceId: string) => api.delete(`/cases/${id}/evidence/${evidenceId}`),

  getLegalIssues: (id: string) => api.get(`/cases/${id}/legal-issues`),
  addLegalIssue: (id: string, data: any) => api.post(`/cases/${id}/legal-issues`, data),
  updateLegalIssue: (id: string, issueId: string, data: any) => api.put(`/cases/${id}/legal-issues/${issueId}`, data),
  deleteLegalIssue: (id: string, issueId: string) => api.delete(`/cases/${id}/legal-issues/${issueId}`),

  getHearings: (id: string) => api.get(`/cases/${id}/hearings`),
  addHearing: (id: string, data: any) => api.post(`/cases/${id}/hearings`, data),
  updateHearing: (id: string, hearingId: string, data: any) => api.put(`/cases/${id}/hearings/${hearingId}`, data),
  deleteHearing: (id: string, hearingId: string) => api.delete(`/cases/${id}/hearings/${hearingId}`),

  getTasks: (id: string) => api.get(`/cases/${id}/tasks`),
  addTask: (id: string, data: any) => api.post(`/cases/${id}/tasks`, data),
  updateTask: (id: string, taskId: string, data: any) => api.put(`/cases/${id}/tasks/${taskId}`, data),
  deleteTask: (id: string, taskId: string) => api.delete(`/cases/${id}/tasks/${taskId}`),

  getAlerts: (id: string) => api.get(`/cases/${id}/alerts`),
  addAlert: (id: string, data: any) => api.post(`/cases/${id}/alerts`, data),
  updateAlert: (id: string, alertId: string, data: any) => api.put(`/cases/${id}/alerts/${alertId}`, data),

  getNorms: (id: string) => api.get(`/cases/${id}/norms`),
  addNorm: (id: string, data: any) => api.post(`/cases/${id}/norms`, data),

  getDocuments: (id: string) => api.get(`/cases/${id}/documents`),
  getGeneratedDocuments: (id: string) => api.get(`/cases/${id}/generated-documents`),

  getJurisprudence: (id: string) => api.get(`/cases/${id}/jurisprudence`),
  saveJurisprudence: (id: string, data: any) => api.post(`/cases/${id}/jurisprudence`, data),
};
