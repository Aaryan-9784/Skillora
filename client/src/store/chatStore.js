import { create } from "zustand";
import api from "../services/api";

const useChatStore = create((set, get) => ({
  activeConversation: null,
  messages: [],
  typingUsers: {}, // { conversationId: [userName] }
  loading: false,
  onlinePresence: {}, // { userId: { isOnline, lastSeen } }

  setConversation: (conv) => {
    set({ activeConversation: conv });
    if (conv?._id) get().fetchMessages(conv._id);
  },

  fetchProjectConversation: async (projectId) => {
    set({ loading: true });
    try {
      const url = projectId ? `/chat/project/${projectId}` : `/chat/project/active`;
      const { data } = await api.get(url);
      const conv = data.data.conversation;
      set({ activeConversation: conv });
      if (conv?._id) get().fetchMessages(conv._id);
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId, page = 1) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}`);
      set({ messages: data.data.data });
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId, content, attachments = [], type = "text") => {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      attachments,
      type,
    });
    get().appendMessage(data.data.message);
    return data.data.message;
  },

  appendMessage: (message) => {
    set((state) => {
      if (state.activeConversation?._id === message.conversationId) {
        const exists = state.messages.some((m) => m._id === message._id);
        if (exists) return state;
        return { messages: [...state.messages, message] };
      }
      return state;
    });
  },

  setTyping: (conversationId, userName, isTyping) => {
    set((state) => {
      const list = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...list, userName]))
        : list.filter((name) => name !== userName);
      return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
    });
  },

  updatePresence: (userId, isOnline, lastSeen) => {
    set((state) => ({
      onlinePresence: {
        ...state.onlinePresence,
        [userId]: { isOnline, lastSeen },
      },
    }));
  },
}));

export default useChatStore;
