import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FinanceSummary } from '../../components/erp/finance/FinanceSummary';
import { TransactionList } from '../../components/erp/finance/TransactionList';
import { TransactionModal } from '../../components/erp/finance/TransactionModal';
import { Transaction } from '../../lib/mockData'; // keeping type
import { useConfirm } from '../../contexts/ConfirmContext';

export function Finance() {
  const { confirm, alert: showAlert } = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: txs } = await supabase.from('finance_transactions').select('*').order('date', { ascending: false });
      const { data: cats } = await supabase.from('finance_categories').select('*');
      if (txs) setTransactions(txs as Transaction[]);
      if (cats) setCategories(cats);
    };
    fetchData();
  }, []);

  const handleSendAccountability = async () => {
    if (!(await confirm({ title: 'Prestar Contas', message: 'Deseja enviar o e-mail de prestação de contas deste mês para todos os apoiadores ativos?', type: 'info' }))) return;
    
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
      
      await showAlert('Sucesso', 'Prestação de contas enviada com sucesso para todos os doadores!');
    } catch (error) {
      console.error(error);
      await showAlert('Erro', 'Erro ao processar o envio. Verifique o console ou a API do Resend.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    try {
      const { data, error } = await supabase.from('finance_transactions').insert([newTx]).select().single();
      if (error) throw error;
      if (data) {
        const updated = [data, ...transactions].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(updated);
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error('Error saving transaction:', e);
      showAlert('Erro', 'Erro ao salvar transação');
    }
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
          categories={categories} 
        />
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
      />
    </div>
  );
}
