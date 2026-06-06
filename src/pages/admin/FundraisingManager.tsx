import React, { useState } from 'react';
import { Target, TrendingUp, DollarSign, Plus, Trash2, CheckCircle2, Clock, Check, Edit2, X } from 'lucide-react';
import { useFundraising, CampaignMilestone } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';

export function FundraisingManager() {
  const { campaign, donations, updateCampaign, addMilestone, removeMilestone, approveDonation } = useFundraising();
  const [activeTab, setActiveTab] = useState<'config' | 'donations'>('config');

  // Milestone Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const [campaignTitle, setCampaignTitle] = useState(campaign.title);
  const [campaignDesc, setCampaignDesc] = useState(campaign.description);
  const [campaignGoal, setCampaignGoal] = useState(campaign.target_amount.toString());
  const [acceptPix, setAcceptPix] = useState(campaign.accept_pix ?? true);
  const [acceptCard, setAcceptCard] = useState(campaign.accept_card ?? true);

  const handleSaveCampaign = async () => {
    const result = await updateCampaign({
      title: campaignTitle,
      description: campaignDesc,
      target_amount: parseFloat(campaignGoal),
      accept_pix: acceptPix,
      accept_card: acceptCard
    }) as any;
    
    if (result && result.error) {
      alert('Erro ao salvar no banco (Verifique as Permissões): ' + result.error.message);
    } else {
      alert('Configurações da campanha salvas com sucesso!');
    }
  };

  const handleAddOrEditMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTarget) return;

    if (editingMilestoneId) {
      updateMilestone(editingMilestoneId, {
        title: newTitle,
        target_amount: parseFloat(newTarget),
        description: newDesc
      });
      setEditingMilestoneId(null);
    } else {
      addMilestone({
        title: newTitle,
        target_amount: parseFloat(newTarget),
        description: newDesc
      });
    }

    setNewTitle('');
    setNewTarget('');
    setNewDesc('');
  };

  const startEditMilestone = (m: CampaignMilestone) => {
    setEditingMilestoneId(m.id);
    setNewTitle(m.title);
    setNewTarget(m.target_amount.toString());
    setNewDesc(m.description);
  };

  const cancelEdit = () => {
    setEditingMilestoneId(null);
    setNewTitle('');
    setNewTarget('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Captação de Recursos</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure a régua e aprove doações.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('config')}
            className={cn(
              "px-6 py-4 font-bold text-sm border-b-2 transition-colors",
              activeTab === 'config' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            Configuração da Campanha
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={cn(
              "px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'donations' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            Doações
            {donations.filter(d => d.status === 'pending').length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px]">
                {donations.filter(d => d.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* General Config */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-emerald-500" />
                  Geral
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título da Campanha</label>
                    <input 
                      type="text" 
                      value={campaignTitle}
                      onChange={e => setCampaignTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Curta</label>
                    <textarea 
                      value={campaignDesc}
                      onChange={e => setCampaignDesc(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Meta Global (R$)</label>
                    <input 
                      type="number" 
                      value={campaignGoal}
                      onChange={e => setCampaignGoal(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-black text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Métodos de Pagamento Permitidos</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={acceptPix}
                          onChange={(e) => setAcceptPix(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">PIX ou Boleto</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={acceptCard}
                          onChange={(e) => setAcceptCard(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Cartão de Crédito</span>
                      </label>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveCampaign}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors w-full"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>

              {/* Milestones Config */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" />
                  Estágios (Régua)
                </h3>
                
                <form onSubmit={handleAddOrEditMilestone} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Valor do Estágio (R$)</label>
                      <input 
                        type="number" required
                        value={newTarget} onChange={e => setNewTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Ex: 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                      <input 
                        type="text" required
                        value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Ex: Aluguel"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                    <input 
                      type="text" 
                      value={newDesc} onChange={e => setNewDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Ex: Pagamento do aluguel do mês."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors">
                      {editingMilestoneId ? <Edit2 size={16} /> : <Plus size={16} />} 
                      {editingMilestoneId ? 'Salvar Alterações' : 'Adicionar Estágio'}
                    </button>
                    {editingMilestoneId && (
                      <button type="button" onClick={cancelEdit} className="px-4 bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center hover:bg-slate-300 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-3 mt-6">
                  {campaign.milestones.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{m.title}</p>
                          <p className="text-xs text-emerald-600 font-bold">R$ {m.target_amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditMilestone(m)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removeMilestone(m.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'donations' && (
            <div className="space-y-4">
              {donations.length === 0 ? (
                <div className="text-center p-12 text-slate-400">
                  <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhuma doação registrada ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="p-4">Doador</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4">Método</th>
                        <th className="p-4">Data</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {donations.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sm text-slate-900">{d.donor_name}</p>
                            <p className="text-xs text-slate-500">{d.donor_email}</p>
                          </td>
                          <td className="p-4 font-black text-slate-900">
                            R$ {d.amount}
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                              {d.payment_method}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {new Date(d.date).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {d.status === 'paid' ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-bold">
                                <CheckCircle2 size={12} /> Pago
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-bold">
                                <Clock size={12} /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {d.status === 'pending' && (
                              <button 
                                onClick={() => approveDonation(d.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-bold ml-auto"
                                title="Aprovar Pagamento Manualmente"
                              >
                                <Check size={14} /> Aprovar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
