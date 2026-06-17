import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Hash, Paperclip, Smile, Image as ImageIcon, MoreVertical, Phone, Video, UserPlus, X, File as FileIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export function WorkspaceChat() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { channels, addMemberToChannel, messages, sendMessage } = useWorkspace();
  
  const isDirectMessage = location.pathname.includes('/dm/');
  const currentChannel = channels.find(c => c.id === id);
  const title = isDirectMessage ? (id === '1' ? 'Ana Júlia' : id === '2' ? 'Carlos S.' : 'Usuário') : (currentChannel?.name || id || 'geral');

  const channelMessages = messages.filter(m => m.channelId === (isDirectMessage ? `dm-${id}` : id || 'geral'));

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ type: 'image' | 'file'; file: File; url: string }[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    if (isAddMemberModalOpen) {
      supabase.from('users').select('id, name, email').then(({ data }) => {
        if (data) setAvailableUsers(data);
      });
    }
  }, [isAddMemberModalOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;

    sendMessage({
      channelId: isDirectMessage ? `dm-${id}` : id || 'geral',
      sender: user?.name || 'Você',
      avatar: user?.avatar || 'https://i.pravatar.cc/150?u=3',
      text: message,
      isMe: true,
      attachments: attachments.map(a => ({ type: a.type, url: a.url, name: a.file.name }))
    });
    
    setMessage('');
    setAttachments([]);
    setShowEmojis(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        type,
        file,
        url: URL.createObjectURL(file) // temporary URL for preview
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    setMessage(prev => prev + `${prefix}texto${suffix}`);
  };

  const emojis = ['😀', '😂', '🥰', '👍', '🙏', '🎉', '🔥', '👀', '💡', '✅'];

  const renderTextWithFormatting = (text: string) => {
    // Basic markdown parsing for bold and italic
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('__') && part.endsWith('__')) return <u key={index}>{part.slice(2, -2)}</u>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
      if (part.startsWith('_') && part.endsWith('_')) return <em key={index}>{part.slice(1, -1)}</em>;
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-12rem)] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="h-auto min-h-[4rem] py-2 border-b border-slate-200 px-4 md:px-6 flex flex-wrap items-center justify-between shrink-0 bg-white gap-2">
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
              {isDirectMessage ? 'Ativo agora' : currentChannel?.description || 'Canal principal para comunicações'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
          {!isDirectMessage && (
            <button onClick={() => setIsAddMemberModalOpen(true)} className="hover:text-blue-600 transition-colors tooltip-target" data-tooltip="Adicionar pessoas">
              <UserPlus size={20} />
            </button>
          )}
          <button className="hover:text-blue-600 transition-colors tooltip-target" data-tooltip="Chamada de áudio"><Phone size={20} /></button>
          <button className="hover:text-blue-600 transition-colors tooltip-target" data-tooltip="Chamada de vídeo"><Video size={20} /></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button className="hover:text-slate-600 transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6 relative">
        <div className="text-center my-6">
          <span className="bg-white border border-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            Hoje
          </span>
        </div>

        {channelMessages.map((msg, index) => {
          const isConsecutive = index > 0 && channelMessages[index - 1].sender === msg.sender;

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
                  {msg.text && renderTextWithFormatting(msg.text)}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        att.type === 'image' ? (
                          <img key={i} src={att.url} alt={att.name} className="max-w-[200px] rounded-lg border border-slate-200 shadow-sm" />
                        ) : (
                          <div key={i} className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg border border-slate-200 text-sm">
                            <FileIcon size={16} className="text-slate-500" />
                            <span className="text-blue-600 hover:underline cursor-pointer">{att.name}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white shrink-0 relative">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group">
                {att.type === 'image' ? (
                  <div className="w-16 h-16 rounded border border-slate-200 overflow-hidden">
                    <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 px-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-600 truncate max-w-[120px]">
                    {att.file.name}
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmojis && (
          <div className="absolute bottom-full right-4 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10 w-64">
            <div className="flex flex-wrap gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setMessage(prev => prev + emoji);
                    setShowEmojis(false);
                  }}
                  className="text-xl p-1.5 hover:bg-slate-100 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="border border-slate-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 overflow-hidden bg-white">
          <div className="px-2 md:px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1 md:gap-2 text-slate-500 overflow-x-auto">
            <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileChange(e, 'file')} multiple />
            <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'image')} multiple />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-slate-200 rounded transition-colors"><Paperclip size={18} /></button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className="p-1 hover:bg-slate-200 rounded transition-colors"><ImageIcon size={18} /></button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button type="button" onClick={() => insertFormatting('**')} className="text-sm font-bold p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Negrito">B</button>
            <button type="button" onClick={() => insertFormatting('*')} className="text-sm italic p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Itálico">I</button>
            <button type="button" onClick={() => insertFormatting('__')} className="text-sm underline p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Sublinhado">U</button>
            <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block"></div>
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 hover:bg-slate-200 rounded transition-colors"><Smile size={18} /></button>
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
              <button 
                type="button" 
                onClick={() => setShowEmojis(!showEmojis)}
                className={cn("p-1 rounded transition-colors", showEmojis ? "text-blue-600 bg-blue-50" : "hover:text-slate-600")}
              >
                <Smile size={20} />
              </button>
              <button 
                type="submit" 
                disabled={!message.trim() && attachments.length === 0}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  message.trim() || attachments.length > 0 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-slate-100 text-slate-300"
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

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Adicionar pessoas a #{title}</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selecionar Usuário</label>
                <select
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Selecione um usuário...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (newMemberName.trim() && !isDirectMessage) {
                      addMemberToChannel(id || 'geral', newMemberName);
                      setIsAddMemberModalOpen(false);
                      setNewMemberName('');
                    }
                  }}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
