import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, Send, Sparkles, RefreshCw, ChevronDown, ShieldCheck, Building2, Cpu } from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import axios from 'axios';

const PROMPTS_BY_ROLE = {
  citizen: [
    "How do I submit a new report?",
    "How do Eco Tiers & Rewards Store work?",
    "How do I switch satellite map feeds?",
    "How do I download an official PDF report?"
  ],
  agency: [
    "How do I upload resolution proof photos?",
    "How do I update a report's status?",
    "Where do I see assigned reports?",
    "How does Agency Analytics work?"
  ],
  admin: [
    "How do I verify new agency organizations?",
    "How do I set the global announcement banner?",
    "How does Gemini AI Triage auditing work?",
    "How do I toggle Maintenance Mode?"
  ]
};

/**
 * Helper to cleanly format message markdown text (bolding, code chips, lists)
 */
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-1.5 my-1 pl-1">
          <span className="text-emerald-600 font-bold shrink-0">•</span>
          <span className="flex-1">{formattedLine}</span>
        </div>
      );
    }

    return (
      <div key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
        {formattedLine}
      </div>
    );
  });
}

export default function AIChatBot() {
  const { user } = useCitizen();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const pathname = location.pathname;

  // Determine current active dashboard mode
  const isCitizenPath = pathname.startsWith('/citizen-dashboard');
  const isAgencyPath = pathname.startsWith('/agency');
  const isAdminPath = pathname.startsWith('/admin');

  const roleMode = isAdminPath ? 'admin' : isAgencyPath ? 'agency' : isCitizenPath ? 'citizen' : null;

  // Reset initial greeting if mode changes
  useEffect(() => {
    if (roleMode === 'admin') {
      setMessages([
        {
          role: 'assistant',
          content: "🛡️ **Admin Intelligence Unit** initialized.\nAsk me about agency approvals, system health, AI Triage auditing, or user role configurations."
        }
      ]);
    } else if (roleMode === 'agency') {
      setMessages([
        {
          role: 'assistant',
          content: "🏢 **Agency Dispatch Assistant** online.\nAsk me about managing assigned reports, updating workflow statuses, or viewing analytics."
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! 👋 I'm **GreenAlert Assistant**.\nAsk me anything about how to submit reports, track status, or use platform features!"
        }
      ]);
    }
  }, [roleMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Do NOT render outside of dashboard routes
  if (!user || !roleMode) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const storedToken = localStorage.getItem('greenalert_token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
      const res = await axios.post('/api/chat', { messages: newMessages }, { headers });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I hit a snag while processing your request. Please check your network and try again!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const resetMsg = roleMode === 'admin'
      ? "🛡️ **Admin Intelligence memory cleared.** What command or guidance do you require?"
      : roleMode === 'agency'
      ? "🏢 **Dispatch memory cleared.** How can I assist with your agency tasks?"
      : "Chat cleared! How else can I assist you with GreenAlert today?";

    setMessages([{ role: 'assistant', content: resetMsg }]);
  };

  const currentPrompts = PROMPTS_BY_ROLE[roleMode] || PROMPTS_BY_ROLE.citizen;

  // Premium dashboard themes & pill launcher styling
  const theme = roleMode === 'admin' ? {
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
    title: 'Admin Intelligence AI',
    sub: 'Platform Command • Governance & Audits',
    accentBg: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-400',
    chipBg: 'bg-slate-900 text-emerald-400 border-slate-700 hover:bg-slate-800',
    ring: 'ring-emerald-500/30',
    btnGradient: 'from-slate-900 via-slate-800 to-slate-950',
    badgeColor: 'bg-emerald-400',
    pillLabel: 'Admin AI',
    pillSub: 'System Command',
    botIcon: Cpu,
  } : roleMode === 'agency' ? {
    gradient: 'from-amber-600 to-amber-700',
    title: 'Agency Dispatch AI',
    sub: 'Responder Suite • Workflow Assistant',
    accentBg: 'bg-amber-600 hover:bg-amber-700',
    accentText: 'text-amber-700',
    chipBg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    ring: 'ring-amber-500/30',
    btnGradient: 'from-amber-600 via-orange-600 to-amber-700',
    badgeColor: 'bg-emerald-400',
    pillLabel: 'Agency AI',
    pillSub: 'Dispatch Helper',
    botIcon: Building2,
  } : {
    gradient: 'from-emerald-600 to-teal-700',
    title: 'GreenAlert AI',
    sub: 'Platform Assistant • Always online',
    accentBg: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-600',
    chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    ring: 'ring-emerald-500/20',
    btnGradient: 'from-emerald-600 via-teal-600 to-emerald-500',
    badgeColor: 'bg-amber-400',
    pillLabel: 'GreenAlert AI',
    pillSub: 'Ask anything',
    botIcon: Bot,
  };

  const HeaderIcon = theme.botIcon;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] no-print font-sans">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[390px] h-[540px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className={`bg-gradient-to-r ${theme.gradient} p-4 text-white flex items-center justify-between shadow-md`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-inner">
                <HeaderIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  {theme.title}
                  {roleMode === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  ) : roleMode === 'agency' ? (
                    <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  )}
                </h3>
                <p className="text-[11px] text-white/80 font-medium">{theme.sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Clear Chat"
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-7 h-7 rounded-xl ${theme.accentBg} text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5`}>
                    <HeaderIcon className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? `${theme.accentBg} text-white rounded-tr-xs shadow-sm font-medium`
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-sm font-normal'
                  }`}
                >
                  {msg.role === 'user' ? msg.content : renderFormattedMessage(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className={`w-7 h-7 rounded-xl ${theme.accentBg} text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5`}>
                  <HeaderIcon className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chip Carousel */}
          {messages.length < 4 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
              {currentPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${theme.chipBg}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={roleMode === 'admin' ? "Ask admin question or command..." : roleMode === 'agency' ? "Ask agency dispatch question..." : "Ask a question..."}
              className="flex-1 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all text-slate-800 placeholder-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 ${theme.accentBg} text-white rounded-xl transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-40`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Pill Launcher Widget with Bouncing Animation */}
      <div className="animate-bounce" style={{ animationDuration: '3.2s' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Assistant"
          className={`group flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${theme.btnGradient} text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25 backdrop-blur-xl ring-4 ${theme.ring} cursor-pointer`}
        >
          {/* Icon Badge */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shrink-0">
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-white transition-transform group-hover:rotate-180" />
            ) : (
              <>
                <HeaderIcon className="w-4.5 h-4.5 text-white" />
                <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </>
            )}
          </div>

          {/* Label & Status Indicator */}
          <div className="flex flex-col text-left pr-1">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-extrabold tracking-wide text-white">
                {isOpen ? 'Minimize' : theme.pillLabel}
              </span>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.badgeColor} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.badgeColor}`}></span>
              </span>
            </div>
            <span className="text-[10px] text-white/80 font-medium tracking-tight mt-0.5">
              {isOpen ? 'Click to close' : theme.pillSub}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
