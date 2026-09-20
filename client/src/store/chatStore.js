import { create } from "zustand";
import api from "../services/api";
import { getSocket } from "../services/socketService";

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {}, // { conversationId: [userName] }
  loading: false,
  onlinePresence: {}, // { userId: { isOnline, lastSeen } }
  presenceSynced: false,
  onlineUsers: new Set(),

  fetchUserConversations: async () => {
    try {
      const { data } = await api.get("/chat/conversations");
      const convs = data.data?.conversations || [];
      set({ conversations: convs });
      convs.forEach((c) => {
        if (c.participants) get().syncParticipantsPresence(c.participants);
      });
      return convs;
    } catch (err) {
      console.warn("Failed to fetch user conversations:", err);
      return [];
    }
  },

  setConversation: (conv) => {
    const prevConv = get().activeConversation;
    const socket = getSocket();
    if (socket && prevConv?._id && prevConv._id !== conv?._id) {
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
      const conv = data.data?.conversation || null;
      if (!conv) {
        return null;
      }
      const socket = getSocket();
      if (socket && conv?._id) {
        socket.emit("chat:join", { conversationId: conv._id });
      }
      set({ activeConversation: conv });
      if (conv?.participants) {
        get().syncParticipantsPresence(conv.participants);
      }
      if (conv?._id) get().fetchMessages(conv._id);
      return conv;
    } catch {
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchConversations: async (projectId) => {
    return get().fetchProjectConversation(projectId);
  },

  openDirectChat: async (recipientId) => {
    if (!recipientId) return;
    set({ loading: true });
    try {
      const { data } = await api.get(`/chat/direct/${recipientId}`);
      const conv = data.data.conversation;
      const prevConv = get().activeConversation;
      const socket = getSocket();
      if (socket && prevConv?._id && prevConv._id !== conv._id) {
        socket.emit("chat:leave", { conversationId: prevConv._id });
      }
      if (socket && conv?._id) {
        socket.emit("chat:join", { conversationId: conv._id });
      }
      set({ activeConversation: conv });
      if (conv?.participants) {
        get().syncParticipantsPresence(conv.participants);
      }
      if (conv?._id) await get().fetchMessages(conv._id);
      return conv;
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
    if (!message) return;
    set((state) => {
      const msgConvId = (message.conversationId?._id || message.conversationId)?.toString();
      const msgId = message._id?.toString();

      // Update conversations list so latest message shows in the sidebar and moves to the top
      let found = false;
      let updatedConversations = state.conversations.map((c) => {
        if (c._id?.toString() === msgConvId) {
          found = true;
          const isCurrentActive = state.activeConversation?._id?.toString() === msgConvId;
          const currentUnread = c.unreadCount || 0;
          return {
            ...c,
            lastMessage: {
              text: message.content || (message.type === "voice_note" ? "🎙 Voice Note" : "📎 Attachment"),
              sender: message.sender,
              createdAt: message.createdAt || new Date(),
            },
            unreadCount: isCurrentActive ? 0 : currentUnread + 1,
          };
        }
        return c;
      });

      if (!found && message.conversationId && typeof message.conversationId === "object") {
        // Conversation was populated, append to conversations list if not present
        updatedConversations = [message.conversationId, ...updatedConversations];
      }

      // Sort conversations so the one with the newest message is at the top
      updatedConversations.sort((a, b) => {
        const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });

      const activeId = state.activeConversation?._id?.toString();
      if (!activeId || activeId !== msgConvId) {
        return { conversations: updatedConversations };
      }

      const exists = state.messages.some((m) => m._id?.toString() === msgId);
      if (exists) {
        return { conversations: updatedConversations };
      }

      return {
        conversations: updatedConversations,
        messages: [...state.messages, message],
      };
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

  deleteConversation: async (conversationId) => {
    if (!conversationId) return;
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      get().removeConversationFromState(conversationId);
    } catch (err) {
      console.error("Delete conversation error:", err);
      throw err;
    }
  },

  removeConversationFromState: (conversationId) => {
    if (!conversationId) return;
    const strId = conversationId.toString();
    set((state) => {
      const updatedConvs = state.conversations.filter(
        (c) => c._id?.toString() !== strId
      );
      const isCurrentActive = state.activeConversation?._id?.toString() === strId;
      return {
        conversations: updatedConvs,
        activeConversation: isCurrentActive ? null : state.activeConversation,
        messages: isCurrentActive ? [] : state.messages,
      };
    });
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

  syncParticipantsPresence: (participants) => {
    if (!Array.isArray(participants)) return;
    set((state) => {
      const updated = { ...state.onlinePresence };
      const { onlineUsers, presenceSynced } = state;

      participants.forEach((p) => {
        if (!p) return;
        const id = (p._id || p.id || (typeof p === "string" ? p : "")).toString();
        const clientRef = p.clientRef ? p.clientRef.toString() : "";
        const email = p.email ? p.email.toString().toLowerCase() : "";

        // If presence has already synced via socket, the socket truth overrides everything!
        const isOnline = presenceSynced
          ? Boolean(
              (id && onlineUsers?.has(id)) ||
              (clientRef && onlineUsers?.has(clientRef)) ||
              (email && onlineUsers?.has(email))
            )
          : Boolean(p.isOnline);

        const presenceData = {
          isOnline,
          lastSeen: p.lastSeen || null,
        };

        if (id) updated[id] = presenceData;
        if (clientRef) updated[clientRef] = presenceData;
        if (email) updated[email] = presenceData;
      });

      return { onlinePresence: updated };
    });
  },

  setOnlinePresenceBatch: (onlineUserIds = []) => {
    set((state) => {
      const onlineSet = new Set();
      (onlineUserIds || []).forEach((id) => {
        if (id) {
          const str = id.toString();
          onlineSet.add(str);
          onlineSet.add(str.toLowerCase());
        }
      });

      const updated = { ...state.onlinePresence };
      // Update all known keys in onlinePresence
      Object.keys(updated).forEach((key) => {
        const isOnline = onlineSet.has(key) || onlineSet.has(key.toLowerCase());
        updated[key] = {
          ...updated[key],
          isOnline,
          lastSeen: isOnline ? null : (updated[key]?.lastSeen || new Date()),
        };
      });

      // Also ensure all currently online IDs are explicitly true in updated
      onlineSet.forEach((key) => {
        updated[key] = {
          ...(updated[key] || {}),
          isOnline: true,
          lastSeen: null,
        };
      });

      return {
        onlineUsers: onlineSet,
        onlinePresence: updated,
        presenceSynced: true,
      };
    });
  },

  updatePresence: (userId, isOnline, lastSeen, clientRef, email) => {
    set((state) => {
      const onlineSet = new Set(state.onlineUsers || []);
      const updated = { ...state.onlinePresence };
      const statusObj = {
        isOnline: Boolean(isOnline),
        lastSeen: lastSeen || (isOnline ? null : new Date()),
      };

      const applyId = (id) => {
        if (!id) return;
        const str = id.toString();
        const lower = str.toLowerCase();
        if (isOnline) {
          onlineSet.add(str);
          onlineSet.add(lower);
        } else {
          onlineSet.delete(str);
          onlineSet.delete(lower);
        }
        updated[str] = statusObj;
        updated[lower] = statusObj;
      };

      applyId(userId);
      applyId(clientRef);
      applyId(email);

      return {
        onlineUsers: onlineSet,
        onlinePresence: updated,
      };
    });
  },
}));

export default useChatStore;
