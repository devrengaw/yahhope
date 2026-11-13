import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';
import { UNIVERSITY_PERMISSION_OPTIONS } from '../../lib/universityPermissions';

export function UniversitySettings() {
  const { config, can, saveModuleConfig } = useUniversity();

  const [programName, setProgramName] = useState(config.program_name);
  const [shortDescription, setShortDescription] = useState(config.short_description);
  const [fullDescription, setFullDescription] = useState(config.full_description);
  const [fullScholarshipAmount, setFullScholarshipAmount] = useState(config.full_scholarship_amount);
  const [partialQuotaAmount, setPartialQuotaAmount] = useState(config.partial_quota_amount);
  const [defaultGeneralAmount, setDefaultGeneralAmount] = useState(config.default_general_amount);
  const [counterpartHoursRequired, setCounterpartHoursRequired] = useState(
    config.counterpart_hours_required
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveModuleConfig({
      program_name: programName,
      short_description: shortDescription,
      full_description: fullDescription,
      full_scholarship_amount: Number(fullScholarshipAmount),
      partial_quota_amount: Number(partialQuotaAmount),
      default_general_amount: Number(defaultGeneralAmount),
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
          <Settings className="text-indigo-600" size={28} />
          Configurações do Módulo Futuro Universitário
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Parâmetros de valores das modalidades, textos institucionais do Portal e governança de permissões.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor Padrão — Padrinho Individual (R$/mês)
            </label>
            <input
              type="number"
              value={fullScholarshipAmount}
              onChange={e => setFullScholarshipAmount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor Padrão — Apoiador Parcial (R$/mês)
            </label>
            <input
              type="number"
              value={partialQuotaAmount}
              onChange={e => setPartialQuotaAmount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor Sugerido — Mantenedor Geral (R$/mês)
            </label>
            <input
              type="number"
              value={defaultGeneralAmount}
              onChange={e => setDefaultGeneralAmount(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
            />
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
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>{savedSuccess ? 'Configurações Salvas!' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>

      {/* Matriz de Permissões Internas do Módulo */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Permissões Internas Registradas no Sistema de Permissões Existente
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estas permissões são atribuídas aos usuários administrativos em{' '}
            <strong>Admin → Usuários → Editar Membro</strong> na propriedade <code>users.permissions</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UNIVERSITY_PERMISSION_OPTIONS.map(opt => {
            const hasPerm = can(opt.id);
            return (
              <div
                key={opt.id}
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  hasPerm
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  <span className="font-bold block">{opt.label}</span>
                  <code className="text-[10px] opacity-75">{opt.id}</code>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    hasPerm ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {hasPerm ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
