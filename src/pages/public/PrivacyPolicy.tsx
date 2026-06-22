import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Seu compromisso com a transparência. Entenda como coletamos, usamos e protegemos as suas informações pessoais e os dados dos projetos.
          </p>
          <div className="mt-6 inline-flex items-center text-sm text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <FileText className="w-4 h-4 mr-2" />
            Última atualização: 22 de Junho de 2026
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
                <h2 className="text-2xl font-bold text-slate-800">1. Coleta de Dados</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                Coletamos informações necessárias para fornecer nossos serviços de forma eficiente e segura. Isso inclui dados fornecidos diretamente por você (como nome, e-mail, e perfil) e dados gerados automaticamente durante o uso da plataforma (como logs de acesso e preferências de navegação). 
              </p>
            </section>

            <section>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mr-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">2. Uso das Informações</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                Utilizamos seus dados para:
              </p>
              <ul className="mt-4 space-y-3 pl-14 text-slate-600">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  Garantir o acesso e funcionamento adequado do sistema.
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  Melhorar a experiência de uso e desenvolver novas funcionalidades.
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></span>
                  Comunicação sobre atualizações, segurança e suporte técnico.
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mr-4">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">3. Compartilhamento e Segurança</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-14">
                Não vendemos ou compartilhamos suas informações pessoais com terceiros não autorizados. Implementamos medidas de segurança técnicas, organizacionais e administrativas de alto nível para proteger seus dados contra acessos não autorizados, perdas ou alterações.
              </p>
            </section>

            <section>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Seus Direitos</h3>
                <p className="text-slate-600 text-sm">
                  Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através do suporte da plataforma.
                </p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
