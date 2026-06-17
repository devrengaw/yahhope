import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Hash, Paperclip, Smile, Image as ImageIcon, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function WorkspaceChat() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  const isDirectMessage = location.pathname.includes('/dm/');
  const title = isDirectMessage ? (id === '1' ? 'Ana Júlia' : id === '2' ? 'Carlos S.' : 'Usuário') : (id || 'geral');

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages
  const initialMessages = [
    {
      id: 1,
      sender: 'Ana Júlia',
      avatar: 'https://i.pravatar.cc/150?u=1',
      text: 'Oi pessoal, a reunião de hoje sobre o novo projeto foi remarcada para as 15h, tudo bem?',
      timestamp: '09:42',
      isMe: false,
    },
    {
      id: 2,
      sender: 'Carlos S.',
      avatar: 'https://i.pravatar.cc/150?u=2',
      text: 'Para mim tudo ótimo! Já deixei a sala de reuniões reservada.',
      timestamp: '09:45',
      isMe: false,
    },
    {
      id: 3,
      sender: user?.name || 'Você',
      avatar: 'https://i.pravatar.cc/150?u=3',
      text: 'Combinado! Estarei lá.',
      timestamp: '09:50',
      isMe: true,
    }
  ];

  const [messages, setMessages] = useState(initialMessages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      sender: user?.name || 'Você',
      avatar: 'https://i.pravatar.cc/150?u=3',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 40px)' }}>
      {/* Header */}
      <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {isDirectMessage ? (
            <div className="relative">
              <img src={`https://i.pravatar.cc/150?u=${id}`} alt={title} className="w-10 h-10 rounded shadow-sm" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
              <Hash size={24} />
            </div>
          )}
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1">
              {!isDirectMessage && <span className="text-slate-400 font-light">#</span>}
              {title}
            </h2>
            <p className="text-sm text-slate-500">
              {isDirectMessage ? 'Ativo agora' : 'Canal principal para comunicações da equipe'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
          <button className="hover:text-blue-600 transition-colors tooltip-target" data-tooltip="Chamada de áudio"><Phone size={20} /></button>
          <button className="hover:text-blue-600 transition-colors tooltip-target" data-tooltip="Chamada de vídeo"><Video size={20} /></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button className="hover:text-slate-600 transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
        <div className="text-center my-6">
          <span className="bg-white border border-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            Hoje
          </span>
        </div>

        {messages.map((msg, index) => {
          const isConsecutive = index > 0 && messages[index - 1].sender === msg.sender;

          return (
            <div key={msg.id} className={cn("flex group", isConsecutive ? "mt-1" : "mt-4")}>
              {!isConsecutive ? (
                <div className="w-10 h-10 shrink-0 mr-3">
                  <img src={msg.avatar} alt={msg.sender} className="w-full h-full rounded shadow-sm" />
                </div>
              ) : (
                <div className="w-10 mr-3 shrink-0 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-slate-400 font-medium leading-loose pr-2">{msg.timestamp}</span>
                </div>
              )}
              
              <div className="flex-1 max-w-3xl">
                {!isConsecutive && (
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-slate-900">{msg.sender}</span>
                    <span className="text-xs text-slate-400 font-medium">{msg.timestamp}</span>
                  </div>
                )}
                <div className="text-slate-700 leading-relaxed text-[15px]">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white shrink-0">
        <form onSubmit={handleSend} className="border border-slate-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 overflow-hidden bg-white">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-slate-500">
            <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors"><Paperclip size={18} /></button>
            <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors"><ImageIcon size={18} /></button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button type="button" className="text-sm font-bold p-1 hover:bg-slate-200 rounded transition-colors">B</button>
            <button type="button" className="text-sm italic p-1 hover:bg-slate-200 rounded transition-colors">I</button>
            <button type="button" className="text-sm underline p-1 hover:bg-slate-200 rounded transition-colors">U</button>
          </div>
          <div className="flex items-end">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={isDirectMessage ? `Enviar mensagem para ${title}` : `Enviar mensagem para #${title}`}
              className="flex-1 max-h-32 min-h-[44px] p-3 focus:outline-none resize-none bg-transparent placeholder-slate-400 text-[15px]"
              rows={1}
            />
            <div className="p-2 flex items-center gap-2 text-slate-400">
              <button type="button" className="p-1 hover:text-slate-600 transition-colors"><Smile size={20} /></button>
              <button 
                type="submit" 
                disabled={!message.trim()}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  message.trim() ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-slate-100 text-slate-300"
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
        <div className="text-center mt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            <span className="font-bold">Dica:</span> Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-sans mx-1">Enter</kbd> para enviar
          </p>
        </div>
      </div>
    </div>
  );
}
