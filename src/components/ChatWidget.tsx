import React, { useState } from 'react';
import { MessageCircle, X, Send, Smile, Paperclip, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [canSendAttachments, setCanSendAttachments] = useState(false); // Controlled by Admin in reality

  const emojis = ['😊', '❤️', '🙌', '🙏', '✨', '🌍', '💪', '🏠'];

  const mockMessages = [
    { id: 1, text: 'Olá, que bom ter você aqui conosco. Para uma melhor experiência, recomendamos que você se cadastre em nosso site para acesso a áreas exclusivas. Qualquer dúvida estamos à disposição, é só nos chamar aqui :)', time: '8:28 PM', sender: 'YAH Hope' }
  ];

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">
          {/* Header */}
          <div className="p-6 bg-white flex justify-between items-center border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544816153-12ad5d7133a2?q=80&w=100&auto=format&fit=crop" alt="YAH Hope" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight">YAH Hope</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responderemos assim que possível</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCanSendAttachments(!canSendAttachments)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all",
                  canSendAttachments ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}
                title="Simular permissão de anexo (Admin)"
              >
                {canSendAttachments ? 'Anexo ON' : 'Anexo OFF'}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gradient-to-b from-white via-white to-amber-500/10">
            <div className="text-center">
              <span className="px-3 py-1 bg-slate-900/5 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-widest">8:28 PM</span>
            </div>

            {mockMessages.map(msg => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-[10px] font-black text-white">YH</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{msg.sender}</span>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm font-medium text-slate-600 leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-white relative">
            {showEmojis && (
              <div className="absolute bottom-full left-4 mb-2 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex gap-2 animate-in slide-in-from-bottom-2 duration-200">
                {emojis.map(e => (
                  <button 
                    key={e} 
                    onClick={() => addEmoji(e)}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-2 flex items-center gap-2 border border-slate-100 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Insira sua mensagem..."
                className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-sm font-medium text-slate-600"
              />
              <button 
                onClick={() => setShowEmojis(!showEmojis)}
                className={cn("p-2 transition-colors", showEmojis ? "text-amber-500" : "text-slate-400 hover:text-slate-600")}
              >
                <Smile size={20} />
              </button>
              {canSendAttachments && (
                <button className="p-2 text-slate-400 hover:text-slate-600 animate-in fade-in zoom-in duration-300">
                  <Paperclip size={20} />
                </button>
              )}
              {message && (
                <button className="bg-amber-600 text-white p-2 rounded-xl shadow-lg shadow-amber-600/20 animate-in fade-in zoom-in duration-200">
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-95 group",
          isOpen ? "bg-slate-900 rotate-90" : "bg-amber-500 hover:bg-amber-600 hover:-translate-y-1"
        )}
      >
        {isOpen ? (
          <Minimize2 className="text-white" size={28} />
        ) : (
          <div className="relative">
            <MessageCircle className="text-white" size={32} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-amber-500 rounded-full group-hover:animate-ping"></div>
          </div>
        )}
      </button>
    </div>
  );
}
