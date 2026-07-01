import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, Kit, InventoryCategory, InventoryTransaction } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface InventoryContextType {
  items: InventoryItem[];
  kits: Kit[];
  categories: InventoryCategory[];
  transactions: InventoryTransaction[];
  
  // Context no longer exposes set* functions directly to enforce DB sync
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
          currency: i.currency
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

  // Legacy sync useEffect removed as requested for 100% DB functionality

  // CRUD for items
  const addItem = async (item: InventoryItem) => {
    const { data, error } = await supabase.from('inventory').insert({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      expiration_date: item.expiration_date || null,
      purchase_price: item.purchase_price || null,
      currency: item.currency || null
    }).select().single();
    
    if (error) {
      console.error('Supabase Insert Error:', error);
      alert('Erro ao salvar no banco: ' + error.message);
    }
    
    if (data) {
      setItems(prev => [{
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        min_quantity: data.min_quantity || 0,
        expiration_date: data.expiration_date,
        purchase_price: data.purchase_price,
        currency: data.currency
      }, ...prev]);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const { error } = await supabase.from('inventory').update({
      name: updates.name,
      category: updates.category,
      quantity: updates.quantity,
      unit: updates.unit,
      min_quantity: updates.min_quantity,
      expiration_date: updates.expiration_date || null,
      purchase_price: updates.purchase_price || null,
      currency: updates.currency || null
    }).eq('id', id);
    
    if (error) {
      console.error('Supabase Update Error:', error);
      alert('Erro ao atualizar no banco: ' + error.message);
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  // CRUD for kits
  const addKit = async (kit: Kit) => {
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
      setKits(prev => [{ ...kit, id: data.id }, ...prev]);
    }
  };

  const updateKit = async (id: string, updates: Partial<Kit>) => {
    const { error } = await supabase.from('kits').update({
      name: updates.name,
      description: updates.description
    }).eq('id', id);
    
    if (!error) {
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
      setKits(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    }
  };

  const deleteKit = async (id: string) => {
    const { error } = await supabase.from('kits').delete().eq('id', id);
    if (!error) {
      setKits(prev => prev.filter(k => k.id !== id));
    }
  };

  const addCategory = async (category: Omit<InventoryCategory, 'id'>) => {
    const { data, error } = await supabase.from('inventory_categories').insert({
      name: category.name,
      description: category.description
    }).select().single();
    
    if (error) {
      console.error('Supabase Insert Error:', error);
      alert('Erro ao salvar no banco: ' + error.message);
    }
    
    if (data) {
      setCategories(prev => [...prev, { id: data.id, ...category }]);
    }
  };

  const updateCategory = async (id: string, updates: Partial<InventoryCategory>) => {
    const oldCat = categories.find(c => c.id === id);
    const { error } = await supabase.from('inventory_categories').update({
      name: updates.name,
      description: updates.description
    }).eq('id', id);
    if (!error) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      
      if (updates.name && oldCat && oldCat.name !== updates.name) {
        const { error: itemError } = await supabase.from('inventory')
          .update({ category: updates.name })
          .eq('category', oldCat.name);
          
        if (!itemError) {
          setItems(prev => prev.map(i => i.category === oldCat.name ? { ...i, category: updates.name as string } : i));
        } else {
          console.error('Error updating items category:', itemError);
        }
      }
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('inventory_categories').delete().eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const addTransaction = async (t: Omit<InventoryTransaction, 'id' | 'date'>) => {
    const { data } = await supabase.from('inventory_transactions').insert({
      item_id: t.item_id,
      transaction_type: t.type,
      quantity: t.quantity,
      unit_price: t.price,
      notes: t.reason
    }).select().single();
    if (data) {
      setTransactions(prev => [{
        id: data.id,
        item_id: data.item_id,
        type: data.transaction_type as any,
        quantity: data.quantity,
        date: data.created_at,
        reason: data.notes || '',
        price: data.unit_price
      }, ...prev]);
    }
  };

  const deductKitFromInventory = async (kitId: string, patientId?: string) => {
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;

    for (const kitItem of kit.items) {
      const item = items.find(i => i.id === kitItem.item_id);
      if (item) {
        const newQuantity = Math.max(0, item.quantity - kitItem.quantity);
        updateItem(item.id, { quantity: newQuantity });
        
        addTransaction({
          item_id: kitItem.item_id,
          type: 'out',
          quantity: kitItem.quantity,
          reason: patientId ? 'Saída por conta de Kit e Atendimento' : 'Saída por entrega de Kit',
          patient_id: patientId
        });
      }
    }
  };

  const deductPrescriptionsFromInventory = async (prescriptions: any[], patientId: string) => {
    if (!prescriptions || prescriptions.length === 0) return;

    for (const prescription of prescriptions) {
      if (!prescription.item_id || !prescription.quantity) continue;
      
      const item = items.find(i => i.id === prescription.item_id);
      if (item) {
        const newQuantity = Math.max(0, item.quantity - prescription.quantity);
        updateItem(item.id, { quantity: newQuantity });

        addTransaction({
          item_id: prescription.item_id,
          type: 'out',
          quantity: prescription.quantity,
          reason: 'Saída por prescrição em consulta médica',
          patient_id: patientId
        });
      }
    }
  };

  return (
    <InventoryContext.Provider value={{ 
      items, kits, categories, transactions, 
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
