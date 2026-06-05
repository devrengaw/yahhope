import React, { useState } from 'react';
import { MessageSquare, Send, Paperclip, Smile, MoreVertical, Search } from 'lucide-react';

export function CommChat() {
  const [messages, setMessages] = useState<{id: number, user: string, text: string, time: string, self: boolean}[]>([]);

  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), user: 'Você', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), self: true }]);
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Comunicação Interna</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Equipe Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"><Search size={20} /></button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.self ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1 px-1">
              {!msg.self && <span className="text-[10px] font-bold text-slate-500">{msg.user}</span>}
              <span className="text-[10px] text-slate-400">{msg.time}</span>
            </div>
            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.self 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200 shadow-lg' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Smile size={22} /></button>
          <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Paperclip size={22} /></button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem aqui..." 
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
          <button 
            type="submit"
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
