import { useAuth } from '../../contexts/AuthContext';
import { Heart, LogOut, Camera, Calendar, ArrowRight, Gift, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SponsorDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
              <Heart size={20} className="text-emerald-100" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Portal do Padrinho</h1>
              <p className="text-emerald-200 text-sm">Olá, {user?.name}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors text-sm font-medium bg-emerald-700/50 px-4 py-2 rounded-xl"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 blur-3xl"></div>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Obrigado por transformar vidas!</h2>
            <p className="text-slate-600">Sua contribuição mensal garante nutrição, educação e um futuro melhor para suas crianças apadrinhadas.</p>
          </div>
          <div className="relative z-10 shrink-0">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2">
              <Gift size={20} /> Fazer Doação Extra
            </button>
          </div>
        </div>

        {/* Sponsored Children */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Minhas Crianças <span className="bg-emerald-100 text-emerald-700 text-sm px-2 py-0.5 rounded-full">1</span>
          </h3>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Child Profile */}
              <div className="md:w-1/3 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-slate-200 mb-4 overflow-hidden border-4 border-white shadow-md">
                  <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop" alt="Criança" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Joãozinho, 5 anos</h4>
                <p className="text-slate-500 text-sm mb-4">Moçambique, Aldeia X</p>
                <div className="w-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg mb-2">
                  No programa há 8 meses
                </div>
                <button className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors mt-2">
                  Escrever Cartinha
                </button>
              </div>

              {/* Updates Timeline */}
              <div className="md:w-2/3 p-8">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  Últimas Atualizações
                </h4>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  
                  {/* Update 1 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Activity size={18} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">Consulta de Retorno</div>
                        <time className="text-xs font-medium text-emerald-600">Hoje</time>
                      </div>
                      <div className="text-slate-600 text-sm">Joãozinho ganhou 800g este mês! Ele já está na zona verde da curva de nutrição.</div>
                    </div>
                  </div>

                  {/* Update 2 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Camera size={18} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">Nova Foto</div>
                        <time className="text-xs font-medium text-slate-500">Há 2 meses</time>
                      </div>
                      <div className="text-slate-600 text-sm mb-3">Recebemos uma nova foto do Joãozinho na escola!</div>
                      <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop" alt="Nova foto" className="w-full h-32 object-cover rounded-xl" />
                    </div>
                  </div>

                  {/* Update 3 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Calendar size={18} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">Início do Apadrinhamento</div>
                        <time className="text-xs font-medium text-slate-500">Há 8 meses</time>
                      </div>
                      <div className="text-slate-600 text-sm">Obrigado por se juntar à nossa família!</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
