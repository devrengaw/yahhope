import React from 'react';
import { Scale, BookOpen, AlertTriangle, HelpCircle } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useLanguage } from '../../contexts/LanguageContext';

export function TermsOfService() {
  const { tr } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <SEO 
        title={tr('Termos de Serviço | YAH Hope', 'Terms of Service | YAH Hope')}
        description={tr(
          'Conheça os termos de serviço e diretrizes de uso da plataforma humanitária e portal de apoiadores da YAH Hope.',
          'Review the terms of service and usage guidelines for the YAH Hope humanitarian platform and supporter portal.'
        )}
        canonical="https://yahhope.com/termos-de-servico"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-6">
            <Scale className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {tr('Termos de Serviço', 'Terms of Service')}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {tr(
              'Regras e diretrizes para o uso da nossa plataforma. Por favor, leia atentamente antes de continuar utilizando nossos serviços.',
              'Rules and guidelines for using our platform. Please read carefully before continuing to use our services.'
            )}
          </p>
          <div className="mt-6 inline-flex items-center text-sm text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <BookOpen className="w-4 h-4 mr-2" />
            {tr('Vigente a partir de: 22 de Junho de 2026', 'Effective as of: June 22, 2026')}
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {tr('1. Aceitação dos Termos', '1. Acceptance of Terms')}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {tr(
                  'Ao acessar e utilizar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.',
                  'By accessing and using our platform, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our services.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {tr('2. Uso Adequado da Plataforma', '2. Proper Use of the Platform')}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                {tr(
                  'Você concorda em usar a plataforma apenas para fins legais e de maneira que não infrinja os direitos de terceiros, não restrinja ou iniba o uso e o aproveitamento da plataforma por qualquer outra pessoa.',
                  'You agree to use the platform only for lawful purposes and in a manner that does not infringe the rights of third parties or restrict or inhibit anyone else’s use and enjoyment of the platform.'
                )}
              </p>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>{tr('Atenção:', 'Notice:')}</strong>{' '}
                  {tr(
                    'É estritamente proibido utilizar a plataforma para disseminar conteúdo ilegal, ofensivo ou prejudicial aos sistemas e aos outros usuários.',
                    'It is strictly prohibited to use the platform to distribute illegal, offensive, or harmful content to systems or other users.'
                  )}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {tr('3. Contas e Segurança', '3. Accounts and Security')}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {tr(
                  'Você é responsável por manter a confidencialidade das informações da sua conta e senha, bem como por restringir o acesso ao seu computador ou dispositivo. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram sob sua conta.',
                  'You are responsible for maintaining the confidentiality of your account and password information, as well as restricting access to your computer or device. You agree to accept responsibility for all activities that occur under your account.'
                )}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {tr('4. Modificações dos Termos', '4. Modifications to Terms')}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {tr(
                  'Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma ou por e-mail. O uso contínuo da plataforma após tais modificações constitui sua aceitação dos novos termos.',
                  'We reserve the right to modify these terms at any time. Significant changes will be notified through the platform or by email. Continued use of the platform after such modifications constitutes your acceptance of the new terms.'
                )}
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{tr('Dúvidas sobre os termos?', 'Questions about these terms?')}</h3>
                  <p className="text-slate-500 text-sm">{tr('Nossa equipe de suporte está à disposição.', 'Our support team is ready to assist you.')}</p>
                </div>
                <button className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {tr('Contatar Suporte', 'Contact Support')}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
