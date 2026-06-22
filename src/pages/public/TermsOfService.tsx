import React from 'react';
import { Scale, BookOpen, AlertTriangle, HelpCircle } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-6">
            <Scale className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Termos de Serviço
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Regras e diretrizes para o uso da nossa plataforma. Por favor, leia atentamente antes de continuar utilizando nossos serviços.
          </p>
          <div className="mt-6 inline-flex items-center text-sm text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <BookOpen className="w-4 h-4 mr-2" />
            Vigente a partir de: 22 de Junho de 2026
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                1. Aceitação dos Termos
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Ao acessar e utilizar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                2. Uso Adequado da Plataforma
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Você concorda em usar a plataforma apenas para fins legais e de maneira que não infrinja os direitos de terceiros, não restrinja ou iniba o uso e o aproveitamento da plataforma por qualquer outra pessoa.
              </p>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> É estritamente proibido utilizar a plataforma para disseminar conteúdo ilegal, ofensivo ou prejudicial aos sistemas e aos outros usuários.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                3. Contas e Segurança
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Você é responsável por manter a confidencialidade das informações da sua conta e senha, bem como por restringir o acesso ao seu computador ou dispositivo. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram sob sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                4. Modificações dos Termos
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma ou por e-mail. O uso contínuo da plataforma após tais modificações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Dúvidas sobre os termos?</h3>
                  <p className="text-slate-500 text-sm">Nossa equipe de suporte está à disposição.</p>
                </div>
                <button className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Contatar Suporte
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
