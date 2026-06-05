import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockInventory, InventoryItem, mockKits, Kit, InventoryCategory, mockInventoryCategories, InventoryTransaction } from '../lib/mockData';

interface InventoryContextType {
  items: InventoryItem[];
  kits: Kit[];
  categories: InventoryCategory[];
  transactions: InventoryTransaction[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setKits: React.Dispatch<React.SetStateAction<Kit[]>>;
  setCategories: React.Dispatch<React.SetStateAction<InventoryCategory[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
  deductKitFromInventory: (kitId: string, patientId?: string) => void;
  addTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'date'>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY_ITEMS = 'yah_hope_inventory_items';
const STORAGE_KEY_KITS = 'yah_hope_inventory_kits';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
    return saved ? JSON.parse(saved) : mockInventory;
  });

  const [kits, setKits] = useState<Kit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_KITS);
    return saved ? JSON.parse(saved) : mockKits;
  });

  const STORAGE_KEY_CATEGORIES = 'yah_hope_inventory_categories';
  const [categories, setCategories] = useState<InventoryCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return saved ? JSON.parse(saved) : mockInventoryCategories;
  });

  const STORAGE_KEY_TRANSACTIONS = 'yah_hope_inventory_transactions';
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_KITS, JSON.stringify(kits));
  }, [kits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (t: Omit<InventoryTransaction, 'id' | 'date'>) => {
    const newTrans: InventoryTransaction = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTrans, ...prev]);
  };

  const deductKitFromInventory = (kitId: string, patientId?: string) => {
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;

    setItems(prevItems => {
      const newItems = [...prevItems];
      kit.items.forEach(kitItem => {
        const itemIndex = newItems.findIndex(i => i.id === kitItem.item_id);
        if (itemIndex !== -1) {
          // Deduct the quantity
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            quantity: Math.max(0, newItems[itemIndex].quantity - kitItem.quantity)
          };

          // Automatically generate an OUT transaction for each item in the kit
          addTransaction({
            item_id: kitItem.item_id,
            type: 'out',
            quantity: kitItem.quantity,
            reason: patientId ? 'Saída por conta de Kit e Atendimento' : 'Saída por entrega de Kit',
            patient_id: patientId
          });
        }
      });
      return newItems;
    });
  };

  return (
    <InventoryContext.Provider value={{ items, kits, categories, transactions, setItems, setKits, setCategories, setTransactions, deductKitFromInventory, addTransaction }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
