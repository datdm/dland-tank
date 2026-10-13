import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send, X } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isChatOpen,
  setIsChatOpen,
  isMobile: propIsMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isMobile =
    propIsMobile ??
    (typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768));

  // Auto scroll to bottom on new message or when opened
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
    setIsChatOpen(false);
  };

  // 1. MOBILE CENTER DIALOG: Click Chat icon to show center modal dialog to read and send messages
  if (isMobile) {
    if (!isChatOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none pointer-events-auto animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsChatOpen(false);
        }}
      >
        <div className="bg-slate-900/98 border border-sky-500/60 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[80vh] animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs sm:text-sm font-mono tracking-tight flex items-center gap-1.5">
                  <span>KÊNH CHAT CHIẾN TRƯỜNG</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[9px] text-slate-400 font-mono">Xem tin nhắn & trò chuyện cùng toàn trận</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Stream */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[140px] max-h-[220px] sm:max-h-[260px] custom-scrollbar bg-slate-950/60"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-600 mb-1.5 opacity-60" />
                <span>Chưa có tin nhắn nào trong trận đấu.</span>
                <span className="text-[10px] text-slate-600 mt-0.5">Gửi tin nhắn đầu tiên để liên lạc đồng đội!</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={`${msg.id || 'msg'}_${idx}`} className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold font-mono" style={{ color: msg.color || '#38bdf8' }}>
                      {msg.senderName}:
                    </span>
                    <span className="text-slate-100 font-medium break-words">{msg.text}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Communication Chips */}
          <div className="px-2.5 py-1.5 border-t border-slate-800/80 bg-slate-900/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              '⚔️ Tấn công!',
              '⚠️ Rút lui!',
              '🚩 Cần tiếp viện!',
              '🛡️ Giữ căn cứ!',
              '👏 Đánh hay lắm!',
              '❤️ Cảm ơn!',
            ].map((quickText) => (
              <button
                key={quickText}
                type="button"
                onClick={() => {
                  onSendMessage(quickText);
                }}
                className="whitespace-nowrap px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700/80 text-[10px] font-medium text-slate-200 transition-all cursor-pointer shrink-0"
              >
                {quickText}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-2 sm:p-2.5 border-t border-slate-800 bg-slate-950/90 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập nội dung chat..."
              maxLength={120}
              className="flex-1 bg-slate-900 border border-sky-500/50 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder-slate-500"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. DESKTOP BOTTOM-LEFT CHAT BOX
  return (
    <div className="flex flex-col w-80 sm:w-96 select-none">
      {/* Messages stream box */}
      <div
        ref={scrollRef}
        className={`transition-all duration-200 overflow-y-auto space-y-1.5 p-2 rounded-xl custom-chat-scrollbar ${
          isChatOpen
            ? 'h-52 sm:h-60 max-h-60 bg-slate-900/95 border border-sky-500/40 shadow-2xl backdrop-blur-md pointer-events-auto'
            : 'max-h-44 bg-transparent pointer-events-none'
        }`}
      >
        {isChatOpen && (
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-sky-400 font-bold">
              <MessageSquare className="w-3 h-3 text-sky-400" />
              <span>KÊNH CHAT CHIẾN TRƯỜNG</span>
            </span>
            <span className="text-slate-500">(Enter gửi, Esc đóng)</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic px-2 py-1">
            Chưa có tin nhắn nào. Nhấn Enter để gửi tin đầu tiên!
          </div>
        ) : (
          messages.slice(isChatOpen ? -35 : -7).map((msg, idx) => (
            <div
              key={`${msg.id || 'msg'}_${idx}`}
              className={`text-xs leading-relaxed break-words rounded-lg px-2.5 py-1 transition-all ${
                isChatOpen
                  ? 'bg-slate-800/60 border border-slate-700/50'
                  : 'bg-slate-950/85 backdrop-blur-md shadow-md border border-slate-800/80'
              }`}
            >
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className="font-extrabold cursor-pointer hover:underline"
                  style={{ color: msg.color || '#38bdf8' }}
                >
                  {msg.senderName}:
                </span>
                <span className="text-slate-100 font-medium">{msg.text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Input Bar / Toggle Button */}
      {isChatOpen ? (
        <form onSubmit={handleSubmit} className="mt-1.5 flex items-center gap-1.5 pointer-events-auto">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsChatOpen(false);
              }
            }}
            placeholder="Nhập tin nhắn (Enter để gửi, Esc để đóng)..."
            maxLength={120}
            className="flex-1 bg-slate-900/95 border border-sky-500/70 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder-slate-400 shadow-xl"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 font-bold text-xs flex items-center gap-1 shadow-lg active:scale-95"
            title="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Đóng chat (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="mt-1 self-start flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md border border-slate-700/70 px-2.5 py-1.5 rounded-xl transition-all pointer-events-auto cursor-pointer shadow-lg active:scale-95 font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>Chat (Phím Enter)</span>
        </button>
      )}
    </div>
  );
};
