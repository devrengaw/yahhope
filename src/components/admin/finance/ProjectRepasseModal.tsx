import React, { useState, useEffect } from 'react';
import { X, Send, DollarSign, Calendar, Wallet, Layers, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TransactionCategory } from '../../../pages/admin/Finance';

export interface RepassePayload {
  projectName: string;
  module: string;
  amount: number;
  date: string;
  account: string;
  description: string;
  notes?: string;
  category_id?: string;
}

interface ProjectRepasseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (repasse: RepassePayload) => Promise<void> | void;
  defaultModule?: 'nutrition' | 'communication' | 'global' | string;
  categories?: TransactionCategory[];
  lockModule?: boolean;
}

export function ProjectRepasseModal({
  isOpen,
  onClose,
  onSave,
  defaultModule = 'nutrition',
  categories = [],
  lockModule = false
}: ProjectRepasseModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>(defaultModule);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Conta Principal');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const mod = defaultModule || 'nutrition';
      setSelectedModule(mod);
      const defaultDesc = mod === 'nutrition' 
        ? 'Repasse Orçamentário - Casa Nutri'
        : mod === 'communication'
        ? 'Repasse Orçamentário - Comunicação'
        : 'Repasse para Projeto';
      setDescription(defaultDesc);
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setNotes('');
    }
  }, [isOpen, defaultModule]);

  if (!isOpen) return null;

  const handleModuleChange = (newMod: string) => {
    setSelectedModule(newMod);
    if (newMod === 'nutrition') {
      setDescription('Repasse Orçamentário - Casa Nutri');
    } else if (newMod === 'communication') {
      setDescription('Repasse Orçamentário - Comunicação');
    } else {
      setDescription('Repasse para Projeto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Informe um valor válido para o repasse.');
      return;
    }

    const incomeCat = categories.find(c => c.type === 'income');
    const projectName = selectedModule === 'nutrition' 
      ? 'Casa Nutri' 
      : selectedModule === 'communication' 
      ? 'Comunicação' 
      : 'Geral';

    setIsSubmitting(true);
    try {
      await onSave({
        projectName,
        module: selectedModule,
        amount: parsedAmount,
        date,
        account,
        description: description.trim() || `Repasse para ${projectName}`,
        notes: notes.trim() || undefined,
        category_id: incomeCat?.id
      });
      onClose();
    } catch (err) {
      console.error('Erro ao registrar repasse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
              <Send size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Repasse para Projeto
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                Transferência de Recursos e Orçamento
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          
          {/* Seletor de Projeto Destino */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Projeto / Setor de Destino
            </label>
            {lockModule ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm">
                <Building2 size={18} className="text-emerald-600" />
                {selectedModule === 'nutrition' ? 'Casa Nutri (Nutrição Infantil)' : selectedModule === 'communication' ? 'Comunicação' : selectedModule}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModuleChange('nutrition')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all",
                    selectedModule === 'nutrition' 
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <Building2 size={16} className={selectedModule === 'nutrition' ? "text-emerald-600" : "text-slate-400"} />
                  Casa Nutri
                </button>
                <button
                  type="button"
                  onClick={() => handleModuleChange('communication')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all",
                    selectedModule === 'communication' 
                      ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <Layers size={16} className={selectedModule === 'communication' ? "text-purple-600" : "text-slate-400"} />
                  Comunicação
                </button>
              </div>
            )}
          </div>

          {/* Valor do Repasse */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Valor do Repasse (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Data e Conta de Origem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Data da Transferência
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Conta de Origem
              </label>
              <div className="relative">
                <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Conta Principal">Conta Principal</option>
                  <option value="Conta Doações & Padrinhos">Conta Doações & Padrinhos</option>
                  <option value="Fundo de Reserva">Fundo de Reserva</option>
                  <option value="Conta Projetos">Conta Projetos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Descrição / Finalidade
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Repasse Orçamentário Mensal"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre a destinação deste repasse..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Salvando...' : 'Confirmar Repasse'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
