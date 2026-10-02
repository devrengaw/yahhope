import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, Hash, Paperclip, Smile, Image as ImageIcon, MoreVertical, 
  UserPlus, X, File as FileIcon, Edit3, Trash2, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export function WorkspaceChat() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, alert: showAlert } = useConfirm();
  
  const { 
    channels, 
    updateChannel, 
    deleteChannel, 
    systemUsers 
  } = useClickUp();
  const { messages, sendMessage, addMemberToChannel } = useWorkspace();
  
  const isDirectMessage = location.pathname.includes('/dm/');
  const currentChannel = channels.find(c => c.id === id || c.name.toLowerCase() === id?.toLowerCase());
  const targetUser = isDirectMessage ? systemUsers.find(u => u.id === id) : null;
  const title = isDirectMessage ? (targetUser?.name || 'Conversa Direta') : (currentChannel?.name || id || 'geral');

  const targetChannelId = currentChannel?.id || id || 'geral';
  const channelMessages = messages.filter(m => {
    if (isDirectMessage) {
      return m.channelId === `dm-${id}`;
    }
    return (
      m.channelId === targetChannelId || 
      m.channelId === id || 
      (currentChannel && m.channelId === currentChannel.name)
    );
  });

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ type: 'image' | 'file'; file: File; url: string }[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);

  // Channel menu and edit states
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [isEditChannelModalOpen, setIsEditChannelModalOpen] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');

  // Permissions: only admin or the user who created the channel
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'MASTER';
  const isCreator = Boolean(
    currentChannel?.created_by && (
      currentChannel.created_by === user?.id ||
      currentChannel.created_by === user?.email ||
      currentChannel.created_by.toLowerCase().trim() === user?.email?.toLowerCase().trim() ||
      currentChannel.created_by.toLowerCase().trim() === user?.name?.toLowerCase().trim()
    )
  );
  const canManageChannel = !isDirectMessage && (isAdmin || isCreator);

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

    const channelDestination = isDirectMessage ? `dm-${id}` : (currentChannel?.name || id || 'geral');

    sendMessage({
      channelId: channelDestination,
      sender: user?.name || 'Você',
      avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random`,
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
      const newAttachments = Array.from(files).map((file: File) => ({
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

  const handleDeleteChannel = async () => {
    setChannelMenuOpen(false);
    if (!currentChannel) return;

    if (currentChannel.name.toLowerCase() === 'geral') {
      await showAlert('Ação não permitida', 'O canal principal #geral é protegido e não pode ser excluído.');
      return;
    }

    if (!canManageChannel) {
      await showAlert('Permissão negada', 'Apenas administradores ou o criador deste canal podem excluí-lo.');
      return;
    }

    const confirmed = await confirm({
      title: `Excluir canal #${currentChannel.name}`,
      message: `Tem certeza que deseja excluir o canal #${currentChannel.name}? Todas as mensagens deste canal serão excluídas permanentemente. Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir Canal',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      await deleteChannel(currentChannel.id);
      navigate('/workspace/chat/geral');
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChannel) return;

    const cleanName = editChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) {
      await showAlert('Nome inválido', 'O nome do canal não pode ficar vazio.');
      return;
    }

    // Check if another channel already has this name
    const nameExists = channels.some(
      c => c.id !== currentChannel.id && c.name.toLowerCase().trim() === cleanName
    );
    if (nameExists) {
      await showAlert('Nome em uso', `Já existe outro canal com o nome #${cleanName}. Escolha outro nome.`);
      return;
    }

    await updateChannel(currentChannel.id, {
      name: cleanName,
      description: editChannelDescription.trim()
    });

    setIsEditChannelModalOpen(false);

    if (cleanName !== currentChannel.name) {
      navigate(`/workspace/chat/${cleanName}`);
    }
  };

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
              <img 
                src={targetUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`} 
                alt={title} 
                className="w-10 h-10 rounded-full shadow-sm object-cover" 
              />
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
              {isDirectMessage ? (targetUser?.email || 'Conversa direta') : (currentChannel?.description || 'Canal principal para comunicações')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400">
          {!isDirectMessage && (
            <button 
              onClick={() => setIsAddMemberModalOpen(true)} 
              className="p-2 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
              title="Adicionar pessoas"
            >
              <UserPlus size={18} />
            </button>
          )}

          {!isDirectMessage && (
            <div className="relative">
              <button 
                onClick={() => setChannelMenuOpen(prev => !prev)} 
                className="p-2 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Opções do canal"
              >
                <MoreVertical size={18} />
              </button>

              {channelMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setChannelMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                    {canManageChannel ? (
                      <>
                        <button
                          onClick={() => {
                            setChannelMenuOpen(false);
                            setEditChannelName(currentChannel?.name || '');
                            setEditChannelDescription(currentChannel?.description || '');
                            setIsEditChannelModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium cursor-pointer"
                        >
                          <Edit3 size={15} className="text-slate-500" />
                          <span>Editar Canal</span>
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button
                          onClick={handleDeleteChannel}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
                        >
                          <Trash2 size={15} className="text-red-500" />
                          <span>Excluir Canal</span>
                        </button>
                      </>
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500 flex items-start gap-2 bg-slate-50">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-500" />
                        <span>Apenas administradores ou o criador deste canal podem editá-lo ou excluí-lo.</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
                  <img src={msg.avatar} alt={msg.sender} className="w-full h-full rounded shadow-sm object-cover" />
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
                          <a 
                            key={i} 
                            href={att.url} 
                            download={att.name} 
                            className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-slate-50 shadow-sm"
                          >
                            <FileIcon size={16} />
                            <span className="truncate max-w-[150px]">{att.name}</span>
                          </a>
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
      <div className="p-3 md:p-4 bg-white border-t border-slate-200">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 p-2 bg-slate-50 rounded-lg overflow-x-auto">
            {attachments.map((att, index) => (
              <div key={index} className="relative group shrink-0">
                {att.type === 'image' ? (
                  <img src={att.url} alt="preview" className="h-16 w-16 object-cover rounded border border-slate-200" />
                ) : (
                  <div className="h-16 w-16 bg-white border border-slate-200 rounded flex flex-col items-center justify-center p-1 text-center">
                    <FileIcon size={20} className="text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 truncate w-full">{att.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Emoji picker simple panel */}
        {showEmojis && (
          <div className="mb-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm flex gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMessage(prev => prev + emoji)}
                className="text-lg hover:bg-slate-100 p-1 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-white overflow-hidden shadow-xs">
          {/* Format Toolbar */}
          <div className="flex items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50/50 text-slate-500">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFileChange(e, 'file')} 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={imageInputRef} 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'image')} 
              className="hidden" 
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-slate-200 rounded transition-colors" title="Anexar arquivo"><Paperclip size={18} /></button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className="p-1 hover:bg-slate-200 rounded transition-colors" title="Inserir imagem"><ImageIcon size={18} /></button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button type="button" onClick={() => insertFormatting('**')} className="text-sm font-bold p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Negrito">B</button>
            <button type="button" onClick={() => insertFormatting('*')} className="text-sm italic p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Itálico">I</button>
            <button type="button" onClick={() => insertFormatting('__')} className="text-sm underline p-1 hover:bg-slate-200 rounded transition-colors tooltip-target hidden sm:block" data-tooltip="Sublinhado">U</button>
            <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block"></div>
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 hover:bg-slate-200 rounded transition-colors" title="Emojis"><Smile size={18} /></button>
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
                className={cn("p-1 rounded transition-colors cursor-pointer", showEmojis ? "text-blue-600 bg-blue-50" : "hover:text-slate-600")}
              >
                <Smile size={20} />
              </button>
              <button 
                type="submit" 
                disabled={!message.trim() && attachments.length === 0}
                className={cn(
                  "p-1.5 rounded transition-colors cursor-pointer",
                  message.trim() || attachments.length > 0 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" : "bg-slate-100 text-slate-300 cursor-not-allowed"
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

      {/* Edit Channel Modal */}
      {isEditChannelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Hash size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Editar Canal</h3>
              </div>
              <button 
                onClick={() => setIsEditChannelModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateChannel} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Canal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</span>
                  <input
                    type="text"
                    value={editChannelName}
                    onChange={(e) => setEditChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="ex: avisos-importantes"
                    required
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nomes devem conter letras minúsculas e hifens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={editChannelDescription}
                  onChange={(e) => setEditChannelDescription(e.target.value)}
                  rows={3}
                  placeholder="Qual é o propósito deste canal?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditChannelModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Adicionar pessoas a #{title}</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg cursor-pointer"
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
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
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
