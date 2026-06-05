import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Send, User, MessageSquare, Clock, CheckCircle2, MoreHorizontal, Paperclip, Smile } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SupporterMessages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [replyText, setReplyText] = useState('');
  const [attachmentsEnabled, setAttachmentsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<{ id: number, name: string, role: string, lastMsg: string, time: string, unread: boolean, avatar: string }[]>([]);

  const [chatMessages, setChatMessages] = useState<Record<number, any[]>>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedChat]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      sender: 'Equipe YAHope',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage]
    }));

    setChats(prev => prev.map(chat => 
      chat.id === selectedChat 
        ? { ...chat, lastMsg: replyText, time: 'Agora', unread: false }
        : chat
    ));

    setReplyText('');
  };

  const handleSelectChat = (id: number) => {
    setSelectedChat(id);
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, unread: false } : chat
    ));
  };

  const currentMessages = selectedChat ? chatMessages[selectedChat] || [] : [];

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Chat List */}
      <div className="w-80 shrink-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-900 mb-4">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar apoiador..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={cn(
                "p-4 flex items-center gap-4 cursor-pointer transition-all border-l-4",
                selectedChat === chat.id ? "bg-slate-50 border-emerald-500" : "border-transparent hover:bg-slate-50/50"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{chat.time}</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-black uppercase tracking-widest mb-1">{chat.role}</p>
                <p className={cn("text-xs truncate", chat.unread ? "font-bold text-slate-900" : "text-slate-500")}>
                  {chat.lastMsg}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  {chats.find(c => c.id === selectedChat)?.avatar}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight">{chats.find(c => c.id === selectedChat)?.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Padrinho Ativo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAttachmentsEnabled(!attachmentsEnabled)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    attachmentsEnabled 
                      ? "bg-amber-100 border-amber-200 text-amber-600 shadow-sm" 
                      : "bg-white border-slate-100 text-slate-400 hover:text-slate-600"
                  )}
                  title={attachmentsEnabled ? "Desabilitar Anexos para o Apoiador" : "Habilitar Anexos para o Apoiador"}
                >
                  <Paperclip size={14} /> {attachmentsEnabled ? "Anexos: On" : "Habilitar Anexos"}
                </button>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <Clock size={18} />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="text-center">
                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Início da conversa</span>
              </div>
              
              {currentMessages.map(msg => (
                <div key={msg.id} className={cn("flex flex-col", msg.isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm",
                    msg.isMe 
                      ? "bg-slate-900 text-white rounded-tr-none" 
                      : "bg-slate-100 text-slate-700 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 px-2">{msg.time}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-6 bg-slate-50/50 border-t border-slate-50">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-2 flex items-end gap-2 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
                <button type="button" className="p-3 text-slate-400 hover:text-emerald-500 transition-colors">
                  <Paperclip size={20} />
                </button>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escreva sua resposta..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-sm font-medium resize-none"
                />
                <button type="button" className="p-3 text-slate-400 hover:text-emerald-500 transition-colors">
                  <Smile size={20} />
                </button>
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  className={cn(
                    "p-3 rounded-2xl shadow-lg transition-all active:scale-95",
                    replyText.trim() ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-slate-100 text-slate-300"
                  )}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Selecione uma conversa</h3>
            <p className="text-slate-500 font-medium max-w-xs">Escolha um apoiador na lista ao lado para iniciar ou continuar o diálogo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
