import { create } from 'zustand';
import api from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
  sources?: any[];
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  caseId?: string;
  createdAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Message[];
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  createConversation: (data: { title?: string; caseId?: string }) => Promise<string>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,

  loadConversations: async () => {
    const res = await api.get('/chat/conversations');
    set({ conversations: res.data });
  },

  createConversation: async (data) => {
    const res = await api.post('/chat/conversations', data);
    const conv = res.data;
    set((state) => ({ conversations: [conv, ...state.conversations] }));
    return conv.id;
  },

  loadMessages: async (conversationId) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    set({ messages: res.data, currentConversation: conversationId });
  },

  sendMessage: async (conversationId, content) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, userMsg], isLoading: true }));

    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      const aiMsg: Message = {
        id: res.data.id,
        role: 'assistant',
        content: res.data.content,
        citations: res.data.citations,
        sources: res.data.sources,
        createdAt: res.data.createdAt,
      };
      set((state) => ({ messages: [...state.messages, aiMsg], isLoading: false }));

      const messageCount = get().messages.length;
      if (messageCount <= 1) {
        await get().loadConversations();
      }
    } catch {
      set({ isLoading: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      set((state) => ({
        conversations: state.conversations.filter(c => c.id !== id),
        currentConversation: state.currentConversation === id ? null : state.currentConversation,
        messages: state.currentConversation === id ? [] : state.messages,
      }));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  setCurrentConversation: (id) => set({ currentConversation: id, messages: [] }),
}));
