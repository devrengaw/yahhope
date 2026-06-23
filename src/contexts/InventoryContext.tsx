import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, Kit, InventoryCategory, InventoryTransaction } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
  items: InventoryItem[];
  kits: Kit[];
  categories: InventoryCategory[];
  transactions: InventoryTransaction[];
  
  // Expose these for backwards compatibility with UI that hasn't been migrated yet,
  // but ideally UI should use the explicit CRUD below.
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setKits: React.Dispatch<React.SetStateAction<Kit[]>>;
  setCategories: React.Dispatch<React.SetStateAction<InventoryCategory[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
  
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  
  addKit: (kit: Kit) => void;
  updateKit: (id: string, updates: Partial<Kit>) => void;
  deleteKit: (id: string) => void;

  addCategory: (category: Omit<InventoryCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<InventoryCategory>) => void;
  deleteCategory: (id: string) => void;

  deductKitFromInventory: (kitId: string, patientId?: string) => void;
  deductPrescriptionsFromInventory: (prescriptions: any[], patientId: string) => void;
  addTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'date'>) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, kitsRes, catsRes, transRes, kitItemsRes] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('kits').select('*'),
        supabase.from('inventory_categories').select('*'),
        supabase.from('inventory_transactions').select('*'),
        supabase.from('kit_items').select('*')
      ]);

      if (catsRes.data) {
        setCategories(catsRes.data.map(c => ({ id: c.id, name: c.name, description: c.description || '' })));
      }

      if (itemsRes.data) {
        setItems(itemsRes.data.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit,
          min_quantity: i.min_quantity || 0,
          expiration_date: i.expiration_date,
          purchase_price: i.purchase_price,
          internal_use: i.internal_use || false
        })));
      }

      if (transRes.data) {
        setTransactions(transRes.data.map(t => ({
          id: t.id,
          item_id: t.item_id,
          type: t.transaction_type as any,
          quantity: t.quantity,
          date: t.created_at,
          reason: t.notes || '',
          price: t.unit_price
        })));
      }

      if (kitsRes.data) {
        const kData = kitsRes.data.map(k => ({
          id: k.id,
          name: k.name,
          description: k.description || '',
          items: kitItemsRes.data ? kitItemsRes.data.filter(ki => ki.kit_id === k.id).map(ki => ({
            item_id: ki.item_id,
            quantity: ki.quantity
          })) : []
        }));
        setKits(kData);
      }
      
      setIsLoaded(true);
    } catch (e) {
      console.error('Error fetching inventory', e);
    }
  };

  // Keep these useEffects to sync legacy setState calls to DB! 
  // It's a quick patch to make the UI work with DB instantly without full rewrite.
  useEffect(() => {
    if (!isLoaded) return;
    const syncItems = async () => {
      for (const item of items) {
        if (item.id.length < 10) continue; // Skip temporary IDs
        await supabase.from('inventory').upsert({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          min_quantity: item.min_quantity,
          expiration_date: item.expiration_date,
          purchase_price: item.purchase_price,
          internal_use: item.internal_use || false
        });
      }
    };
    syncItems();
  }, [items, isLoaded]);

  // CRUD for items
  const addItem = async (item: InventoryItem) => {
    const tempId = item.id || Math.random().toString();
    setItems(prev => [{ ...item, id: tempId }, ...prev]);
    const { data } = await supabase.from('inventory').insert({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      expiration_date: item.expiration_date,
      purchase_price: item.purchase_price,
      internal_use: item.internal_use || false
    }).select().single();
    if (data) {
      setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: data.id } : i));
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (id.length > 10) {
      await supabase.from('inventory').update({
        name: updates.name,
        category: updates.category,
        quantity: updates.quantity,
        unit: updates.unit,
        min_quantity: updates.min_quantity,
        expiration_date: updates.expiration_date,
        purchase_price: updates.purchase_price,
        internal_use: updates.internal_use
      }).eq('id', id);
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (id.length > 10) {
      await supabase.from('inventory').delete().eq('id', id);
    }
  };

  // CRUD for kits
  const addKit = async (kit: Kit) => {
    const tempId = kit.id || Math.random().toString();
    setKits(prev => [{ ...kit, id: tempId }, ...prev]);
    const { data } = await supabase.from('kits').insert({
      name: kit.name,
      description: kit.description
    }).select().single();
    if (data) {
      if (kit.items.length > 0) {
        await supabase.from('kit_items').insert(kit.items.map(ki => ({
          kit_id: data.id,
          item_id: ki.item_id,
          quantity: ki.quantity
        })));
      }
      setKits(prev => prev.map(k => k.id === tempId ? { ...k, id: data.id } : k));
    }
  };

  const updateKit = async (id: string, updates: Partial<Kit>) => {
    setKits(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    if (id.length > 10) {
      await supabase.from('kits').update({
        name: updates.name,
        description: updates.description
      }).eq('id', id);
      
      if (updates.items) {
        await supabase.from('kit_items').delete().eq('kit_id', id);
        if (updates.items.length > 0) {
          await supabase.from('kit_items').insert(updates.items.map(ki => ({
            kit_id: id,
            item_id: ki.item_id,
            quantity: ki.quantity
          })));
        }
      }
    }
  };

  const deleteKit = async (id: string) => {
    setKits(prev => prev.filter(k => k.id !== id));
    if (id.length > 10) {
      await supabase.from('kits').delete().eq('id', id);
    }
  };

  const addCategory = async (category: Omit<InventoryCategory, 'id'>) => {
    const tempId = Math.random().toString();
    setCategories(prev => [...prev, { id: tempId, ...category }]);
    const { data } = await supabase.from('inventory_categories').insert({
      name: category.name,
      description: category.description
    }).select().single();
    if (data) {
      setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c));
    }
  };

  const updateCategory = async (id: string, updates: Partial<InventoryCategory>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (id.length > 10) {
      await supabase.from('inventory_categories').update({
        name: updates.name,
        description: updates.description
      }).eq('id', id);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (id.length > 10) {
      await supabase.from('inventory_categories').delete().eq('id', id);
    }
  };

  const addTransaction = async (t: Omit<InventoryTransaction, 'id' | 'date'>) => {
    const newTrans: InventoryTransaction = {
      ...t,
      id: Math.random().toString(),
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTrans, ...prev]);

    if (t.item_id.length > 10) {
      const { data } = await supabase.from('inventory_transactions').insert({
        item_id: t.item_id,
        transaction_type: t.type,
        quantity: t.quantity,
        unit_price: t.price,
        notes: t.reason
      }).select().single();
      if (data) {
        setTransactions(prev => prev.map(tr => tr.id === newTrans.id ? { ...tr, id: data.id } : tr));
      }
    }
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

  const deductPrescriptionsFromInventory = (prescriptions: any[], patientId: string) => {
    if (!prescriptions || prescriptions.length === 0) return;

    setItems(prevItems => {
      const newItems = [...prevItems];
      prescriptions.forEach(prescription => {
        if (!prescription.item_id || !prescription.quantity) return;
        
        const itemIndex = newItems.findIndex(i => i.id === prescription.item_id);
        if (itemIndex !== -1) {
          // Deduct quantity
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            quantity: Math.max(0, newItems[itemIndex].quantity - prescription.quantity)
          };

          // Generate OUT transaction
          addTransaction({
            item_id: prescription.item_id,
            type: 'out',
            quantity: prescription.quantity,
            reason: 'Prescrição Médica - Atendimento',
            patient_id: patientId
          });
        }
      });
      return newItems;
    });
  };

  return (
    <InventoryContext.Provider value={{ 
      items, kits, categories, transactions, 
      setItems, setKits, setCategories, setTransactions, 
      addItem, updateItem, deleteItem,
      addKit, updateKit, deleteKit,
      addCategory, updateCategory, deleteCategory,
      deductKitFromInventory, deductPrescriptionsFromInventory, addTransaction 
    }}>
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
