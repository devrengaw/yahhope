import React, { useState, useEffect } from 'react';
import { X, Search, Users, Shield, User as UserIcon, Check } from 'lucide-react';
import { useTeam } from '../../../contexts/TeamContext';
import { supabase } from '../../../lib/supabase';

interface TeamManagementModalProps {
  onClose: () => void;
  initialTeam?: any;
}

export function TeamManagementModal({ onClose, initialTeam }: TeamManagementModalProps) {
  const { createTeam, addMember, removeMember, teamMembers } = useTeam();
  const [name, setName] = useState(initialTeam?.name || '');
  const [description, setDescription] = useState(initialTeam?.description || '');
  const [color, setColor] = useState(initialTeam?.color || '#3b82f6');
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!initialTeam;
  const currentMembers = isEditing ? (teamMembers[initialTeam.id] || []) : [];

  useEffect(() => {
    // Fetch all users to allow admin to add them
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, name, email, role');
      if (data) setAllUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    if (isEditing) {
      // Just update name/desc/color
      await supabase.from('workspace_teams').update({ name, description, color }).eq('id', initialTeam.id);
      window.location.reload(); // naive reload to refresh state
    } else {
      const newTeam = await createTeam(name, description, color);
      if (newTeam) {
        onClose();
      }
    }
    setLoading(false);
  };

  const toggleMember = async (userId: string) => {
    if (!initialTeam) return;
    const isMember = currentMembers.find(m => m.user_id === userId);
    
    if (isMember) {
      await removeMember(initialTeam.id, userId);
    } else {
      await addMember(initialTeam.id, userId, 'member');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Gerenciar Equipe' : 'Criar Nova Equipe'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Equipe</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Marketing Global"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Qual o objetivo desta equipe?"
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'].map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''}`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-base font-bold text-slate-800 mb-4">Membros da Equipe</h3>
              
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar usuários para adicionar..."
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {filteredUsers.map(u => {
                  const isMember = currentMembers.find(m => m.user_id === u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleMember(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isMember 
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {isMember ? 'Remover' : 'Adicionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar Equipe'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
