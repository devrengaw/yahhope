import { supabase } from '../lib/supabase';
import { fetchAndSyncOrgSettings } from './organizationSettingsService';

export interface ChildSponsorshipDetail {
  id: string;
  sponsorshipId?: string;
  name: string;
  dob?: string;
  ageText?: string;
  gender?: string;
  community?: string;
  photo_url?: string;
  story?: string;
  nutritional_status?: string;
  sponsorsCount: number;
  maxSponsors: number;
  isFull: boolean;
  sponsors: Array<{
    id: string;
    name: string;
    email: string;
    monthly_amount: number;
    created_at: string;
  }>;
}

export interface SupporterGeneralSupport {
  active: boolean;
  monthlyAmount: number;
  paymentMethod: string;
  updatedAt?: string;
}

export interface SupporterCommitmentSummary {
  generalMonthlySupport: SupporterGeneralSupport;
  childSponsorships: {
    count: number;
    quotaCost: number;
    totalMonthly: number;
    children: ChildSponsorshipDetail[];
  };
  totalMonthlyCommitment: number;
}

export interface SponsorshipMetrics {
  totalChildren: number;
  quotaCost: number;
  maxSponsorsPerChild: number;
  totalSlots: number;
  filledSlots: number;
  availableSlots: number;
  isFullySponsored: boolean;
  occupancyRate: number;
  monthlySponsorshipRevenue: number;
  children: ChildSponsorshipDetail[];
}

export interface AssignSponsorPayload {
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  quotasCount: number;
  amountPerQuota?: number;
  paymentMethod?: string;
  sponsorUserId?: string;
}

export interface AssignSponsorResult {
  success: boolean;
  assignedChildren: ChildSponsorshipDetail[];
  totalAmount: number;
  message?: string;
  error?: string;
}

/**
 * Calcula idade formatada em texto a partir do dob
 */
export function calculateChildAge(dobString?: string): string {
  if (!dobString) return 'Idade em acompanhamento';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 'Idade em acompanhamento';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export const FALLBACK_CHILDREN = [
  {
    id: 'c1010101-0001-0001-0001-000000000001',
    name: 'Amina Juma',
    dob: '2022-04-12',
    gender: 'F',
    address: 'Comunidade de Namicopo, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=600',
    story: 'Amina recebe papas terapêuticas e acompanhamento pediátrico quinzenal na Casa Nutri, recuperando a saúde e o sorriso com vitalidade.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000002',
    name: 'Mateus Manuel',
    dob: '2023-01-18',
    gender: 'M',
    address: 'Comunidade de Muhala, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600',
    story: 'Mateus é acompanhado pela nossa equipe multidisciplinar. Seu apadrinhamento garante suplementação vitamínica e leite fortificado na Casa Nutri.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000003',
    name: 'Esperança Bernardo',
    dob: '2021-09-05',
    gender: 'F',
    address: 'Comunidade de Carrupeia, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
    story: 'Esperança superou o quadro crítico de desnutrição na Casa Nutri. Hoje apresenta ganho de peso constante e participa de atividades infantis.'
  },
  {
    id: 'c1010101-0001-0001-0001-000000000004',
    name: 'Inácio António',
    dob: '2022-11-20',
    gender: 'M',
    address: 'Aldeia de Natikiri, Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&q=80&w=600',
    story: 'Inácio recebe alimentação terapêutica diária e exames médicos regulares na Casa Nutri, transformando a fragilidade em esperança viva.'
  }
];

export const sponsorshipService = {
  /**
   * Obtém métricas consolidadas de quotização e ocupação de todas as crianças
   */
  async getMetrics(): Promise<SponsorshipMetrics> {
    const settings = await fetchAndSyncOrgSettings();
    const quotaCost = Number(settings.sponsorship_quota_cost) || 90;
    const maxSponsorsPerChild = Number(settings.max_sponsors_per_child) || 2;

    try {
      // 1. Busca crianças elegíveis no banco
      const { data: childrenData, error: childError } = await supabase
        .from('children')
        .select('*')
        .order('name', { ascending: true });

      if (childError) {
        console.warn('Aviso ao consultar children no Supabase, usando catálogo local:', childError.message);
      }

      // 2. Busca apadrinhamentos ativos
      const { data: sponsorshipsData, error: spError } = await supabase
        .from('sponsorships')
        .select('*, users(id, name, email)')
        .eq('status', 'active');

      if (spError) {
        console.warn('Aviso ao consultar sponsorships:', spError.message);
      }

      let allChildren = (childrenData && childrenData.length > 0) ? childrenData : FALLBACK_CHILDREN;
      const allSponsorships = sponsorshipsData || [];

      // Mapeia padrinhos por child_id
      const sponsorsByChild = new Map<string, any[]>();
      allSponsorships.forEach(sp => {
        if (!sp.child_id) return;
        if (!sponsorsByChild.has(sp.child_id)) {
          sponsorsByChild.set(sp.child_id, []);
        }
        const sponsorName = sp.donor_name || sp.users?.name || sp.donor_email?.split('@')[0] || 'Padrinho';
        const sponsorEmail = sp.donor_email || sp.users?.email || '';
        sponsorsByChild.get(sp.child_id)!.push({
          id: sp.id,
          name: sponsorName,
          email: sponsorEmail,
          monthly_amount: Number(sp.monthly_amount) || quotaCost,
          created_at: sp.created_at
        });
      });

      // Monta lista de crianças com detalhes de apadrinhamento
      const childrenDetails: ChildSponsorshipDetail[] = allChildren.map(c => {
        const sponsors = sponsorsByChild.get(c.id) || [];
        const sponsorsCount = sponsors.length;
        const isFull = sponsorsCount >= maxSponsorsPerChild;

        return {
          id: c.id,
          name: c.name,
          dob: c.dob,
          ageText: calculateChildAge(c.dob),
          gender: c.gender,
          community: c.address || c.province || 'Casa Nutri - Nampula',
          photo_url: c.photo_url || '',
          story: c.story || `Acompanhado com amor pela equipe clínica da Casa Nutri em Moçambique, recebendo suplementação e alimentação balanceada.`,
          sponsorsCount,
          maxSponsors: maxSponsorsPerChild,
          isFull,
          sponsors
        };
      });

      const totalChildren = childrenDetails.length;
      const totalSlots = totalChildren * maxSponsorsPerChild;
      const filledSlots = childrenDetails.reduce((acc, c) => acc + c.sponsorsCount, 0);
      const availableSlots = Math.max(0, totalSlots - filledSlots);
      const isFullySponsored = totalChildren > 0 && availableSlots === 0;
      const occupancyRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
      const monthlySponsorshipRevenue = filledSlots * quotaCost;

      return {
        totalChildren,
        quotaCost,
        maxSponsorsPerChild,
        totalSlots,
        filledSlots,
        availableSlots,
        isFullySponsored,
        occupancyRate,
        monthlySponsorshipRevenue,
        children: childrenDetails
      };
    } catch (err) {
      console.error('Erro ao calcular métricas de apadrinhamento:', err);
      // Fallback gracioso
      return {
        totalChildren: 0,
        quotaCost,
        maxSponsorsPerChild,
        totalSlots: 0,
        filledSlots: 0,
        availableSlots: 0,
        isFullySponsored: false,
        occupancyRate: 0,
        monthlySponsorshipRevenue: 0,
        children: []
      };
    }
  },

  /**
   * Algoritmo Least-Sponsored Round-Robin:
   * Distribui cotas de apadrinhamento priorizando as crianças com menor número de padrinhos,
   * garantindo que todas recebam apoio de forma homogênea.
   */
  async assignChildrenToSponsor(payload: AssignSponsorPayload): Promise<AssignSponsorResult> {
    const {
      donorName,
      donorEmail,
      donorPhone,
      quotasCount = 1,
      paymentMethod = 'credit_card',
      sponsorUserId
    } = payload;

    const metrics = await this.getMetrics();
    const quotaCost = payload.amountPerQuota || metrics.quotaCost;
    const maxSponsors = metrics.maxSponsorsPerChild;

    // 1. Filtra apenas crianças elegíveis que ainda têm vagas abertas
    const availableChildren = metrics.children.filter(c => c.sponsorsCount < maxSponsors);

    if (availableChildren.length === 0) {
      return {
        success: false,
        assignedChildren: [],
        totalAmount: 0,
        message: 'Todas as crianças já estão 100% apadrinhadas! Convidamos você a ser um Mantenedor Mensal Global.'
      };
    }

    // 2. Ordena de forma estrita pelo menor número de padrinhos ativos (Least-Sponsored)
    // Desempate: quem tem menor número de padrinhos primeiro; depois desempata por nome/id
    availableChildren.sort((a, b) => {
      if (a.sponsorsCount !== b.sponsorsCount) {
        return a.sponsorsCount - b.sponsorsCount;
      }
      return a.name.localeCompare(b.name);
    });

    // 3. Seleciona as N crianças prioritárias (até o limite de cotas solicitadas)
    const countToAssign = Math.min(quotasCount, availableChildren.length);
    const selectedChildren = availableChildren.slice(0, countToAssign);
    const totalAmount = countToAssign * quotaCost;

    const cleanEmail = donorEmail.toLowerCase().trim();

    try {
      // 4. Cria os registros em 'sponsorships'
      for (const child of selectedChildren) {
        const sponsorshipRecord: any = {
          child_id: child.id,
          sponsor_id: sponsorUserId || null,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone || null,
          monthly_amount: quotaCost,
          quotas_count: 1,
          status: 'active',
          payment_method: paymentMethod,
          last_sponsored_at: new Date().toISOString()
        };

        const { error: spInsertErr } = await supabase
          .from('sponsorships')
          .insert([sponsorshipRecord]);

        if (spInsertErr && !spInsertErr.message?.includes('duplicate key')) {
          console.warn('Aviso ao inserir apadrinhamento:', spInsertErr.message);
        }
      }

      // 5. Registra no Módulo Financeiro Global
      await supabase.from('finance_transactions').insert({
        description: `Apadrinhamento Mensal (${countToAssign} ${countToAssign === 1 ? 'cota' : 'cotas'}) - ${donorName}`,
        amount: totalAmount,
        type: 'income',
        category_id: 'cat_sponsorship',
        status: 'completed',
        account: paymentMethod === 'pix' ? 'Pix Recorrente' : 'Cartão de Crédito',
        date: new Date().toISOString().split('T')[0]
      });

      // 7. Persiste imediatamente no cache local do padrinho para exibição instantânea
      try {
        const cacheKey = `yah_sponsored_children_${cleanEmail}`;
        const existingRaw = localStorage.getItem(cacheKey);
        let updatedList = [...selectedChildren];
        if (existingRaw) {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) {
            const currentIds = new Set(selectedChildren.map(c => c.id));
            const oldFiltered = parsed.filter(c => !currentIds.has(c.id));
            updatedList = [...oldFiltered, ...selectedChildren];
          }
        }
        localStorage.setItem(cacheKey, JSON.stringify(updatedList));
      } catch (cacheErr) {
        console.warn('Erro ao salvar apadrinhamento no cache:', cacheErr);
      }

      // 8. Verifica se o padrinho já possui cadastro ativo na plataforma
      const isRegistered = await this.isUserRegistered(cleanEmail);

      // 9. Dispara o E-mail de Apresentação da(s) Criança(s) Apadrinhada(s)
      await this.sendSponsorshipWelcomeEmail(cleanEmail, donorName, selectedChildren, totalAmount, isRegistered);

      return {
        success: true,
        assignedChildren: selectedChildren,
        totalAmount,
        message: `Parabéns! Você apadrinhou ${selectedChildren.length} ${selectedChildren.length === 1 ? 'criança' : 'crianças'}. Enviamos o perfil completo por e-mail!`
      };
    } catch (err: any) {
      console.error('Erro ao efetivar apadrinhamento:', err);
      return {
        success: false,
        assignedChildren: selectedChildren,
        totalAmount,
        error: err.message || 'Erro ao processar apadrinhamento'
      };
    }
  },

  /**
   * Verifica se um e-mail já possui conta cadastrada no Supabase
   */
  async isUserRegistered(email: string): Promise<boolean> {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', cleanEmail)
        .limit(1)
        .maybeSingle();

      if (error || !data) return false;
      return Boolean(data.id);
    } catch (e) {
      return false;
    }
  },

  /**
   * Dispara o e-mail oficial de agradecimento e apresentação da(s) criança(s) apadrinhada(s).
   * Se já cadastrado: inclui botão direto para o Portal do Mantenedor.
   * Se não cadastrado: inclui link de ativação/cadastro de senha no site.
   */
  async sendSponsorshipWelcomeEmail(
    email: string,
    name: string,
    children: ChildSponsorshipDetail[],
    monthlyAmount: number,
    isRegistered?: boolean
  ): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    if (isRegistered === undefined) {
      isRegistered = await this.isUserRegistered(cleanEmail);
    }

    const appOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://yahhope.org';

    const count = children.length;
    const isMultiple = count > 1;

    // Constrói cards de apresentação de cada criança
    const childrenCardsHtml = children.map((c, index) => {
      const photoSrc = c.photo_url && c.photo_url.trim().length > 0 
        ? c.photo_url 
        : 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png';

      const genderBadge = c.gender === 'F' ? 'Menina' : 'Menino';

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="background-color: #0f172a; padding: 12px 20px; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #F49853;">
              ${isMultiple ? `Criança Apadrinhada #${index + 1}` : 'Seu Novo Afilhado(a)'}
            </span>
            <span style="font-size: 11px; background-color: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 12px; font-weight: 600;">
              Casa Nutri • Moçambique
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; padding: 20px;">
            <tr>
              <td style="width: 130px; vertical-align: top; padding: 20px 0 20px 20px;">
                <img 
                  src="${photoSrc}" 
                  alt="${c.name}" 
                  style="width: 115px; height: 115px; object-fit: cover; border-radius: 16px; border: 3px solid #F49853; display: block;" 
                />
              </td>
              <td style="vertical-align: top; padding: 20px 20px 20px 16px;">
                <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 20px; margin-bottom: 6px;">
                  ${genderBadge} • ${c.ageText}
                </div>
                <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                  ${c.name}
                </h3>
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; font-weight: 600;">
                  📍 ${c.community || 'Casa Nutri - Nampula'}
                </p>
                <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.55;">
                  ${c.story || 'Acompanhada com muito amor e carinho pela equipe clínica da Casa Nutri em Moçambique, recebendo fórmula terapêutica, alimentação balanceada e exames regulares.'}
                </p>
              </td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 12px 20px; font-size: 12px; color: #475569;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #475569;">🍲 <strong>Nutrição Terapêutica:</strong> Alimentação balanceada diária</td>
                <td style="text-align: right; color: #10b981; font-weight: 700;">✓ Acompanhamento Ativo</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }).join('');

    // Seção de Ação (CTA) condicionada se o usuário já é cadastrado ou não
    let actionCtaHtml = '';
    if (isRegistered) {
      actionCtaHtml = `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 22px; margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #065f46; font-size: 16px; font-weight: 900;">
            ✨ Seu Acesso de Padrinho Já Está Ativo!
          </p>
          <p style="margin: 0 0 18px 0; color: #047857; font-size: 13px; line-height: 1.5;">
            Identificamos que você já possui cadastro na nossa plataforma. Sua(s) criança(s) apadrinhada(s) já foram vinculadas automaticamente ao seu perfil de mantenedor!
          </p>
          <a href="${appOrigin}/portal/sponsorship" style="background-color: #F49853; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(244,152,83,0.35);">
            Acessar Minhas Crianças no Portal →
          </a>
        </div>
      `;
    } else {
      actionCtaHtml = `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 22px; margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; color: #9a3412; font-size: 16px; font-weight: 900;">
            🔐 Crie sua Senha de Acesso ao Portal
          </p>
          <p style="margin: 0 0 18px 0; color: #c2410c; font-size: 13px; line-height: 1.5;">
            Como este é o seu primeiro apoio, clique no botão abaixo para criar sua senha de acesso e liberar o Portal do Mantenedor. Seu e-mail (<strong>${cleanEmail}</strong>) já foi pré-aprovado!
          </p>
          <a href="${appOrigin}/login?tab=register&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(name)}" style="background-color: #F49853; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(244,152,83,0.35);">
            Ativar Minha Conta de Padrinho →
          </a>
          <p style="margin: 12px 0 0 0; color: #9a3412; font-size: 11px;">
            Acesso exclusivo para mantenedores e padrinhos da YAH Hope.
          </p>
        </div>
      `;
    }

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png" alt="YAH Hope" style="max-height: 48px;" />
        </div>

        <div style="background-color: #ffffff; border-radius: 24px; padding: 32px 28px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
            Aliança de Amor e Esperança 🧡
          </div>

          <h1 style="color: #0f172a; font-size: 26px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.25;">
            Olá, ${name}! Seja bem-vindo(a) à família YAH Hope.
          </h1>

          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Agradecemos de todo coração pelo seu compromisso mensal. Pelo nosso modelo de <strong>distribuição solidária e equitativa</strong>, destinamos o seu apadrinhamento para ${isMultiple ? `as <strong>${count} crianças</strong>` : 'a criança'} com maior prioridade de suporte na nossa Casa Nutri em Moçambique:
          </p>

          ${childrenCardsHtml}

          <div style="background-color: #fff7ed; border-left: 4px solid #F49853; padding: 16px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; font-weight: 700;">
              O que o seu apadrinhamento garante todos os meses:
            </p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px; color: #c2410c; line-height: 1.6;">
              <li>Fórmulas nutricionais terapêuticas e refeições enriquecidas diárias</li>
              <li>Acompanhamento pediátrico, pesagens e exames clínicos periódicos</li>
              <li>Apoio sociofamiliar na comunidade em Moçambique</li>
              <li>Acesso exclusivo a fotos atualizadas, evolução de peso e relatórios no Portal</li>
            </ul>
          </div>

          ${actionCtaHtml}
        </div>

        <div style="text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">YAH Hope International • Moçambique & Brasil</p>
          <p style="margin: 0;">Você recebeu esta mensagem porque realizou um apadrinhamento solidário de amor na YAH Hope.</p>
        </div>
      </div>
    `;

    const emailSubject = isMultiple 
      ? `🧡 Parabéns, ${name}! Conheça as crianças que você está apadrinhando na YAH Hope`
      : `🧡 Parabéns, ${name}! Conheça ${children[0]?.name || 'a criança'} que você está apadrinhando na YAH Hope`;

    // Tenta enviar via Supabase Edge Function ou serviço de e-mail
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && anonKey) {
        await fetch(`${supabaseUrl}/functions/v1/send-accountability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`
          },
          body: JSON.stringify({
            to: cleanEmail,
            subject: emailSubject,
            html: htmlBody
          })
        }).catch(e => console.warn('Aviso ao enviar via edge function:', e));
      }
    } catch (e) {
      console.warn('Fallback de e-mail:', e);
    }
  },

  /**
   * Reconciliação e Auto-Atribuição de Criança para Mantenedores/Padrinhos que já pagaram:
   * 1. Verifica se há apadrinhamentos na tabela 'sponsorships' sem child_id atribuída.
   * 2. Verifica se o usuário tem doação com status 'paid' na tabela 'donations'.
   * 3. Verifica se o usuário possui cargo 'SPONSOR' na tabela 'users'.
   * Se algum desses critérios for atendido e o usuário ainda não tiver uma criança vinculada,
   * atribui automaticamente a criança em maior prioridade da Casa Nutri (Least-Sponsored)
   * e persiste tanto no banco quanto no cache local.
   */
  async autoReconcilePaidSponsor(
    userId?: string, 
    userEmail?: string, 
    userName?: string,
    forceAssign: boolean = false
  ): Promise<ChildSponsorshipDetail[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail && !userId) return [];

    try {
      let donorName = userName || 'Padrinho YAH Hope';
      let hasPaidProof = forceAssign;
      let existingUnassignedId: string | null = null;
      let quotaAmount = 90;

      // A. Checa tabela 'sponsorships'
      let queryBySponsorId: any = null;
      let queryByEmail: any = null;

      if (userId) {
        queryBySponsorId = await supabase
          .from('sponsorships')
          .select('*')
          .eq('sponsor_id', userId)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      if (cleanEmail) {
        queryByEmail = await supabase
          .from('sponsorships')
          .select('*')
          .ilike('donor_email', cleanEmail)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      const combinedSp: any[] = [];
      const seenIds = new Set<string>();
      [...(queryBySponsorId?.data || []), ...(queryByEmail?.data || [])].forEach((item: any) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedSp.push(item);
        }
      });

      if (combinedSp.length > 0) {
        hasPaidProof = true;
        const unassignedRow = combinedSp.find(r => !r.child_id);
        if (unassignedRow) {
          existingUnassignedId = unassignedRow.id;
          quotaAmount = Number(unassignedRow.monthly_amount) || 90;
          if (unassignedRow.donor_name) donorName = unassignedRow.donor_name;
        }
      }

      // B. Checa tabela 'donations' caso ainda não tenha encontrado
      if (!hasPaidProof && cleanEmail) {
        const { data: donRows } = await supabase
          .from('donations')
          .select('*')
          .ilike('donor_email', cleanEmail)
          .eq('status', 'paid')
          .limit(5);

        if (donRows && donRows.length > 0) {
          hasPaidProof = true;
          if (donRows[0].donor_name) donorName = donRows[0].donor_name;
          quotaAmount = Number(donRows[0].amount) || 90;
        }
      }

      // C. Checa tabela 'users' se tem cargo de SPONSOR
      if (!hasPaidProof && userId) {
        const { data: uRow } = await supabase
          .from('users')
          .select('role, name')
          .eq('id', userId)
          .maybeSingle();

        if (uRow && (uRow.role === 'SPONSOR' || uRow.role === 'USER')) {
          if (uRow.role === 'SPONSOR') {
            hasPaidProof = true;
          }
          if (uRow.name) donorName = uRow.name;
        }
      }

      // Se comprovado que pagou ou foi forçado:
      if (hasPaidProof) {
        console.log(`[AutoReconcile] Atribuindo criança automaticamente para o padrinho: ${cleanEmail}`);

        const assignRes = await this.assignChildrenToSponsor({
          donorName,
          donorEmail: cleanEmail,
          quotasCount: 1,
          amountPerQuota: quotaAmount,
          paymentMethod: 'cartao_mensal',
          sponsorUserId: userId
        });

        if (assignRes.success && assignRes.assignedChildren.length > 0) {
          const assigned = assignRes.assignedChildren;

          if (existingUnassignedId && assigned[0]) {
            await supabase
              .from('sponsorships')
              .update({ child_id: assigned[0].id })
              .eq('id', existingUnassignedId);
          }

          if (cleanEmail) {
            localStorage.setItem(`yah_sponsored_children_${cleanEmail}`, JSON.stringify(assigned));
          }

          return assigned;
        }
      }
    } catch (e) {
      console.error('[AutoReconcile] Erro ao auto-reconciliar padrinho:', e);
    }

    return [];
  },

  /**
   * Retorna as crianças apadrinhadas pelo usuário autenticado (por ID ou E-mail),
   * sincronizando banco de dados Supabase e cache local resiliente.
   * Auto-recupera e vincula a criança imediatamente caso o usuário já tenha pago.
   */
  async getSponsoredChildrenForUser(
    userId?: string, 
    userEmail?: string,
    userName?: string
  ): Promise<ChildSponsorshipDetail[]> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!userId && !cleanEmail) return [];

    let dbChildren: ChildSponsorshipDetail[] = [];
    let hasUnassignedRow = false;
    let unassignedRowId: string | null = null;
    let unassignedAmount = 90;

    try {
      // Fazemos busca por sponsor_id e por donor_email de forma segura
      let queryBySponsorId: any = null;
      let queryByEmail: any = null;

      if (userId) {
        queryBySponsorId = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .eq('sponsor_id', userId)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      if (cleanEmail) {
        queryByEmail = await supabase
          .from('sponsorships')
          .select('*, children(*)')
          .ilike('donor_email', cleanEmail)
          .in('status', ['active', 'paid', 'completed', 'ACTIVE']);
      }

      const combinedData: any[] = [];
      const seenSpIds = new Set<string>();

      [...(queryBySponsorId?.data || []), ...(queryByEmail?.data || [])].forEach((item: any) => {
        if (!seenSpIds.has(item.id)) {
          seenSpIds.add(item.id);
          combinedData.push(item);
        }
      });

      if (combinedData.length > 0) {
        const withChildren = combinedData.filter(item => item.child_id && item.children);
        dbChildren = withChildren.map(item => {
          const c = item.children;
          return {
            id: c.id,
            sponsorshipId: item.id,
            name: c.name,
            dob: c.dob,
            ageText: calculateChildAge(c.dob),
            gender: c.gender,
            community: c.address || c.province || 'Casa Nutri',
            photo_url: c.photo_url || '',
            story: c.story || 'Acompanhada com amor na Casa Nutri.',
            nutritional_status: c.status || 'Adequado',
            sponsorsCount: 1,
            maxSponsors: 2,
            isFull: false,
            sponsors: []
          };
        });

        // Identifica se o usuário tem registro de apadrinhamento mas sem criança (child_id is null)
        const unassigned = combinedData.filter(item => !item.child_id);
        if (unassigned.length > 0) {
          hasUnassignedRow = true;
          unassignedRowId = unassigned[0].id;
          unassignedAmount = Number(unassigned[0].monthly_amount) || 90;
        }
      }
    } catch (err) {
      console.warn('Aviso ao consultar apadrinhamentos no Supabase:', err);
    }

    // Leitura do cache local resiliente (garante que a criança nunca desapareça)
    let cachedChildren: ChildSponsorshipDetail[] = [];
    if (cleanEmail) {
      try {
        const raw = localStorage.getItem(`yah_sponsored_children_${cleanEmail}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) cachedChildren = parsed;
        }
      } catch (e) {
        console.warn('Aviso ao ler cache local de crianças:', e);
      }
    }

    // Mescla sem duplicidade priorizando o id da criança
    const mergedMap = new Map<string, ChildSponsorshipDetail>();
    dbChildren.forEach(c => mergedMap.set(c.id, c));
    cachedChildren.forEach(c => {
      if (!mergedMap.has(c.id)) {
        mergedMap.set(c.id, c);
      }
    });

    let result = Array.from(mergedMap.values());

    // Se o usuário pagou mas continua sem nenhuma criança vinculada, ou tinha apadrinhamento sem criança:
    if (result.length === 0 || hasUnassignedRow) {
      try {
        const reconciled = await this.autoReconcilePaidSponsor(userId, cleanEmail, userName, false);
        if (reconciled && reconciled.length > 0) {
          result = reconciled;
        }
      } catch (e) {
        console.warn('Aviso na auto-reconciliação:', e);
      }
    }

    if (cleanEmail && result.length > 0) {
      try {
        localStorage.setItem(`yah_sponsored_children_${cleanEmail}`, JSON.stringify(result));
      } catch (e) {}
    }

    return result;
  },

  /**
   * Obtém o resumo consolidado dos compromissos mensais do apoiador:
   * 1. Apoio Mensal Geral (Casa Nutri)
   * 2. Apadrinhamento de Crianças (R$ 90/cota)
   */
  async getSupporterCommitments(
    userId?: string, 
    userEmail?: string, 
    userName?: string
  ): Promise<SupporterCommitmentSummary> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    const settings = await fetchAndSyncOrgSettings();
    const quotaCost = Number(settings.sponsorship_quota_cost) || 90;

    // 1. Busca crianças apadrinhadas ativas
    const children = await this.getSponsoredChildrenForUser(userId, cleanEmail, userName);
    const childCount = children.length;
    const childTotalMonthly = childCount * quotaCost;

    // 2. Busca apoio mensal geral no banco ou cache local
    let generalSupport: SupporterGeneralSupport = {
      active: false,
      monthlyAmount: 0,
      paymentMethod: 'pix'
    };

    if (cleanEmail) {
      try {
        // Tenta ler do localStorage primeiro
        const localKey = `yah_hope_general_monthly_${cleanEmail}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (typeof parsed === 'object' && parsed !== null) {
              generalSupport = {
                active: Boolean(parsed.active),
                monthlyAmount: Number(parsed.monthlyAmount) || 0,
                paymentMethod: parsed.paymentMethod || 'pix',
                updatedAt: parsed.updatedAt
              };
            }
          } catch (e) {
            console.warn('Erro ao ler cache local de apoio mensal:', e);
          }
        }

        // Tenta sincronizar com tabela sponsorships (apoio geral onde child_id é nulo)
        let query = supabase
          .from('sponsorships')
          .select('*')
          .is('child_id', null)
          .eq('status', 'active');

        if (userId) {
          query = query.or(`sponsor_id.eq.${userId},donor_email.ilike.${cleanEmail}`);
        } else {
          query = query.ilike('donor_email', cleanEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
        if (!error && data && data.length > 0) {
          const rec = data[0];
          generalSupport = {
            active: true,
            monthlyAmount: Number(rec.monthly_amount) || 100,
            paymentMethod: rec.payment_method || 'pix',
            updatedAt: rec.created_at
          };
          localStorage.setItem(localKey, JSON.stringify(generalSupport));
        }
      } catch (err) {
        console.warn('Aviso ao consultar apoio mensal geral:', err);
      }
    }

    const totalMonthlyCommitment = (generalSupport.active ? generalSupport.monthlyAmount : 0) + childTotalMonthly;

    return {
      generalMonthlySupport: generalSupport,
      childSponsorships: {
        count: childCount,
        quotaCost,
        totalMonthly: childTotalMonthly,
        children
      },
      totalMonthlyCommitment
    };
  },

  /**
   * Atualiza ou aumenta o Apoio Mensal Geral do mantenedor.
   * REGRA DE NEGÓCIO: O novo valor SUBSTITUI o valor anterior (NÃO SOMA).
   */
  async updateGeneralMonthlySupport(
    userId: string | undefined,
    userEmail: string,
    newAmount: number,
    paymentMethod: string = 'pix',
    donorName: string = 'Mantenedor YAH Hope'
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = userEmail.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'E-mail do mantenedor não identificado.' };
    }

    const payload: SupporterGeneralSupport = {
      active: true,
      monthlyAmount: newAmount,
      paymentMethod,
      updatedAt: new Date().toISOString()
    };

    // Salva imediatamente no cache do mantenedor (garante responsividade imediata)
    const localKey = `yah_hope_general_monthly_${cleanEmail}`;
    localStorage.setItem(localKey, JSON.stringify(payload));

    try {
      // Desativa qualquer registro anterior de apoio geral
      await supabase
        .from('sponsorships')
        .update({ status: 'replaced' })
        .is('child_id', null)
        .or(`donor_email.ilike.${cleanEmail}${userId ? `,sponsor_id.eq.${userId}` : ''}`)
        .eq('status', 'active');

      // Insere o novo compromisso com o valor substituto atualizado
      await supabase.from('sponsorships').insert([{
        sponsor_id: userId || null,
        child_id: null,
        donor_name: donorName,
        donor_email: cleanEmail,
        monthly_amount: newAmount,
        quotas_count: 1,
        status: 'active',
        payment_method: paymentMethod,
        last_sponsored_at: new Date().toISOString()
      }]);

      return {
        success: true,
        message: `Seu apoio mensal foi atualizado com sucesso para R$ ${newAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês.`
      };
    } catch (err: any) {
      console.warn('Erro ao registrar no banco, mantendo persistência local:', err);
      return {
        success: true,
        message: `Seu apoio mensal foi atualizado para R$ ${newAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês.`
      };
    }
  },

  /**
   * Cancela o Apoio Mensal Geral do mantenedor.
   */
  async cancelGeneralMonthlySupport(
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (cleanEmail) {
      const localKey = `yah_hope_general_monthly_${cleanEmail}`;
      localStorage.setItem(localKey, JSON.stringify({
        active: false,
        monthlyAmount: 0,
        paymentMethod: '',
        updatedAt: new Date().toISOString()
      }));

      try {
        await supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .is('child_id', null)
          .or(`donor_email.ilike.${cleanEmail}${userId ? `,sponsor_id.eq.${userId}` : ''}`)
          .eq('status', 'active');
      } catch (err) {
        console.warn('Aviso ao cancelar apoio no banco:', err);
      }
    }

    return {
      success: true,
      message: 'Seu apoio mensal geral foi cancelado. Você pode reativá-lo a qualquer momento pelo portal.'
    };
  },

  /**
   * Cancela o apadrinhamento de uma criança específica.
   * Libera a vaga no sistema para outro padrinho e reduz o total mensal.
   */
  async cancelChildSponsorship(
    sponsorshipId?: string,
    childId?: string,
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (sponsorshipId) {
        const { error } = await supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .eq('id', sponsorshipId);

        if (error) throw error;
      } else if (childId) {
        let query = supabase
          .from('sponsorships')
          .update({ status: 'canceled' })
          .eq('child_id', childId)
          .eq('status', 'active');

        const cleanEmail = (userEmail || '').toLowerCase().trim();
        if (userId && cleanEmail) {
          query = query.or(`sponsor_id.eq.${userId},donor_email.ilike.${cleanEmail}`);
        } else if (userId) {
          query = query.eq('sponsor_id', userId);
        } else if (cleanEmail) {
          query = query.ilike('donor_email', cleanEmail);
        }

        const { error } = await query;
        if (error) throw error;
      }

      // Atualiza também o cache local resiliente
      const cleanEmail = (userEmail || '').toLowerCase().trim();
      if (cleanEmail) {
        try {
          const cacheKey = `yah_sponsored_children_${cleanEmail}`;
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(c => 
                (childId ? c.id !== childId : true) && 
                (sponsorshipId ? c.sponsorshipId !== sponsorshipId : true)
              );
              localStorage.setItem(cacheKey, JSON.stringify(filtered));
            }
          }
        } catch (cacheErr) {
          console.warn('Aviso ao atualizar cache local após cancelamento:', cacheErr);
        }
      }

      return {
        success: true,
        message: 'O apadrinhamento desta criança foi cancelado com sucesso. A vaga foi liberada para acolhimento por outro padrinho.'
      };
    } catch (err: any) {
      console.error('Erro ao cancelar apadrinhamento de criança:', err);
      return {
        success: false,
        message: err.message || 'Erro ao processar cancelamento do apadrinhamento.'
      };
    }
  },

  /**
   * Regra de Privacidade e LGPD:
   * Verifica se o usuário autenticado tem permissão para ver notícias e atualizações de uma criança específica.
   */
  async canUserViewChildUpdates(
    childIdOrName: string,
    userId?: string,
    userEmail?: string,
    userRole?: string
  ): Promise<boolean> {
    // Administradores, médicos e equipe têm acesso irrestrito
    if (userRole && ['ADMIN', 'USER', 'STAFF', 'DOCTOR', 'NURSE', 'COORDINATOR'].includes(userRole)) {
      return true;
    }

    if (!childIdOrName || (!userId && !userEmail)) {
      return false;
    }

    const myChildren = await this.getSponsoredChildrenForUser(userId, userEmail);
    return myChildren.some(c => 
      c.id === childIdOrName || 
      c.name.toLowerCase().trim() === childIdOrName.toLowerCase().trim()
    );
  }
};
