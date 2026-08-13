import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";
import tokenStore from "../services/tokenStore";

const WELCOME = {
  id:      "welcome",
  role:    "assistant",
  content: "Hi! I'm **Gemini AI** — your intelligent workspace assistant, powered by **Google Gemini**.\n\nI know your workspace, projects, tasks, and skills, and can answer any general knowledge, coding, or project-related questions. Ask me anything!",
  ts:      Date.now(),
};

const useAiStore = create((set, get) => ({
  messages:    [],
  isStreaming: false,
  error:       null,
  history:     [],
  activeUserId: null,

  clearChat: () => {
    const { activeUserId } = get();
    if (activeUserId) {
      localStorage.removeItem(`skillora_ai_chat_${activeUserId}`);
    }
    set({ messages: [], error: null });
  },

  syncUserSession: (userId) => {
    const currentActive = get().activeUserId;
    if (!userId) {
      set({ activeUserId: null, messages: [], error: null });
      return;
    }

    if (currentActive !== userId) {
      let userMessages = [];
      try {
        const stored = localStorage.getItem(`skillora_ai_chat_${userId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) userMessages = parsed;
        }
      } catch (e) {
        /* silent */
      }
      set({ activeUserId: userId, messages: userMessages, error: null });
    }
  },

  loadSession: (sessionMessages) => set({ messages: sessionMessages, isStreaming: false, error: null }),
  stopGenerating: () => set({ isStreaming: false }),

  saveUserMessages: (messages) => {
    const { activeUserId } = get();
    if (activeUserId) {
      try {
        localStorage.setItem(`skillora_ai_chat_${activeUserId}`, JSON.stringify(messages.slice(-100)));
      } catch (e) {
        /* silent */
      }
    }
  },

  addUserMessage: (content) => {
    const msg = { id: Date.now().toString(), role: "user", content, ts: Date.now() };
    const nextMessages = [...get().messages, msg];
    set({ messages: nextMessages });
    get().saveUserMessages(nextMessages);
    return msg;
  },

  /**
   * Send a message and stream the response.
   * Uses fetch directly (not axios) for SSE streaming.
   */
  sendMessage: async (content, feature = "chat", projectId = null, model = "gemini-3.5-flash") => {
    if (!content.trim() || get().isStreaming) return;

    // Add user message
    const userMsg = get().addUserMessage(content);

    // Placeholder assistant message
    const assistantId = `ai-${Date.now()}`;
    const initialMessages = [...get().messages, { id: assistantId, role: "assistant", content: "", ts: Date.now(), streaming: true }];
    set({
      isStreaming: true,
      error:       null,
      messages:    initialMessages,
    });

    // Build conversation history for API (exclude welcome, current user message, and assistant placeholder)
    const history = get().messages
      .filter((m) => m.id !== "welcome" && m.id !== userMsg.id && m.id !== assistantId && !m.streaming)
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    // Add current user message
    history.push({ role: "user", content });

    try {
      const baseURL = import.meta.env.VITE_API_URL || "/api";
      const token   = tokenStore.get();

      const response = await fetch(`${baseURL}/ai/chat`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ messages: history, feature, projectId, model }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let isReading = true;
      let responseText = "";

      while (isReading) {
        const { done, value } = await reader.read();
        if (done) { isReading = false; break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data = null;
          try {
            data = JSON.parse(line.slice(6));
          } catch (e) {
            continue;
          }

          if (data.type === "delta" && data.content) {
            responseText += data.content;
            set((s) => {
              const updated = s.messages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.content }
                  : m
              );
              return { messages: updated };
            });
          }

          if (data.type === "done") {
            set((s) => {
              const updated = s.messages.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, tokensUsed: data.tokensUsed, durationMs: data.durationMs }
                  : m
              );
              return { messages: updated };
            });
          }

          if (data.type === "error") {
            throw new Error(data.message || "AI service error");
          }
        }
      }

      // Final safety cleanup after stream ends: ensure assistant message is never left streaming
      set((s) => {
        const updated = s.messages.map((m) => {
          if (m.id === assistantId) {
            const finalContent = m.content || responseText || "I'm here to help! What would you like to work on?";
            return { ...m, content: finalContent, streaming: false };
          }
          return m;
        });
        get().saveUserMessages(updated);
        return { messages: updated };
      });
    } catch (err) {
      const errText = err.message || "Unable to reach AI service";
      set((s) => {
        const updated = s.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content || `Sorry, AI service error: ${errText}`, streaming: false, isError: true }
            : m
        );
        get().saveUserMessages(updated);
        return { messages: updated, error: errText };
      });
    } finally {
      set({ isStreaming: false });
    }
  },

  // One-shot commands (non-streaming)
  generateProjectPlan: async (title, description) => {
    const { data } = await api.post("/ai/project-plan", { title, description });
    return data.data.plan;
  },

  generateProposal: async (payload) => {
    const { data } = await api.post("/ai/proposal", payload);
    return data.data.proposal;
  },

  analyzeProductivity: async () => {
    const { data } = await api.get("/ai/productivity");
    return data.data.analysis;
  },

  suggestPricing: async (service) => {
    const { data } = await api.post("/ai/pricing", { service });
    return data.data.suggestion;
  },

  fetchHistory: async () => {
    const { data } = await api.get("/ai/history");
    set({ history: data.data.logs || [] });
  },
}));

export default useAiStore;
