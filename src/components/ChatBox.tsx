import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send } from 'lucide-react';

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

  // Auto scroll to bottom on new message
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
    <div className="flex flex-col w-72 sm:w-80 select-none">
      {/* Messages stream */}
      <div
        ref={scrollRef}
        className={`transition-all duration-200 overflow-y-auto space-y-1.5 p-2 rounded-lg ${
          isChatOpen
            ? 'max-h-48 bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md pointer-events-auto'
            : 'max-h-32 bg-transparent pointer-events-none'
        }`}
      >
        {messages.slice(-15).map((msg, idx) => (
          <div
            key={`${msg.id || 'msg'}_${idx}`}
            className={`text-xs leading-relaxed break-words rounded px-2 py-0.5 ${
              isChatOpen ? 'bg-slate-800/40' : 'bg-slate-950/75 backdrop-blur-sm shadow-sm inline-block max-w-full'
            }`}
          >
            <span
              className="font-bold mr-1.5 cursor-pointer"
              style={{ color: msg.color || '#38bdf8' }}
            >
              {msg.senderName}:
            </span>
            <span className="text-slate-100">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input bar */}
      {isChatOpen ? (
        <form onSubmit={handleSubmit} className="mt-1 flex items-center gap-1 pointer-events-auto">
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
            placeholder="Gửi tin nhắn (Enter để gửi, Esc để đóng)..."
            maxLength={120}
            className="flex-1 bg-slate-900 border border-sky-500/70 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder-slate-400"
          />
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Gửi"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="mt-1 self-start flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 px-2 py-1 rounded transition-colors pointer-events-auto cursor-pointer"
        >
          <MessageSquare className="w-3 h-3 text-sky-400" />
          <span>Chat (Phím Enter)</span>
        </button>
      )}
    </div>
  );
};
