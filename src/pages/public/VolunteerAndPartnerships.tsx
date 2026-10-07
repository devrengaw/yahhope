import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Handshake, 
  Heart, 
  MapPin, 
  Globe2, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Calendar,
  DollarSign,
  Package,
  Wrench,
  TrendingUp,
  Award,
  FileCheck2
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

type TabMode = 'voluntariado' | 'parcerias';
type CorporatePartnershipType = 'investimento' | 'doacao_produto' | 'doacao_servico' | 'multiplas';

export function VolunteerAndPartnerships() {
  const [activeTab, setActiveTab] = useState<TabMode>('voluntariado');

  // ==========================================
  // ESTADO DO FORMULÁRIO DE VOLUNTARIADO
  // ==========================================
  const [volName, setVolName] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volCity, setVolCity] = useState('');
  const [volStateCountry, setVolStateCountry] = useState('');
  // Local onde deseja ser voluntário: Brasil, Moçambique ou Ambos
  const [volLocation, setVolLocation] = useState<'brasil' | 'mocambique' | 'ambos'>('brasil');
  const [volAvailability, setVolAvailability] = useState('Semanal (algumas horas por semana)');
  const [volSelectedAreas, setVolSelectedAreas] = useState<string[]>([]);
  const [volExperience, setVolExperience] = useState('');
  const [volMotivation, setVolMotivation] = useState('');

  const [volLoading, setVolLoading] = useState(false);
  const [volSuccess, setVolSuccess] = useState(false);
  const [volError, setVolError] = useState('');

  // ==========================================
  // ESTADO DO FORMULÁRIO DE PARCERIAS EMPRESARIAIS
  // ==========================================
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [corporatePhone, setCorporatePhone] = useState('');
  const [partnershipType, setPartnershipType] = useState<CorporatePartnershipType>('investimento');
  const [websiteSocial, setWebsiteSocial] = useState('');
  const [proposalDetails, setProposalDetails] = useState('');

  const [partLoading, setPartLoading] = useState(false);
  const [partSuccess, setPartSuccess] = useState(false);
  const [partError, setPartError] = useState('');

  const AREAS_OPTIONS = [
    'Saúde / Medicina / Enfermagem',
    'Nutrição / Alimentação',
    'Educação / Alfabetização infantil',
    'Comunicação / Fotografia / Vídeo / Mídias',
    'Tecnologia / Design / Desenvolvimento',
    'Logística / Operações de Campo',
    'Apoio Administrativo / Captação de Recursos',
    'Aconselhamento / Apoio Psicológico / Capelania',
    'Outra área de atuação'
  ];

  const toggleArea = (area: string) => {
    if (volSelectedAreas.includes(area)) {
      setVolSelectedAreas(volSelectedAreas.filter(a => a !== area));
    } else {
      setVolSelectedAreas([...volSelectedAreas, area]);
    }
  };

  // Envio de Voluntariado
  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVolError('');

    if (!volName.trim() || !volEmail.trim() || !volPhone.trim() || !volCity.trim() || !volMotivation.trim()) {
      setVolError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setVolLoading(true);

    const payload = {
      name: volName.trim(),
      email: volEmail.trim(),
      phone: volPhone.trim(),
      city: volCity.trim(),
      state_country: volStateCountry.trim() || 'Brasil',
      desired_location: volLocation,
      availability: volAvailability,
      skills_areas: volSelectedAreas,
      experience: volExperience.trim(),
      motivation: volMotivation.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 1. Salvar no localStorage como contingência
    try {
      const existing = JSON.parse(localStorage.getItem('yahhope_volunteer_applications') || '[]');
      existing.unshift(payload);
      localStorage.setItem('yahhope_volunteer_applications', JSON.stringify(existing));
    } catch (err) {
      console.warn('Backup local de voluntariado falhou', err);
    }

    // 2. Tentar salvar no Supabase
    try {
      const { error } = await supabase
        .from('volunteer_applications')
        .insert(payload);

      if (error) {
        console.warn('Supabase volunteer insert error (saved locally):', error);
      }
    } catch (err) {
      console.warn('Supabase request error (saved locally):', err);
    }

    setVolLoading(false);
    setVolSuccess(true);
  };

  // Envio de Parcerias Empresariais
  const handleCorporatePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartError('');

    if (!companyName.trim() || !contactPerson.trim() || !corporateEmail.trim() || !corporatePhone.trim() || !proposalDetails.trim()) {
      setPartError('Por favor, preencha todos os campos corporativos obrigatórios (*).');
      return;
    }

    setPartLoading(true);

    const payload = {
      company_name: companyName.trim(),
      contact_person: `${contactPerson.trim()}${contactRole.trim() ? ` (${contactRole.trim()})` : ''}`,
      email: corporateEmail.trim(),
      phone: corporatePhone.trim(),
      partnership_type: partnershipType,
      cnpj: companyCnpj.trim() || null,
      website_social: websiteSocial.trim() || null,
      proposal_details: proposalDetails.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 1. Salvar no localStorage como backup garantido
    try {
      const existing = JSON.parse(localStorage.getItem('yahhope_corporate_partnerships') || '[]');
      existing.unshift(payload);
      localStorage.setItem('yahhope_corporate_partnerships', JSON.stringify(existing));
    } catch (err) {
      console.warn('Backup local de parcerias empresariais falhou', err);
    }

    // 2. Tentar salvar no Supabase
    try {
      const { error } = await supabase
        .from('corporate_partnerships')
        .insert(payload);

      if (error) {
        console.warn('Supabase corporate partnership insert error (saved locally):', error);
      }
    } catch (err) {
      console.warn('Supabase request error (saved locally):', err);
    }

    setPartLoading(false);
    setPartSuccess(true);
  };

  return (
    <div className="min-w-0 bg-white">
      <SEO 
        title="Voluntariado & Parcerias Empresariais | YAH Hope" 
        description="Junte-se à nossa missão no Brasil ou em Moçambique. Seja voluntário ou torne sua empresa uma parceira doadora investindo em um Brasil e em um mundo melhor."
        keywords="voluntariado, empresas parceiras, investimento social privado, doacao corporativa, esg ong, doar para ong, yah hope"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200/80 shadow-sm text-xs font-gotham-bold text-[#F49853] mb-6">
            <Sparkles size={14} className="animate-spin-slow" />
            <span>Faça Parte Desta Transformação</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto font-gotham-bold">
            Una seu talento pessoal ou <span className="text-[#F49853]">sua empresa</span> à missão de transformar vidas.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-gotham-light leading-relaxed">
            Seja atuando diretamente como voluntário no <strong className="font-gotham-bold text-slate-800">Brasil</strong> ou em <strong className="font-gotham-bold text-slate-800">Moçambique</strong>, ou conectando sua empresa para doar recursos e construir um futuro com dignidade.
          </p>

          {/* Abas Alternadoras no Topo */}
          <div className="mt-10 inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md">
            <button
              onClick={() => setActiveTab('voluntariado')}
              className={cn(
                "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl font-gotham-bold text-xs sm:text-sm transition-all cursor-pointer",
                activeTab === 'voluntariado'
                  ? "bg-[#F49853] text-white shadow-md shadow-orange-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Users size={18} />
              <span>Quero Ser Voluntário</span>
            </button>

            <button
              onClick={() => setActiveTab('parcerias')}
              className={cn(
                "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl font-gotham-bold text-xs sm:text-sm transition-all cursor-pointer",
                activeTab === 'parcerias'
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Building2 size={18} />
              <span>Empresas Parceiras</span>
            </button>
          </div>

        </div>
      </section>

      {/* Conteúdo Dinâmico por Aba */}
      {activeTab === 'voluntariado' ? (
        /* ========================================================================= */
        /* ABA 1: VOLUNTARIADO                                                      */
        /* ========================================================================= */
        <div>
          {/* Informações sobre onde atuar */}
          <section className="py-14 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs uppercase font-gotham-bold text-[#F49853] tracking-wider block mb-2">
                  Duas Frentes de Missão
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-gotham-bold">
                  Onde você deseja servir com seu tempo e vocação?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Card Brasil */}
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <MapPin size={24} />
                      </div>
                      <span className="text-[11px] font-gotham-bold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        Sede & Expansão
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 font-gotham-bold mb-3">
                      Voluntariado no Brasil
                    </h3>
                    <p className="text-sm text-slate-600 font-gotham-light leading-relaxed mb-6">
                      Atue na retaguarda estratégica, mobilização social, comunicação, design, captação, eventos e suporte comunitário em território nacional.
                    </p>

                    <ul className="space-y-2.5 text-xs text-slate-700 font-gotham-regular">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                        <span>Formato remoto e presencial (São Paulo e polos)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                        <span>Mobilização social, tecnologia, captação e mentoria</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                        <span>Horários flexíveis adaptados à sua rotina</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 font-gotham-light">
                    Ideal para quem deseja impactar vidas diretamente sem sair da sua cidade.
                  </div>
                </div>

                {/* Card Moçambique */}
                <div className="p-8 rounded-3xl bg-orange-50/50 border border-orange-200/80 hover:border-[#F49853] hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F49853] flex items-center justify-center font-bold">
                        <Globe2 size={24} />
                      </div>
                      <span className="text-[11px] font-gotham-bold bg-orange-100/70 text-orange-900 border border-orange-300 px-3 py-1 rounded-full uppercase tracking-wider">
                        Ação Humanitária de Campo
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 font-gotham-bold mb-3">
                      Voluntariado em Moçambique (Nampula)
                    </h3>
                    <p className="text-sm text-slate-600 font-gotham-light leading-relaxed mb-6">
                      Atuação direta na linha de frente: Casa Nutri, triagens médicas infantis, expedições clínicas nos vilarejos do interior e apoio logístico de campo.
                    </p>

                    <ul className="space-y-2.5 text-xs text-slate-700 font-gotham-regular">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#F49853] shrink-0" />
                        <span>Missões de curto, médio ou longo prazo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#F49853] shrink-0" />
                        <span>Foco em saúde, nutrição, educação e estrutura básica</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#F49853] shrink-0" />
                        <span>Capacitação prévia e acolhimento da equipe local</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-orange-200 text-xs text-slate-500 font-gotham-light">
                    Requer disponibilidade para deslocamento internacional e processo seletivo detalhado.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção do Formulário de Inscrição */}
          <section className="py-16 sm:py-20 bg-slate-50" id="formulario-voluntariado">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
                
                {volSuccess ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 font-gotham-bold mb-2">
                      Inscrição Recebida com Sucesso!
                    </h3>
                    <p className="text-slate-600 font-gotham-light max-w-md mx-auto text-sm leading-relaxed mb-6">
                      Muito obrigado pela sua disposição em servir com a YAH Hope. Nossa equipe de voluntariado analisará suas informações e entrará em contato com os próximos passos.
                    </p>
                    <button
                      onClick={() => {
                        setVolSuccess(false);
                        setVolName('');
                        setVolEmail('');
                        setVolPhone('');
                        setVolCity('');
                        setVolMotivation('');
                        setVolExperience('');
                        setVolSelectedAreas([]);
                      }}
                      className="bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-2.5 rounded-full font-gotham-bold text-xs transition-colors cursor-pointer"
                    >
                      Enviar Outra Inscrição
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-8 border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-[#F49853] font-gotham-bold text-xs uppercase tracking-wider mb-1">
                        <Users size={16} />
                        <span>Formulário de Inscrição de Voluntário</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-gotham-bold">
                        Conte-nos sobre você e sua disponibilidade
                      </h2>
                      <p className="text-xs text-slate-500 font-gotham-light mt-1">
                        Preenchimento rápido em menos de 3 minutos.
                      </p>
                    </div>

                    {volError && (
                      <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-gotham-medium flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{volError}</span>
                      </div>
                    )}

                    <form onSubmit={handleVolunteerSubmit} className="space-y-6">
                      
                      {/* Onde tem vontade de ser voluntário? */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-200">
                        <label className="block text-xs sm:text-sm font-gotham-bold text-slate-900 mb-2">
                          Em qual local você tem vontade de ser um(a) voluntário(a)? *
                        </label>
                        <p className="text-[11px] text-slate-500 font-gotham-light mb-4">
                          Indique se você prefere atuar no Brasil, no campo em Moçambique ou em ambos:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <label 
                            onClick={() => setVolLocation('brasil')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all text-center",
                              volLocation === 'brasil' 
                                ? "border-[#F49853] bg-white shadow-sm ring-2 ring-orange-500/20" 
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                🇧🇷 No Brasil
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Sede, remoto ou apoio nacional
                            </span>
                          </label>

                          <label 
                            onClick={() => setVolLocation('mocambique')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all text-center",
                              volLocation === 'mocambique' 
                                ? "border-[#F49853] bg-white shadow-sm ring-2 ring-orange-500/20" 
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                🇲🇿 Em Moçambique
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Casa Nutri em Nampula e vilarejos
                            </span>
                          </label>

                          <label 
                            onClick={() => setVolLocation('ambos')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all text-center",
                              volLocation === 'ambos' 
                                ? "border-[#F49853] bg-white shadow-sm ring-2 ring-orange-500/20" 
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                🌍 Em Ambos
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Disponível para qualquer frente
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Dados Pessoais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Nome Completo *
                          </label>
                          <input 
                            type="text" 
                            required
                            value={volName}
                            onChange={e => setVolName(e.target.value)}
                            placeholder="Ex: Mariana Silva Santos"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            E-mail de Contato *
                          </label>
                          <input 
                            type="email" 
                            required
                            value={volEmail}
                            onChange={e => setVolEmail(e.target.value)}
                            placeholder="seuemail@exemplo.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            WhatsApp / Telefone *
                          </label>
                          <input 
                            type="tel" 
                            required
                            value={volPhone}
                            onChange={e => setVolPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Cidade Onde Mora *
                          </label>
                          <input 
                            type="text" 
                            required
                            value={volCity}
                            onChange={e => setVolCity(e.target.value)}
                            placeholder="Ex: São Paulo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Estado / País
                          </label>
                          <input 
                            type="text" 
                            value={volStateCountry}
                            onChange={e => setVolStateCountry(e.target.value)}
                            placeholder="Ex: SP - Brasil"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                          />
                        </div>
                      </div>

                      {/* Disponibilidade */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                          Qual é a sua disponibilidade de tempo?
                        </label>
                        <select
                          value={volAvailability}
                          onChange={e => setVolAvailability(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular bg-white"
                        >
                          <option value="Semanal (algumas horas por semana)">Semanal (algumas horas por semana no tempo livre)</option>
                          <option value="Fins de semana e feriados">Fins de semana e eventos pontuais</option>
                          <option value="Período integral em missões pontuais (1 a 4 semanas)">Expedições pontuais de 1 a 4 semanas (ex: Moçambique)</option>
                          <option value="Longo prazo (acima de 3 meses)">Longo prazo (acima de 3 meses)</option>
                          <option value="Outro formato flexível">Outro formato flexível</option>
                        </select>
                      </div>

                      {/* Áreas de Habilidade */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1.5">
                          Quais áreas combinam mais com você? (Pode selecionar mais de uma)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {AREAS_OPTIONS.map((area) => {
                            const isChecked = volSelectedAreas.includes(area);
                            return (
                              <label
                                key={area}
                                onClick={() => toggleArea(area)}
                                className={cn(
                                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                                  isChecked 
                                    ? "border-[#F49853] bg-orange-50/50 text-slate-900 font-gotham-medium" 
                                    : "border-slate-200 hover:bg-slate-50 text-slate-600 font-gotham-regular"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors",
                                  isChecked ? "bg-[#F49853] border-[#F49853] text-white" : "border-slate-300 bg-white"
                                )}>
                                  {isChecked && <Check size={12} />}
                                </div>
                                <span className="line-clamp-1">{area}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Experiência / Formação */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                          Profissão, formação acadêmica ou experiência prática
                        </label>
                        <input 
                          type="text" 
                          value={volExperience}
                          onChange={e => setVolExperience(e.target.value)}
                          placeholder="Ex: Enfermeira pediátrica / Designer gráfico / Estudante / Logística"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular"
                        />
                      </div>

                      {/* Motivação */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                          Por que você quer ser um voluntário da YAH Hope? *
                        </label>
                        <textarea 
                          required
                          rows={3}
                          value={volMotivation}
                          onChange={e => setVolMotivation(e.target.value)}
                          placeholder="Conte-nos brevemente o que move o seu coração para apoiar as crianças e famílias atendidas..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F49853] font-gotham-regular resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={volLoading}
                        className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3.5 rounded-xl font-gotham-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {volLoading ? (
                          <span>Enviando sua inscrição...</span>
                        ) : (
                          <>
                            <span>Enviar Inscrição de Voluntário</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center font-gotham-light">
                        Ao enviar, você autoriza a equipe da YAH Hope a entrar em contato sobre oportunidades voluntárias.
                      </p>

                    </form>
                  </div>
                )}

              </div>

            </div>
          </section>
        </div>
      ) : (
        /* ========================================================================= */
        /* ABA 2: EMPRESAS PARCEIRAS (INVESTINDO EM UM BRASIL MELHOR)               */
        /* ========================================================================= */
        <div>
          {/* Sessão Institucional Empresarial */}
          <section className="py-16 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-xs uppercase font-gotham-bold text-[#F49853] tracking-wider block mb-2">
                  Parcerias Corporativas com Propósito
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-gotham-bold tracking-tight">
                  Investindo em um Brasil melhor
                </h2>
                <p className="mt-4 text-base text-slate-600 font-gotham-light leading-relaxed">
                  Convidamos empresas e marcas conscientes a unirem suas forças com a YAH Hope. Seja investindo diretamente em nossas frentes de combate à desnutrição ou doando produtos e serviços que aceleram a nossa operação, sua empresa transforma vidas com total transparência e governança.
                </p>
              </div>

              {/* Como a empresa pode servir: 3 Formas */}
              <div className="mb-6 text-center">
                <h3 className="text-lg font-black text-slate-900 font-gotham-bold">
                  Como a sua empresa pode servir:
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                
                {/* 1. Investimento */}
                <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                      <DollarSign size={24} />
                    </div>
                    <span className="text-[11px] font-gotham-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-3">
                      Aporte Financeiro
                    </span>
                    <h4 className="text-xl font-black text-slate-900 font-gotham-bold mb-3">
                      Investimento
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-gotham-light leading-relaxed">
                      Aportes institucionais e repasses corporativos (pontuais ou mensais) que financiam poços artesianos, reforma de centros de nutrição, compra de leite terapêutico e manutenção das frentes de expansão no Brasil.
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 font-gotham-light flex items-center gap-1.5">
                    <FileCheck2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Recibo de doação institucional & prestação de contas</span>
                  </div>
                </div>

                {/* 2. Doação de Produto */}
                <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5">
                      <Package size={24} />
                    </div>
                    <span className="text-[11px] font-gotham-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-3">
                      Bens e Insumos
                    </span>
                    <h4 className="text-xl font-black text-slate-900 font-gotham-bold mb-3">
                      Doação de Produto
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-gotham-light leading-relaxed">
                      Doação direta de fórmulas nutricionais, alimentos não perecíveis, medicamentos essenciais, materiais escolares, uniformes, equipamentos médicos e materiais de construção.
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 font-gotham-light flex items-center gap-1.5">
                    <FileCheck2 size={15} className="text-blue-600 shrink-0" />
                    <span>Rastreio de entrega e distribuição nas bases</span>
                  </div>
                </div>

                {/* 3. Doação de Serviço */}
                <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#F49853] flex items-center justify-center mb-5">
                      <Wrench size={24} />
                    </div>
                    <span className="text-[11px] font-gotham-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-3">
                      Pro Bono & Estrutura
                    </span>
                    <h4 className="text-xl font-black text-slate-900 font-gotham-bold mb-3">
                      Doação de Serviço
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 font-gotham-light leading-relaxed">
                      Serviços de transporte e frete de cargas, consultorias contábeis e jurídicas, tecnologia, desenvolvimento, marketing, saúde ocupacional ou treinamento especializado de equipes.
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 font-gotham-light flex items-center gap-1.5">
                    <FileCheck2 size={15} className="text-[#F49853] shrink-0" />
                    <span>Potencialização direta da eficiência operacional</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Formulário Corporativo */}
          <section className="py-16 sm:py-20 bg-slate-50" id="formulario-empresas">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
                
                {partSuccess ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 font-gotham-bold mb-2">
                      Proposta Corporativa Enviada com Sucesso!
                    </h3>
                    <p className="text-slate-600 font-gotham-light max-w-md mx-auto text-sm leading-relaxed mb-6">
                      Agradecemos pela visão de sua empresa em investir em um Brasil e em um mundo melhor. Nossa diretoria de relações institucionais entrará em contato para agendarmos uma apresentação e desenhar o acordo de parceria.
                    </p>
                    <button
                      onClick={() => {
                        setPartSuccess(false);
                        setCompanyName('');
                        setCompanyCnpj('');
                        setContactPerson('');
                        setContactRole('');
                        setCorporateEmail('');
                        setCorporatePhone('');
                        setWebsiteSocial('');
                        setProposalDetails('');
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-gotham-bold text-xs transition-colors cursor-pointer"
                    >
                      Enviar Outra Proposta de Parceria
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-8 border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-2 text-slate-900 font-gotham-bold text-xs uppercase tracking-wider mb-1">
                        <Building2 size={16} className="text-[#F49853]" />
                        <span>Formulário de Parceria Empresarial</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-gotham-bold">
                        Cadastre sua empresa e faça parte deste impacto
                      </h2>
                      <p className="text-xs text-slate-500 font-gotham-light mt-1">
                        Preencha as informações para nossa coordenação institucional retornar o contato.
                      </p>
                    </div>

                    {partError && (
                      <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-gotham-medium flex items-center gap-3">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{partError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCorporatePartnershipSubmit} className="space-y-6">
                      
                      {/* Seleção do Tipo de Parceria (Como a empresa pode servir) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                        <label className="block text-xs sm:text-sm font-gotham-bold text-slate-900 mb-1">
                          Como a sua empresa deseja servir? *
                        </label>
                        <p className="text-[11px] text-slate-500 font-gotham-light mb-4">
                          Escolha o formato principal de colaboração que sua organização tem interesse em realizar:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          
                          {/* Opção 1: Investimento */}
                          <label
                            onClick={() => setPartnershipType('investimento')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all",
                              partnershipType === 'investimento'
                                ? "border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/20"
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <DollarSign size={15} className="text-emerald-600" />
                                Investimento
                              </span>
                              <input 
                                type="radio" 
                                name="part_type" 
                                checked={partnershipType === 'investimento'} 
                                onChange={() => setPartnershipType('investimento')}
                                className="text-emerald-600"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Aporte financeiro para projetos e infraestrutura
                            </span>
                          </label>

                          {/* Opção 2: Doação de Produto */}
                          <label
                            onClick={() => setPartnershipType('doacao_produto')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all",
                              partnershipType === 'doacao_produto'
                                ? "border-blue-500 bg-white shadow-sm ring-2 ring-blue-500/20"
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <Package size={15} className="text-blue-600" />
                                Doação de Produto
                              </span>
                              <input 
                                type="radio" 
                                name="part_type" 
                                checked={partnershipType === 'doacao_produto'} 
                                onChange={() => setPartnershipType('doacao_produto')}
                                className="text-blue-600"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Alimentos, fórmulas, insumos, maquinário
                            </span>
                          </label>

                          {/* Opção 3: Doação de Serviço */}
                          <label
                            onClick={() => setPartnershipType('doacao_servico')}
                            className={cn(
                              "p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all",
                              partnershipType === 'doacao_servico'
                                ? "border-[#F49853] bg-white shadow-sm ring-2 ring-orange-500/20"
                                : "border-slate-200 bg-white/70 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-gotham-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <Wrench size={15} className="text-[#F49853]" />
                                Doação de Serviço
                              </span>
                              <input 
                                type="radio" 
                                name="part_type" 
                                checked={partnershipType === 'doacao_servico'} 
                                onChange={() => setPartnershipType('doacao_servico')}
                                className="text-[#F49853]"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 font-gotham-light">
                              Frete, consultoria, tecnologia, auditoria pro bono
                            </span>
                          </label>

                        </div>
                      </div>

                      {/* Dados da Empresa */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Razão Social ou Nome Fantasia da Empresa *
                          </label>
                          <input 
                            type="text" 
                            required
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="Ex: Minha Empresa S.A."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            CNPJ (opcional)
                          </label>
                          <input 
                            type="text" 
                            value={companyCnpj}
                            onChange={e => setCompanyCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>
                      </div>

                      {/* Pessoa de Contato */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Nome do(a) Responsável pelo Contato *
                          </label>
                          <input 
                            type="text" 
                            required
                            value={contactPerson}
                            onChange={e => setContactPerson(e.target.value)}
                            placeholder="Ex: Rodrigo Albuquerque"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Cargo / Área de Atuação
                          </label>
                          <input 
                            type="text" 
                            value={contactRole}
                            onChange={e => setContactRole(e.target.value)}
                            placeholder="Ex: Diretor de ESG / Gerente de RH / Sócio"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            E-mail Corporativo *
                          </label>
                          <input 
                            type="email" 
                            required
                            value={corporateEmail}
                            onChange={e => setCorporateEmail(e.target.value)}
                            placeholder="contato@empresa.com.br"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                            Telefone / WhatsApp Comercial *
                          </label>
                          <input 
                            type="tel" 
                            required
                            value={corporatePhone}
                            onChange={e => setCorporatePhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                          />
                        </div>
                      </div>

                      {/* Site ou Redes da Empresa */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                          Website da Empresa ou LinkedIn (opcional)
                        </label>
                        <input 
                          type="text" 
                          value={websiteSocial}
                          onChange={e => setWebsiteSocial(e.target.value)}
                          placeholder="https://empresa.com.br"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular"
                        />
                      </div>

                      {/* Detalhes da Doação / Proposta */}
                      <div>
                        <label className="block text-xs font-gotham-bold text-slate-700 mb-1">
                          Como sua empresa gostaria de doar ou colaborar? *
                        </label>
                        <textarea 
                          required
                          rows={4}
                          value={proposalDetails}
                          onChange={e => setProposalDetails(e.target.value)}
                          placeholder="Ex: Gostaríamos de fazer uma doação financeira de investimento para a expansão no Brasil, doar lotes de suplementos/produtos ou oferecer nosso serviço de transporte pro bono..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 font-gotham-regular resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={partLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-gotham-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {partLoading ? (
                          <span>Enviando proposta corporativa...</span>
                        ) : (
                          <>
                            <span>Enviar Proposta de Parceria Empresarial</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center font-gotham-light">
                        Nossa equipe institucional entrará em contato em até 48 horas para alinhar a reunião e os detalhes da doação.
                      </p>

                    </form>
                  </div>
                )}

              </div>

            </div>
          </section>
        </div>
      )}

      {/* Faixa Inferior de Apoio e Transparência */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center p-4">
              <ShieldCheck size={28} className="text-[#F49853] mb-2" />
              <h4 className="font-gotham-bold text-slate-900 text-sm">Transparência & Auditoria</h4>
              <p className="text-xs text-slate-500 font-gotham-light mt-1">Prestações de contas formais para cada empresa e doador parceiro.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Heart size={28} className="text-[#92BF78] mb-2" />
              <h4 className="font-gotham-bold text-slate-900 text-sm">Vidas Transformadas</h4>
              <p className="text-xs text-slate-500 font-gotham-light mt-1">Sua empresa ligada a um propósito real de combate à desnutrição e dignidade.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <Clock size={28} className="text-[#88A1F2] mb-2" />
              <h4 className="font-gotham-bold text-slate-900 text-sm">Agilidade de Contato</h4>
              <p className="text-xs text-slate-500 font-gotham-light mt-1">Nossa equipe retornará rapidamente para formalizar o apoio.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
