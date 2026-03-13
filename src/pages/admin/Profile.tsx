import React, { useState } from 'react';
import { 
  User,
  Shield, 
  Bell, 
  Globe, 
  Mail, 
  Phone, 
  Camera, 
  Fingerprint, 
  Key, 
  Clock, 
  Smartphone, 
  SmartphoneNfc, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Profile() {
  const { user } = useAuth();
  
  // Profile State
  const [profileInfo, setProfileInfo] = useState({
    name: user?.name || 'Administrador YAH Hope',
    email: user?.email || 'gestor@yahope.org',
    phone: '',
    about: 'Atuando na gestão administrativa do projeto YAH Hope.'
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    system: { web: true, email: true, sms: false },
    financial: { web: true, email: true, sms: true },
    health: { web: true, email: false, sms: false }
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (category: keyof typeof notifications, channel: 'web' | 'email' | 'sms') => {
    setNotifications(prev => ({
      ...prev,
      [category]: { ...prev[category], [channel]: !prev[category][channel] }
    }));
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl">
                <User className="text-white" size={24} />
              </div>
              Meu Perfil
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Gerencie suas informações pessoais e preferências.</p>
          </div>
          
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200 w-full sm:w-auto justify-center">
            <Save size={20} /> Salvar Alterações
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border-2 border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden font-black text-4xl">
                  {user?.avatar || profileInfo.name.charAt(0)}
                </div>
                <button className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-colors border-4 border-white active:scale-90">
                  <Camera size={20} />
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{profileInfo.name}</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">{user?.role || 'Usuário'}</p>
              
              <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="p-2 bg-slate-50 rounded-xl"><Mail size={16} /></div>
                  <span className="text-xs font-bold tracking-wider truncate">{profileInfo.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 space-y-6">
              <div className="p-4 bg-white/10 rounded-2xl w-fit">
                <Shield size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-tighter">Status de Segurança</h4>
                <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                  Sua conta está protegida com autenticação em duas etapas.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Força da Senha</span>
                  <span className="text-emerald-400">Excelente</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-8 text-left">
            {/* Basic Info */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8 px-2">
                <User className="text-slate-900" size={24} />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Informações Básicas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileInfo.name} 
                    onChange={(e) => handleProfileChange('name', e.target.value)} 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">E-mail</label>
                  <input 
                    type="email" 
                    value={profileInfo.email} 
                    readOnly
                    className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-slate-400 cursor-not-allowed text-sm outline-none" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sobre</label>
                  <textarea 
                    rows={3}
                    value={profileInfo.about}
                    onChange={(e) => handleProfileChange('about', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-100 transition-all text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8 px-2">
                <Bell className="text-slate-900" size={24} />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Notificações Diretas</h3>
              </div>
              
              <div className="space-y-12">
                {Object.entries(notifications).map(([category, channels]) => (
                  <div key={category} className="space-y-6 text-left">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="font-bold text-slate-900 uppercase text-xs tracking-[0.2em]">
                        {category === 'system' ? 'Alertas do Sistema' : category === 'financial' ? 'Alertas Financeiros' : 'Alertas de Saúde'}
                      </h4>
                      <div className="h-px flex-1 bg-slate-50 ml-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(channels).map(([channel, enabled]) => (
                        <div 
                          key={channel}
                          onClick={() => handleNotificationToggle(category as any, channel as any)}
                          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4 group ${
                            enabled ? 'bg-white border-slate-100 shadow-lg shadow-slate-100' : 'bg-slate-50 border-transparent'
                          }`}
                        >
                          <div className={`p-4 rounded-2xl transition-all ${
                            enabled ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {channel === 'web' ? <Globe size={20} /> : channel === 'email' ? <Mail size={20} /> : <Smartphone size={20} />}
                          </div>
                          <div className="text-center">
                            <p className="font-black text-slate-900 uppercase text-[10px] tracking-widest">
                              {channel === 'web' ? 'Navegador' : channel === 'email' ? 'E-mail' : 'SMS / Push'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{enabled ? 'ATIVADO' : 'DESATIVADO'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-8 px-2">
                <Shield className="text-slate-900" size={24} />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Segurança & Acesso</h3>
              </div>
              
              <div className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-200 text-slate-500 rounded-2xl">
                      <Key size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-sm uppercase tracking-widest">Alterar Senha</p>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Última alteração há 3 meses</p>
                    </div>
                  </div>
                  <button className="bg-white hover:bg-slate-900 hover:text-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-200 shadow-sm active:scale-95">Gerenciar</button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                      <SmartphoneNfc size={24} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-emerald-900 text-sm uppercase tracking-widest">Autenticação 2FA</p>
                        <span className="bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black tracking-widest">ATIVADO</span>
                      </div>
                      <p className="text-xs text-emerald-600/70 font-bold uppercase mt-1 tracking-wider">Proteção extra por aplicativo</p>
                    </div>
                  </div>
                  <button className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-100 shadow-sm active:scale-95">Configurar</button>
                </div>

                {/* Session History */}
                <div className="mt-8 pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="text-slate-400" size={18} />
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-[0.2em]">Sessões Ativas</h4>
                  </div>
                  
                  <div className="divide-y divide-slate-50">
                    {[1, 2].map(i => (
                      <div key={i} className="py-4 flex items-center justify-between group first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-slate-100 transition-colors">
                            <Smartphone size={16} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900 text-xs">MacBook Pro - São Paulo, BR</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Safari • {i === 1 ? 'Atual' : 'Há 2 dias'}</p>
                          </div>
                        </div>
                        {i === 1 ? <CheckCircle2 size={16} className="text-emerald-500" /> : <button className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors">Sair</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
