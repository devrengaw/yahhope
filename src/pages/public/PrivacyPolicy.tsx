import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useLanguage } from '../../contexts/LanguageContext';

export function PrivacyPolicy() {
  const { tr } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <SEO 
        title={tr('Política de Privacidade | YAH Hope', 'Privacy Policy | YAH Hope')}
        description={tr(
          'Saiba como a YAH Hope protege sua privacidade e gerencia dados de doações e apoiadores com total segurança e transparência.',
          'Learn how YAH Hope protects your privacy and manages donation and supporter data with complete security and transparency.'
        )}
        canonical="https://yahhope.com/politica-de-privacidade"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {tr('Política de Privacidade', 'Privacy Policy')}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {tr(
              'Seu compromisso com a transparência. Entenda como coletamos, usamos e protegemos as suas informações pessoais e os dados dos projetos.',
              'Our commitment to transparency. Understand how we collect, use, and protect your personal information and project data.'
            )}
          </p>
          <div className="mt-6 inline-flex items-center text-sm text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <FileText className="w-4 h-4 mr-2" />
            {tr('Última atualização: 22 de Junho de 2026', 'Last updated: June 22, 2026')}
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            <section>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mr-4">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{tr('1. Coleta de Dados', '1. Data Collection')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                {tr(
                  'Coletamos informações necessárias para fornecer nossos serviços de forma eficiente e segura. Isso inclui dados fornecidos diretamente por você (como nome, e-mail, e perfil) e dados gerados automaticamente durante o uso da plataforma (como logs de acesso e preferências de navegação).',
                  'We collect information necessary to provide our services efficiently and securely. This includes data provided directly by you (such as name, email, and profile) and data automatically generated while using the platform (such as access logs and browsing preferences).'
                )}
              </p>
            </section>

            <section>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mr-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{tr('2. Uso das Informações', '2. Use of Information')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                {tr('Utilizamos seus dados para:', 'We use your data to:')}
              </p>
              <ul className="mt-4 space-y-3 pl-14 text-slate-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  {tr('Garantir o acesso e funcionamento adequado do sistema.', 'Ensure proper access and functioning of the platform.')}
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  {tr('Melhorar a experiência de uso e desenvolver novas funcionalidades.', 'Improve user experience and develop new features.')}
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  {tr('Comunicação sobre atualizações, segurança e suporte técnico.', 'Communicate updates, security notices, and technical support.')}
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mr-4">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{tr('3. Compartilhamento e Segurança', '3. Sharing and Security')}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                {tr(
                  'Não vendemos ou compartilhamos suas informações pessoais com terceiros não autorizados. Implementamos medidas de segurança técnicas, organizacionais e administrativas de alto nível para proteger seus dados contra acessos não autorizados, perdas ou alterações.',
                  'We do not sell or share your personal information with unauthorized third parties. We implement high-standard technical, organizational, and administrative security measures to protect your data against unauthorized access, loss, or alteration.'
                )}
              </p>
            </section>

            <section>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{tr('Seus Direitos', 'Your Rights')}</h3>
                <p className="text-slate-600 text-sm">
                  {tr(
                    'Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através do suporte da plataforma.',
                    'You have the right to access, correct, or request the deletion of your personal data at any time. To exercise these rights, please contact us through our platform support.'
                  )}
                </p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
