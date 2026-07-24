import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Paperclip, Search, Sparkles,
  CheckCheck, Clock, User, Phone, Video, MoreVertical,
  Circle, FileText, Image as ImageIcon, CornerDownLeft
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 lg:p-6 max-w-7xl mx-auto overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-400" />
            Messages & Communication
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Direct thread with your project team and assigned freelancers
          </p>
        </div>
      </div>

      {/* ── Main Chat Interface ── */}
      <div className="flex-1 flex gap-4 min-h-0 rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{ background: "rgba(11, 18, 32, 0.8)", backdropFilter: "blur(20px)" }}>

        {/* ── Conversation List Sidebar ── */}
        <div className="w-80 shrink-0 flex flex-col border-r border-white/[0.06] bg-black/20">
          {/* Search bar */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
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
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition-all duration-150 relative ${
                    isActive ? "bg-indigo-500/10" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500" />
                  )}
                  <div className="relative shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg"
                      style={{ background: conv.avatarColor }}
                    >
                      {getInitials(conv.name)}
                    </div>
                    {conv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-white truncate">{conv.name}</p>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {relativeTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Conversation Panel ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
          {/* Header */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-white/[0.06] shrink-0 bg-black/10">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                style={{ background: activeConv.avatarColor }}
              >
                {getInitials(activeConv.name)}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  {activeConv.name}
                  {activeConv.online && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Now
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-gray-400">{activeConv.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1">
                <Sparkles size={12} />
                Client Workspace
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <span className="text-[10px] font-medium text-gray-400">{msg.senderName}</span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500">{relativeTime(msg.timestamp)}</span>
                  </div>

                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-lg shadow-indigo-500/10"
                        : "bg-white/[0.06] border border-white/[0.08] text-gray-200 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <div className="p-3 border-t border-white/[0.06] bg-black/20 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Write a message to your team..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all"
              >
                <span>Send</span>
                <Send size={13} />
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
