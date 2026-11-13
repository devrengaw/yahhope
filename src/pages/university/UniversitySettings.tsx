import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversitySettings() {
  const { config, saveModuleConfig } = useUniversity();

  const [programName, setProgramName] = useState(config.program_name);
  const [shortDescription, setShortDescription] = useState(config.short_description);
  const [fullDescription, setFullDescription] = useState(config.full_description);
  const [fullScholarshipAmount, setFullScholarshipAmount] = useState(config.full_scholarship_amount);
  const [fullScholarshipAmountMzn, setFullScholarshipAmountMzn] = useState(config.full_scholarship_amount_mzn);
  const [partialQuotaAmount, setPartialQuotaAmount] = useState(config.partial_quota_amount);
  const [partialQuotaAmountMzn, setPartialQuotaAmountMzn] = useState(config.partial_quota_amount_mzn);
  const [defaultGeneralAmount, setDefaultGeneralAmount] = useState(config.default_general_amount);
  const [defaultGeneralAmountMzn, setDefaultGeneralAmountMzn] = useState(config.default_general_amount_mzn);
  const [counterpartHoursRequired, setCounterpartHoursRequired] = useState(
    config.counterpart_hours_required
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProgramName(config.program_name);
    setShortDescription(config.short_description);
    setFullDescription(config.full_description);
    setFullScholarshipAmount(config.full_scholarship_amount);
    setFullScholarshipAmountMzn(config.full_scholarship_amount_mzn);
    setPartialQuotaAmount(config.partial_quota_amount);
    setPartialQuotaAmountMzn(config.partial_quota_amount_mzn);
    setDefaultGeneralAmount(config.default_general_amount);
    setDefaultGeneralAmountMzn(config.default_general_amount_mzn);
    setCounterpartHoursRequired(config.counterpart_hours_required);
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveModuleConfig({
      program_name: programName,
      short_description: shortDescription,
      full_description: fullDescription,
      full_scholarship_amount: Number(fullScholarshipAmount),
      full_scholarship_amount_mzn: Number(fullScholarshipAmountMzn),
      partial_quota_amount: Number(partialQuotaAmount),
      partial_quota_amount_mzn: Number(partialQuotaAmountMzn),
      default_general_amount: Number(defaultGeneralAmount),
      default_general_amount_mzn: Number(defaultGeneralAmountMzn),
      counterpart_hours_required: Number(counterpartHoursRequired),
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="text-slate-700" size={28} />
          Configurações do Módulo Futuro Universitário
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Parâmetros de valores das modalidades (em Reais e Meticais) e textos institucionais do Portal.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Oficial do Programa</label>
            <input
              type="text"
              value={programName}
              onChange={e => setProgramName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contrapartida Semestral Mínima (Horas Comunitárias)
            </label>
            <input
              type="number"
              value={counterpartHoursRequired}
              onChange={e => setCounterpartHoursRequired(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
          </div>
        </div>

        {/* Valores em Reais (BRL) e Meticais (MZN) por Modalidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Padrinho Individual
            </span>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Reais (R$/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={fullScholarshipAmount}
                onChange={e => setFullScholarshipAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Meticais (MT/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={fullScholarshipAmountMzn}
                onChange={e => setFullScholarshipAmountMzn(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Apoiador Parcial
            </span>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Reais (R$/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={partialQuotaAmount}
                onChange={e => setPartialQuotaAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Meticais (MT/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={partialQuotaAmountMzn}
                onChange={e => setPartialQuotaAmountMzn(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Mantenedor Geral
            </span>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Reais (R$/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={defaultGeneralAmount}
                onChange={e => setDefaultGeneralAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Valor em Meticais (MT/mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={defaultGeneralAmountMzn}
                onChange={e => setDefaultGeneralAmountMzn(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Resumo Curto (Exibido nos cards do Portal dos Mantenedores)
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Descrição Institucional Completa do Projeto
          </label>
          <textarea
            rows={3}
            value={fullDescription}
            onChange={e => setFullDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <ShieldCheck size={16} />
            <span>Filtro estrito de privacidade LGPD para mantenedores sempre ativo</span>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#878787] hover:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            {savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>{savedSuccess ? 'Configurações Salvas!' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
