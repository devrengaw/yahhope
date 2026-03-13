import React from 'react';
import { Transaction, TransactionCategory } from '../../../lib/mockData';
import { Check, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
}

export function TransactionList({ transactions, categories }: TransactionListProps) {
  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="font-medium p-4 pl-6">Data</th>
              <th className="font-medium p-4">Descrição</th>
              <th className="font-medium p-4">Categoria</th>
              <th className="font-medium p-4">Conta</th>
              <th className="font-medium p-4">Valor</th>
              <th className="font-medium p-4 pr-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              transactions.map(transaction => {
                const category = getCategory(transaction.category_id);
                const isIncome = transaction.type === 'income';

                return (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-slate-600">
                      {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-slate-900 font-medium">{transaction.description}</td>
                    <td className="p-4">
                      {category ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-white ${category.color}`}>
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">{transaction.account}</td>
                    <td className={`p-4 font-medium flex items-center gap-1 ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {transaction.status === 'completed' ? <Check size={14} /> : <Clock size={14} />}
                        {transaction.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
