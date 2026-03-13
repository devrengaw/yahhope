import React from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';
import { Transaction } from '../../../lib/mockData';

interface FinanceSummaryProps {
  transactions: Transaction[];
}

export function FinanceSummary({ transactions }: FinanceSummaryProps) {
  const incomes = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const expenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const balance = incomes - expenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Saldo Atual */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Saldo Atual</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">
          R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Receitas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Receitas</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">
          R$ {incomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Despesas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowDownRight size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Despesas</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">
          R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
