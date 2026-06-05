import React, { useState } from 'react';
import { Send, User, Clock, CheckCircle2, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function PortalMessages() {
  const [replyText, setReplyText] = useState('');

  const messages = [
    { id: 1, sender: 'Equipe YAHope', text: 'Olá! Como podemos ajudar hoje?', time: '09:00', isMe: false },
    { id: 2, sender: 'Você', text: 'Gostaria de saber como está o Kofi este mês.', time: '10:45', isMe: true },
    { id: 3, sender: 'Equipe YAHope', text: 'Olá! O Kofi está ótimo. Ele participou da oficina de artes ontem e se divertiu muito.', time: '11:02', isMe: false },
  ];

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
            YH
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">Suporte YAHope</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Online agora</span>
            </div>
          </div>
        </div>
        <Link to="/portal/dashboard" className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="text-center">
          <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal Direto com a Equipe</span>
        </div>
        
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex flex-col", msg.isMe ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[70%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm",
              msg.isMe 
                ? "bg-amber-500 text-white rounded-tr-none" 
                : "bg-slate-100 text-slate-700 rounded-tl-none"
            )}>
              {msg.text}
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-2 px-2">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-50">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-2 flex items-end gap-2 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all">
          <button className="p-3 text-slate-400 hover:text-amber-500 transition-colors">
            <Paperclip size={20} />
          </button>
          <textarea 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm font-medium resize-none"
          />
          <button className="p-3 text-slate-400 hover:text-amber-500 transition-colors">
            <Smile size={20} />
          </button>
          <button className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-2xl shadow-lg shadow-amber-600/20 transition-all active:scale-95">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
