import { create } from "zustand";
import api from "../services/api";
import { getSocket } from "../services/socketService";

const useChatStore = create((set, get) => ({
  activeConversation: null,
  messages: [],
  typingUsers: {}, // { conversationId: [userName] }
  loading: false,
  onlinePresence: {}, // { userId: { isOnline, lastSeen } }

  setConversation: (conv) => {
    const prevConv = get().activeConversation;
    const socket = getSocket();
    if (socket && prevConv?._id) {
      socket.emit("chat:leave", { conversationId: prevConv._id });
    }
    set({ activeConversation: conv });
    if (conv?._id) {
      if (socket) {
        socket.emit("chat:join", { conversationId: conv._id });
      }
      get().fetchMessages(conv._id);
    }
  },

  fetchProjectConversation: async (projectId) => {
    set({ loading: true });
    try {
      const url = projectId ? `/chat/project/${projectId}` : `/chat/project/active`;
      const { data } = await api.get(url);
      const conv = data.data.conversation;
      const socket = getSocket();
      if (socket && conv?._id) {
        socket.emit("chat:join", { conversationId: conv._id });
      }
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

  replyingTo: null,
  setReplyTo: (msg) => {
    if (!msg) {
      set({ replyingTo: null });
      return;
    }
    const senderName = msg.sender?.name || "User";
    const fileType = msg.attachments?.[0]?.fileType || "";
    const fileName = msg.attachments?.[0]?.fileName || msg.attachments?.[0]?.filename || "Attachment";
    const content = msg.content || (msg.type === "voice_note" ? "🎙 Voice Note" : msg.attachments?.length ? `📎 ${fileName}` : "");
    if (!content && !fileType) return;
    set({
      replyingTo: {
        messageId: msg._id,
        senderName,
        content,
        fileType,
      },
    });
  },
  clearReplyTo: () => set({ replyingTo: null }),

  sendMessage: async (conversationIdOrObj, content, attachments = [], type = "text") => {
    let convId = conversationIdOrObj;
    let msgContent = content;
    let msgAttachments = attachments;
    let msgType = type;

    if (typeof conversationIdOrObj === "object" && conversationIdOrObj !== null) {
      convId = conversationIdOrObj.conversationId;
      msgContent = conversationIdOrObj.content || "";
      msgAttachments = conversationIdOrObj.attachments || [];
      msgType = conversationIdOrObj.type || (msgAttachments.length ? (msgAttachments[0].fileType === "audio" ? "voice_note" : "media") : "text");
    }

    if (!convId) throw new Error("Conversation ID is required");

    const replyTo = get().replyingTo;

    const { data } = await api.post(`/chat/conversations/${convId}/messages`, {
      content: msgContent,
      attachments: msgAttachments,
      type: msgType,
      replyTo: replyTo || undefined,
    });
    get().clearReplyTo();
    get().appendMessage(data.data.message);
    return data.data.message;
  },

  toggleReaction: async (messageId, emoji) => {
    const { data } = await api.post(`/chat/messages/${messageId}/react`, { emoji });
    get().updateMessageReactions(messageId, data.data.reactions);
  },

  updateMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ),
    }));
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

  deleteMessage: async (messageId, mode = "everyone") => {
    await api.delete(`/chat/messages/${messageId}`, { data: { mode } });
    if (mode === "everyone") {
      get().markMessageDeleted(messageId);
    } else {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    }
  },

  markMessageDeleted: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, content: "This message was deleted", attachments: [] }
          : m
      ),
    }));
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
