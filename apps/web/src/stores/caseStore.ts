import { create } from 'zustand';
import { caseService } from '../services/caseService';

interface CaseState {
  cases: any[];
  currentCase: any | null;
  total: number;
  page: number;
  loading: boolean;
  filters: { status?: string; legalArea?: string; processType?: string; responsibleLawyer?: string };
  setFilters: (filters: any) => void;
  loadCases: (page?: number) => Promise<void>;
  loadCase: (id: string) => Promise<void>;
  createCase: (data: any) => Promise<any>;
  updateCase: (id: string, data: any) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  currentCase: null,
  total: 0,
  page: 1,
  loading: false,
  filters: {},

  setFilters: (filters) => set({ filters }),

  loadCases: async (page = 1) => {
    set({ loading: true });
    try {
      const { filters } = get();
      const res = await caseService.list({ page, limit: 12, ...filters });
      set({ cases: res.data.data || [], total: res.data.total || 0, page, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  loadCase: async (id) => {
    set({ loading: true });
    try {
      const res = await caseService.get(id);
      set({ currentCase: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createCase: async (data) => {
    const res = await caseService.create(data);
    return res.data;
  },

  updateCase: async (id, data) => {
    await caseService.update(id, data);
  },

  deleteCase: async (id) => {
    await caseService.delete(id);
    set({ cases: get().cases.filter((c) => c.id !== id) });
  },
}));
