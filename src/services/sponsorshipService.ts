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

      if (childError) throw childError;

      // 2. Busca apadrinhamentos ativos
      const { data: sponsorshipsData, error: spError } = await supabase
        .from('sponsorships')
        .select('*, users(id, name, email)')
        .eq('status', 'active');

      if (spError) throw spError;

      const allChildren = childrenData || [];
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

      // 5. Integra com a Régua Geral de Doações (campanhas e donations)
      const { data: activeCampaigns } = await supabase
        .from('campaigns')
        .select('id, current_amount')
        .eq('is_active', true)
        .limit(1);

      const activeCampaign = activeCampaigns?.[0];
      const campaignId = activeCampaign?.id || null;

      if (campaignId) {
        // Insere na tabela de doações
        await supabase.from('donations').insert({
          campaign_id: campaignId,
          donor_name: donorName,
          donor_email: cleanEmail,
          donor_phone: donorPhone || null,
          amount: totalAmount,
          status: 'paid',
          payment_method: paymentMethod,
          paid_at: new Date().toISOString()
        });

        // Incrementa o montante da régua de arrecadação da campanha
        await supabase.from('campaigns').update({
          current_amount: Number(activeCampaign.current_amount || 0) + totalAmount
        }).eq('id', campaignId);
      }

      // 6. Registra no Módulo Financeiro Global
      await supabase.from('finance_transactions').insert({
        description: `Apadrinhamento Mensal (${countToAssign} ${countToAssign === 1 ? 'cota' : 'cotas'}) - ${donorName}`,
        amount: totalAmount,
        type: 'income',
        category_id: 'cat_sponsorship',
        status: 'completed',
        account: paymentMethod === 'pix' ? 'Pix Recorrente' : 'Cartão de Crédito',
        date: new Date().toISOString().split('T')[0]
      });

      // 7. Dispara o E-mail de Boas-Vindas com o perfil detalhado da(s) criança(s)
      await this.sendSponsorshipWelcomeEmail(cleanEmail, donorName, selectedChildren, totalAmount);

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
   * Dispara o e-mail de boas-vindas com o perfil da criança atribuída
   */
  async sendSponsorshipWelcomeEmail(
    email: string,
    name: string,
    children: ChildSponsorshipDetail[],
    monthlyAmount: number
  ): Promise<void> {
    const childrenHtml = children.map(c => `
      <div style="background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 120px; vertical-align: top;">
              <img src="${c.photo_url}" alt="${c.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 14px; border: 2px solid #F49853;" />
            </td>
            <td style="vertical-align: top; padding-left: 15px;">
              <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 20px; font-weight: 800;">${c.name}</h3>
              <p style="margin: 0 0 4px 0; color: #F49853; font-size: 13px; font-weight: 700; text-transform: uppercase;">
                ${c.ageText} • ${c.community}
              </p>
              <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px; line-height: 1.5;">
                ${c.story}
              </p>
            </td>
          </tr>
        </table>
      </div>
    `).join('');

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 24px;">
        <div style="text-align: center; padding: 24px 0;">
          <img src="https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif" alt="YAH Hope" style="max-height: 55px; border-radius: 8px;" />
        </div>

        <div style="background-color: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
            Novo Vínculo de Amor
          </div>

          <h1 style="color: #0f172a; font-size: 26px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.2;">
            Olá, ${name}! Seja bem-vindo(a) à família YAH Hope.
          </h1>

          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            Seu coração generoso acaba de acender uma luz de esperança viva. Pelo nosso modelo de <strong>distribuição solidária e justa</strong>, alocamos o seu carinho para a(s) criança(s) em maior prioridade de cuidado na nossa Casa Nutri em Moçambique:
          </p>

          <div style="margin: 24px 0;">
            ${childrenHtml}
          </div>

          <div style="background-color: #fff7ed; border-left: 4px solid #F49853; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #9a3412; font-weight: 600;">
              O que o seu apadrinhamento garante mensalmente:
            </p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #c2410c;">
              <li>Fórmulas terapêuticas especiais e alimentação rica em nutrientes</li>
              <li>Consultas pediátricas, pesagens e acompanhamento de saúde contínuo</li>
              <li>Apoio sociofamiliar na comunidade</li>
              <li>Acesso exclusivo a relatórios e cartas no Portal do Mantenedor</li>
            </ul>
          </div>

          <div style="text-align: center; padding-top: 16px;">
            <a href="https://yahhope.org/portal/dashboard" style="background-color: #F49853; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(244,152,83,0.3);">
              Acessar Portal do Padrinho →
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 24px; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">YAH Hope International • Nampula, Moçambique</p>
          <p style="margin: 0;">Você recebeu esta mensagem porque é um padrinho ativo do nosso projeto.</p>
        </div>
      </div>
    `;

    // Tenta enviar via Supabase Edge Function ou Resend
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
            to: email,
            subject: `🧡 Parabéns, ${name}! Conheça a criança que você está apadrinhando na YAH Hope`,
            html: htmlBody
          })
        }).catch(e => console.warn('Aviso ao enviar via edge function:', e));
      }
    } catch (e) {
      console.warn('Fallback de e-mail:', e);
    }
  },

  /**
   * Retorna as crianças apadrinhadas pelo usuário autenticado (por ID ou E-mail)
   */
  async getSponsoredChildrenForUser(userId?: string, userEmail?: string): Promise<ChildSponsorshipDetail[]> {
    if (!userId && !userEmail) return [];

    try {
      let query = supabase
        .from('sponsorships')
        .select('*, children(*)')
        .eq('status', 'active');

      if (userId && userEmail) {
        query = query.or(`sponsor_id.eq.${userId},donor_email.ilike.${userEmail.trim()}`);
      } else if (userId) {
        query = query.eq('sponsor_id', userId);
      } else if (userEmail) {
        query = query.ilike('donor_email', userEmail.trim());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];

      return data
        .filter(item => item.children)
        .map(item => {
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
            sponsorsCount: 1,
            maxSponsors: 2,
            isFull: false,
            sponsors: []
          };
        });
    } catch (err) {
      console.error('Erro ao buscar crianças apadrinhadas do usuário:', err);
      return [];
    }
  },

  /**
   * Obtém o resumo consolidado dos compromissos mensais do apoiador:
   * 1. Apoio Mensal Geral (Casa Nutri)
   * 2. Apadrinhamento de Crianças (R$ 90/cota)
   */
  async getSupporterCommitments(userId?: string, userEmail?: string): Promise<SupporterCommitmentSummary> {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    const settings = await fetchAndSyncOrgSettings();
    const quotaCost = Number(settings.sponsorship_quota_cost) || 90;

    // 1. Busca crianças apadrinhadas ativas
    const children = await this.getSponsoredChildrenForUser(userId, cleanEmail);
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
