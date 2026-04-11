import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";
import tokenStore from "../services/tokenStore";

const WELCOME = {
  id:      "welcome",
  role:    "assistant",
  content: "Hi! I'm **Skillora AI** — your personal productivity assistant, powered by **Gemini 1.5 Pro**.\n\nI know your projects, tasks, and skills, so I can give you personalized advice. Try one of the suggestions below or ask me anything.",
  ts:      Date.now(),
};

const useAiStore = create(
  persist(
    (set, get) => ({
      messages:    [WELCOME],
      isStreaming: false,
      error:       null,
      history:     [],

      clearChat: () => set({ messages: [WELCOME], error: null }),

      addUserMessage: (content) => {
        const msg = { id: Date.now().toString(), role: "user", content, ts: Date.now() };
        set((s) => ({ messages: [...s.messages, msg] }));
        return msg;
      },

      /**
       * Send a message and stream the response.
       * Uses fetch directly (not axios) for SSE streaming.
       */
      sendMessage: async (content, feature = "chat", projectId) => {
        if (!content.trim() || get().isStreaming) return;

        // Add user message
        get().addUserMessage(content);

        // Placeholder assistant message
        const assistantId = `ai-${Date.now()}`;
        set((s) => ({
          isStreaming: true,
          error:       null,
          messages:    [...s.messages, { id: assistantId, role: "assistant", content: "", ts: Date.now(), streaming: true }],
        }));

        // Build conversation history for API (exclude welcome, last N messages)
        const history = get().messages
          .filter((m) => m.id !== "welcome" && !m.streaming)
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
            body: JSON.stringify({ messages: history, feature, projectId }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${response.status}`);
          }

          const reader  = response.body.getReader();
          const decoder = new TextDecoder();
          let   buffer  = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep incomplete line

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "delta") {
                  set((s) => ({
                    messages: s.messages.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + data.content }
                        : m
                    ),
                  }));
                }

                if (data.type === "done") {
                  set((s) => ({
                    messages: s.messages.map((m) =>
                      m.id === assistantId
                        ? { ...m, streaming: false, tokensUsed: data.tokensUsed, durationMs: data.durationMs }
                        : m
                    ),
                  }));
                }

                if (data.type === "error") {
                  throw new Error(data.message);
                }
              } catch (parseErr) {
                // Skip malformed SSE lines
              }
            }
          }
        } catch (err) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Sorry, something went wrong: ${err.message}`, streaming: false, isError: true }
                : m
            ),
            error: err.message,
          }));
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
    }),
    {
      name:       "skillora-ai-chat",
      partialize: (s) => ({ messages: s.messages.slice(-100) }), // persist last 100 messages
    }
  )
);

export default useAiStore;
