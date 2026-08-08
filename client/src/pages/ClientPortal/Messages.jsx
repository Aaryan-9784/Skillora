import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Video, Phone, Send, Search, Paperclip, Mic,
  MoreVertical, Calendar, RefreshCw, X, FileText, CheckCheck, Users, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useChatStore from "../../store/chatStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import CallModal from "../../components/chat/CallModal";
import VoiceRecorder from "../../components/chat/VoiceRecorder";
import ScheduleMeetingModal from "../../components/chat/ScheduleMeetingModal";
import toast from "react-hot-toast";

const GCard = ({ children, delay = 0, className = "", glow = "#635BFF" }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    className={`relative rounded-3xl border border-slate-800/80 bg-[#0B101F]/80 backdrop-blur-xl shadow-2xl overflow-hidden ${className}`}
  >
    <div
      className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20"
      style={{ background: glow }}
    />
    {children}
  </motion.div>
);

const relativeTime = (dateStr) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

const ClientMessages = () => {
  const user = useAuthStore((state) => state.user);
  const {
    activeConversation,
    messages,
    onlinePresence,
    fetchProjectConversation,
    sendMessage,
    isTyping,
  } = useChatStore();

  const [inputText, setInputText]           = useState("");
  const [showVoiceRecorder, setShowVoice]  = useState(false);
  const [showScheduleModal, setShowSchedule]= useState(false);
  const [uploadingFile, setUploadingFile]   = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [moreMenuOpen, setMoreMenuOpen]     = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const fileInputRef                        = useRef(null);
  const messagesEndRef                      = useRef(null);
  const moreMenuRef                         = useRef(null);
  const sidebarMenuRef                      = useRef(null);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [contactSearch, setContactSearch]       = useState("");

  const partner = activeConversation?.participants?.find((p) => (p._id || p) !== user?._id) || null;

  const presence = partner ? (onlinePresence[partner._id || partner] || { isOnline: true, lastSeen: new Date() }) : { isOnline: false };

  const dbParticipants = (activeConversation?.participants || []).filter(p => (p._id || p) !== user?._id).map((p) => ({
    id: p._id || p,
    name: p.name || p.email || "Freelancer Lead",
    role: p.role === "freelancer" ? "Freelancer Lead" : "Project Team",
    avatar: p.avatar || "",
    isOnline: true,
    lastMsg: messages.length > 0 ? (messages[messages.length - 1].content || "Sent an attachment") : "Project conversation ready",
    time: messages.length > 0 ? relativeTime(messages[messages.length - 1].createdAt) : "Just now",
    badge: "Team",
  }));

  const contactsList = dbParticipants;

  const filteredContacts = contactsList.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const {
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleVideo, toggleScreenShare,
    localStream, remoteStream, callState, incomingCall,
    isMuted, isVideoOff, isScreenSharing, callDuration
  } = useWebRTC(partner?._id || partner, "video");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchProjectConversation().catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target)) {
        setSidebarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendText = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeConversation?._id) return;

    const text = inputText.trim();
    setInputText("");

    try {
      await sendMessage({ conversationId: activeConversation._id, content: text });
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    }
  };

  const handleSendVoiceNote = async (audioBlob) => {
    if (!activeConversation?._id) return;
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-note.webm");
      formData.append("conversationId", activeConversation._id);

      const res = await fetch("/api/upload/chat-attachment", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      await sendMessage({
        conversationId: activeConversation._id,
        content: "🎤 Voice Note",
        attachments: [{ fileType: "audio", url: data.data.url, fileName: "voice-note.webm" }],
      });
      setShowVoice(false);
      toast.success("Voice note sent");
    } catch (err) {
      toast.error(err.message || "Failed to send voice note");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation?._id) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", activeConversation._id);

      const res = await fetch("/api/upload/chat-attachment", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "document";

      await sendMessage({
        conversationId: activeConversation._id,
        content: `📎 Shared file: ${file.name}`,
        attachments: [{ fileType, url: data.data.url, fileName: file.name }],
      });
      toast.success("Attachment sent");
    } catch (err) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans"
      style={{ background: "radial-gradient(ellipse 100% 55% at 65% -5%,rgba(99,91,255,0.08) 0%,transparent 52%),linear-gradient(180deg,#0B0F1A 0%,#07090F 100%)" }}>
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(99,91,255,0.05) 0%,transparent 60%)" }} />
      </div>

      <div className="relative p-6 lg:p-8 max-w-[1400px] w-full mx-auto flex flex-col space-y-4 pb-16 min-h-0">

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 30%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 12px rgba(167,139,250,0.2))",
              }}>
              Messages & Real-Time Chat
            </h1>
            <p className="text-xs lg:text-sm mt-1 font-medium text-slate-400">
              Direct communication thread with your clients and project team
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(99,91,255,0.55)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shrink-0"
            style={{
              background: "linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)",
              boxShadow: "0 0 20px rgba(99,91,255,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Calendar size={15} strokeWidth={2.5} /> Schedule Meeting
          </motion.button>
        </motion.div>

        {/* ── Main 2-Column WhatsApp Web Layout Container (100% Identical to Freelancer Messages) ── */}
        <GCard delay={0.15} glow="#635BFF" className="h-[520px] lg:h-[560px] flex p-0 overflow-hidden shadow-2xl shrink-0">
        
        {/* ── Left Sidebar: Users / Contacts List ── */}
        <div className="w-72 sm:w-80 lg:w-88 border-r border-slate-800/80 bg-[#111b21]/90 backdrop-blur-xl flex flex-col shrink-0">
          
          {/* Sidebar Header: Skillora & Chats */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#111b21]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 shrink-0">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight leading-none" style={{ background: "linear-gradient(135deg,#FFFFFF 30%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Skillora
                </h2>
                <p className="text-[11px] font-bold text-indigo-400 leading-tight mt-1">
                  Chats
                </p>
              </div>
            </div>

            {/* 3-Dot Sidebar Options Menu */}
            <div className="relative" ref={sidebarMenuRef}>
              <button
                onClick={() => setSidebarMenuOpen(prev => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${sidebarMenuOpen ? "bg-white/15 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
                title="Chat Options"
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {sidebarMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-50 w-52 bg-[#182229] border border-slate-700/60 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl"
                  >
                    <button
                      onClick={() => { setSidebarMenuOpen(false); fetchProjectConversation(); toast.success("Refreshed chats"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <RefreshCw size={15} className="text-emerald-400" />
                      <span>Refresh Chats</span>
                    </button>
                    <button
                      onClick={() => { setSidebarMenuOpen(false); setShowSchedule(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <Calendar size={15} className="text-purple-400" />
                      <span>Schedule Meeting</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search Contacts Bar */}
          <div className="p-3 border-b border-slate-800 bg-[#111b21]/60">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats or team..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#202c33] border border-slate-700/50 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Contacts & Users List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg">
                  <Users size={20} />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">No Project Contacts</h4>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed max-w-[180px]">
                  Project team chat will appear here automatically when active.
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContactId === contact.id || partner;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/20 border-l-4 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-1 ring-white/10">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getInitials(contact.name)
                        )}
                      </div>
                      {contact.isOnline ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#111b21] absolute bottom-0 right-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#111b21] absolute bottom-0 right-0" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{contact.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">{contact.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{contact.lastMsg}</p>
                        {contact.badge && (
                          <span className="text-[9px] font-extrabold bg-indigo-500 text-white px-1.5 py-0.5 rounded-md shrink-0">
                            {contact.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat Area (100% Identical to Freelancer Messages) ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120]/40 relative overflow-hidden">
          {!partner ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B1120]/60 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl mb-6"
              >
                <MessageSquare size={36} />
              </motion.div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Skillora Web Messaging
              </h2>
              <p className="text-xs lg:text-sm text-slate-400 max-w-md leading-relaxed">
                Select a client conversation from the left sidebar to start chatting, send voice notes, or launch WebRTC video calls in real-time.
              </p>
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <div className="h-16 px-4 lg:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#111b21]/90 backdrop-blur-md">
                
                {/* User Profile & Status */}
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-sm ring-1 ring-white/10">
                      {partner?.avatar ? (
                        <img src={partner.avatar} alt={partner?.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(partner?.name || "Freelancer Lead")
                      )}
                    </div>
                    {presence.isOnline ? (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111b21] absolute bottom-0 right-0 shadow-sm" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-slate-500 border-2 border-[#111b21] absolute bottom-0 right-0" />
                    )}
                  </div>

                  <div className="flex flex-col justify-center">
                    <h2 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-tight flex items-center gap-1.5">
                      {partner?.name || "Skillora Project Team"}
                    </h2>
                    <p className="text-xs leading-tight mt-0.5 font-normal">
                      {isTyping ? (
                        <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
                      ) : presence.isOnline ? (
                        <span className="text-emerald-400 font-medium">online</span>
                      ) : (
                        <span className="text-slate-400">offline</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons (Video, Voice, Search, More Options) */}
                <div className="flex items-center gap-1 text-slate-300">
                  <button
                    onClick={() => startCall("video")}
                    className="p-2.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Video call"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    onClick={() => startCall("voice")}
                    className="p-2.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Voice call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => { setSearchOpen(prev => !prev); setSearchQuery(""); }}
                    className={`p-2.5 rounded-full transition-colors cursor-pointer ${searchOpen ? "bg-white/15 text-white" : "hover:bg-white/10 text-slate-300 hover:text-white"}`}
                    title="Search messages"
                  >
                    <Search size={18} />
                  </button>

                  {/* More Options Dropdown */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setMoreMenuOpen(prev => !prev)}
                      className={`p-2.5 rounded-full transition-colors cursor-pointer ${moreMenuOpen ? "bg-white/15 text-white" : "hover:bg-white/10 text-slate-300 hover:text-white"}`}
                      title="More options"
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {moreMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 z-50 w-56 bg-[#182229] border border-slate-700/60 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl"
                        >
                          <button
                            onClick={() => { setMoreMenuOpen(false); setShowSchedule(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                          >
                            <Calendar size={15} className="text-indigo-400" />
                            <span>Schedule Meeting</span>
                          </button>
                          <button
                            onClick={() => { setMoreMenuOpen(false); setShowVoice(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                          >
                            <Mic size={15} className="text-purple-400" />
                            <span>Voice Note</span>
                          </button>
                          <button
                            onClick={() => { setMoreMenuOpen(false); fileInputRef.current?.click(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                          >
                            <Paperclip size={15} className="text-cyan-400" />
                            <span>Share Attachment</span>
                          </button>
                          <div className="h-px bg-white/10 my-1" />
                          <button
                            onClick={() => { setMoreMenuOpen(false); fetchProjectConversation(); toast.success("Refreshed messages"); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
                          >
                            <RefreshCw size={15} className="text-emerald-400" />
                            <span>Refresh Chat</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Expandable Search Input Bar */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 bg-[#182229] border-b border-slate-800 flex items-center gap-2 overflow-hidden shrink-0">
                    <Search size={15} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search in conversation..."
                      autoFocus
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Container Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a]/40 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg">
                      <MessageSquare size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Project Chat Room Ready</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Send a message, voice note, or schedule a video call with your project team.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = (msg.sender?._id || msg.sender) === user?._id;
                    return (
                      <motion.div
                        key={msg._id || msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5"
                          }`}
                        >
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                          {/* Attachments rendering */}
                          {msg.attachments?.map((att, idx) => (
                            <div key={idx} className="mt-2 pt-2 border-t border-white/10">
                              {att.fileType === "image" ? (
                                <img src={att.url} alt={att.fileName} className="max-w-xs rounded-xl border border-white/10" />
                              ) : att.fileType === "audio" ? (
                                <audio controls src={att.url} className="h-8 max-w-xs" />
                              ) : (
                                <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-200 underline">
                                  <FileText size={14} /> {att.fileName}
                                </a>
                              )}
                            </div>
                          ))}

                          <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isMe ? "text-indigo-200 justify-end" : "text-slate-400"}`}>
                            <span>{relativeTime(msg.createdAt)}</span>
                            {isMe && <CheckCheck size={13} className="text-indigo-200" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <div className="p-3 bg-[#111b21] border-t border-slate-800 shrink-0">
                {showVoiceRecorder ? (
                  <VoiceRecorder onSendVoiceNote={handleSendVoiceNote} onCancel={() => setShowVoice(false)} />
                ) : (
                  <form onSubmit={handleSendText} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-2.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVoice((v) => !v)}
                      className={`p-2.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        showVoiceRecorder ? "bg-purple-600 text-white" : "hover:bg-white/10 text-slate-400 hover:text-white"
                      }`}
                      title="Voice note"
                    >
                      <Mic size={18} />
                    </button>

                    <input
                      type="text"
                      placeholder="Write a message to your project team..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl text-xs font-medium text-white placeholder-gray-500 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />

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
                )}
              </div>
            </>
          )}
        </div>
        </GCard>
      </div>

      {/* WebRTC Video/Voice Call Modal Overlay */}
      <CallModal
        callState={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={endCall}
        onAccept={acceptCall}
        onReject={rejectCall}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        callDuration={callDuration}
        partnerName={partner?.name || "Skillora Team"}
      />

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        open={showScheduleModal}
        onClose={() => setShowSchedule(false)}
        projectId={activeConversation?.projectId || ""}
        participants={partner ? [partner] : []}
      />
    </div>
  );
};

export default ClientMessages;
