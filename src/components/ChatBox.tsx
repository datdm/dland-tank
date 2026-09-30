import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send, X } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isChatOpen,
  setIsChatOpen,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
