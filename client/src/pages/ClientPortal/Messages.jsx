import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Paperclip, Search, Sparkles,
  CheckCheck, Clock, User, Phone, Video, MoreVertical,
  Circle, FileText, Image as ImageIcon, CornerDownLeft, RefreshCw,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useSocket from "../../hooks/useSocket";
import { getInitials, relativeTime } from "../../utils/helpers";

const INITIAL_CONVERSATIONS = [
  {
    id: "conv-1",
    name: "Skillora Support & Freelancer Team",
    role: "Project Manager & Lead Dev",
    online: true,
    lastMessage: "We've updated the invoice and completed the milestone 2 deliverables.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unread: 2,
    avatarColor: "linear-gradient(135deg,#635BFF,#8B5CF6)",
    messages: [
      {
        id: "m-1",
        sender: "freelancer",
        senderName: "Skillora Team",
        text: "Hello! Welcome to your client workspace. We're actively working on your active milestones.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
      },
      {
        id: "m-2",
        sender: "client",
        senderName: "You",
        text: "Thanks! Could you provide an update on the design review for Milestone 2?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        read: true,
      },
      {
        id: "m-3",
        sender: "freelancer",
        senderName: "Skillora Team",
        text: "We've updated the invoice and completed the milestone 2 deliverables.",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        read: false,
      },
    ],
  },
  {
    id: "conv-2",
    name: "Design & UX Consultation",
    role: "UI/UX Specialist",
    online: false,
    lastMessage: "The brand guidelines document has been attached for your review.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unread: 0,
    avatarColor: "linear-gradient(135deg,#00D4FF,#0055FF)",
    messages: [
      {
        id: "m-201",
        sender: "freelancer",
        senderName: "Alex Rivera",
        text: "The brand guidelines document has been attached for your review.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        read: true,
      },
    ],
  },
];

// ── Glass Container Card (Matches Admin Theme) ─────────────────────────────
const GCard = ({ children, delay, className, glow }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay || 0, duration: 0.45, ease: [0.16,1,0.3,1] }}
    className={"relative overflow-hidden rounded-2xl " + (className || "")}
    style={{
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: glow ? ("0 0 50px " + glow + "10") : "0 0 30px rgba(99,91,255,0.04)",
    }}
  >
    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{ background: glow
        ? ("linear-gradient(90deg,transparent," + glow + "50,transparent)")
        : "linear-gradient(90deg,transparent,rgba(99,91,255,0.25),transparent)" }} />
    {children}
  </motion.div>
);

const ClientMessages = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId]   = useState("conv-1");
  const [inputText, setInputText]         = useState("");
  const [searchQuery, setSearchQuery]     = useState("");
  const messagesEndRef                    = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: "client",
      senderName: user?.name || "You",
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastMessageTime: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText("");

    // Simulate AI / Freelancer automated acknowledgement
    setTimeout(() => {
      const autoReply = {
        id: `m-reply-${Date.now()}`,
        sender: "freelancer",
        senderName: activeConv.name.split(" ")[0] || "Team",
        text: "Got your message! Our team will review this shortly.",
        timestamp: new Date().toISOString(),
        read: true,
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: autoReply.text,
              lastMessageTime: autoReply.timestamp,
              messages: [...c.messages, autoReply],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-5">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Messages
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium" style={{ color: "rgba(148,163,184,0.7)" }}>
              Direct communication thread with your project team and freelancers
            </p>
          </div>
        </motion.div>

      {/* ── Main Chat Interface Container ── */}
      <GCard delay={0.15} glow="#635BFF" className="flex-1 flex min-h-0 p-0 overflow-hidden">

        {/* ── Conversation List Sidebar ── */}
        <div className="w-80 shrink-0 flex flex-col border-r border-white/[0.07]"
          style={{ background: "rgba(6,9,22,0.4)" }}>
          {/* Search Bar */}
          <div className="p-3.5 border-b border-white/[0.07]">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F9FAFB",
                }}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"; e.currentTarget.style.background = "rgba(99,91,255,0.06)"; }}
                onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-all duration-150 relative cursor-pointer ${
                    isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                  }`}
                  style={{
                    background: isActive ? "linear-gradient(135deg,rgba(99,91,255,0.15) 0%,rgba(139,92,246,0.08) 100%)" : "transparent",
                  }}
                >
                  {isActive && (
                    <motion.div layoutId="active-chat-pill" className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: "linear-gradient(180deg,#8B5CF6,#635BFF)", boxShadow: "0 0 10px rgba(99,91,255,0.8)" }} />
                  )}
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white"
                      style={{ background: conv.avatarColor, boxShadow: "0 0 14px rgba(99,91,255,0.3)" }}
                    >
                      {getInitials(conv.name)}
                    </div>
                    {conv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-indigo-300" : "text-white"}`}>{conv.name}</p>
                      <span className="text-[10px] font-medium shrink-0" style={{ color: "rgba(148,163,184,0.5)" }}>
                        {relativeTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium truncate" style={{ color: "rgba(148,163,184,0.65)" }}>{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Conversation Panel ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "rgba(11,17,32,0.4)" }}>
          {/* Active Conversation Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.07] shrink-0" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: activeConv.avatarColor, boxShadow: "0 0 12px rgba(99,91,255,0.3)" }}
              >
                {getInitials(activeConv.name)}
              </div>
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  {activeConv.name}
                  {activeConv.online && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Now
                    </span>
                  )}
                </h2>
                <p className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>{activeConv.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: "rgba(99,91,255,0.15)", border: "1px solid rgba(99,91,255,0.3)", color: "#A78BFA" }}>
                <Sparkles size={12} />
                Client Workspace
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeConv.messages.map((msg) => {
              const isMe = msg.sender === "client";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-white/80">{msg.senderName}</span>
                    <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>•</span>
                    <span className="text-[10px] font-medium" style={{ color: "rgba(148,163,184,0.5)" }}>{relativeTime(msg.timestamp)}</span>
                  </div>

                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed ${
                      isMe
                        ? "text-white rounded-tr-xs"
                        : "text-gray-200 rounded-tl-xs"
                    }`}
                    style={
                      isMe ? {
                        background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)",
                        boxShadow: "0 4px 20px rgba(99,91,255,0.3)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                    }
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <div className="p-4 border-t border-white/[0.07] shrink-0" style={{ background: "rgba(6,9,22,0.4)" }}>
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Write a message to your project team..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-xs font-medium text-white placeholder-gray-500 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,91,255,0.4)"; e.currentTarget.style.background = "rgba(99,91,255,0.06)"; }}
                  onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                style={{
                  background: "linear-gradient(135deg,#635BFF 0%,#8B5CF6 100%)",
                  boxShadow: "0 0 20px rgba(99,91,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span>Send</span>
                <Send size={13} />
              </motion.button>
            </form>
          </div>
        </div>
      </GCard>
      </div>
    </div>
  );
};

export default ClientMessages;
