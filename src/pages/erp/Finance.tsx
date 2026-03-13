import React, { useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { FinanceSummary } from '../../components/erp/finance/FinanceSummary';
import { TransactionList } from '../../components/erp/finance/TransactionList';
import { TransactionModal } from '../../components/erp/finance/TransactionModal';
import { mockTransactions, mockTransactionCategories, Transaction } from '../../lib/mockData';

export function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nova Transação
        </button>
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
