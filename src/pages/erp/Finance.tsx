import React, { useState } from 'react';
import { DollarSign, Plus, Mail } from 'lucide-react';
import { FinanceSummary } from '../../components/erp/finance/FinanceSummary';
import { TransactionList } from '../../components/erp/finance/TransactionList';
import { TransactionModal } from '../../components/erp/finance/TransactionModal';
import { mockTransactions, mockTransactionCategories, Transaction } from '../../lib/mockData';

export function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendAccountability = async () => {
    if (!window.confirm('Deseja enviar o e-mail de prestação de contas deste mês para todos os apoiadores ativos?')) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-accountability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) throw new Error('Falha ao enviar os e-mails');
      
      alert('✅ Prestação de contas enviada com sucesso para todos os doadores!');
    } catch (error) {
      console.error(error);
      alert('Erro ao processar o envio. Verifique o console ou a API do Resend.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    // sorting transactions by date descending
    const updated = [transaction, ...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setTransactions(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="text-blue-600" size={28} />
            Financeiro
          </h1>
          <p className="text-slate-500 mt-1">Gestão financeira e orçamentos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSendAccountability}
            disabled={isSending}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Mail size={20} className={isSending ? "animate-pulse text-indigo-500" : "text-slate-400"} />
            {isSending ? 'Enviando...' : 'Prestar Contas'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nova Transação
          </button>
        </div>
      </div>

      <FinanceSummary transactions={transactions} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 px-1">Últimas Transações</h2>
        <TransactionList 
          transactions={transactions} 
          categories={mockTransactionCategories} 
        />
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={mockTransactionCategories}
      />
    </div>
  );
}
