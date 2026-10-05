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
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const MED_META_KEY = 'yah_hope_inventory_med_meta';

function getMedMetadata(): Record<string, { dosage_form?: 'comprimido' | 'liquido' | 'outro'; package_units?: number; liquid_volume_ml?: number }> {
  try {
    const raw = localStorage.getItem(MED_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMedMetadata(id: string, meta: { dosage_form?: 'comprimido' | 'liquido' | 'outro'; package_units?: number; liquid_volume_ml?: number }) {
  try {
    const existing = getMedMetadata();
    existing[id] = { ...existing[id], ...meta };
    localStorage.setItem(MED_META_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving med metadata', e);
  }
}

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
        const medMeta = getMedMetadata();
        setItems(itemsRes.data.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit,
          min_quantity: i.min_quantity || 0,
          expiration_date: i.expiration_date,
          purchase_price: i.purchase_price,
          currency: i.currency,
          internal_use: i.internal_use || false,
          is_patrimonio: i.is_patrimonio ?? (i.category?.toLowerCase().includes('patrim') || false),
          patrimony_number: i.patrimony_number || '',
          location: i.location || '',
          condition: i.condition || 'bom',
          dosage_form: i.dosage_form || medMeta[i.id]?.dosage_form || (i.unit?.toLowerCase().includes('frasco') ? 'liquido' : i.unit?.toLowerCase().includes('caixa') ? 'comprimido' : undefined),
          package_units: i.package_units !== undefined && i.package_units !== null ? Number(i.package_units) : medMeta[i.id]?.package_units,
          liquid_volume_ml: i.liquid_volume_ml !== undefined && i.liquid_volume_ml !== null ? Number(i.liquid_volume_ml) : medMeta[i.id]?.liquid_volume_ml
        })));
      }

      if (transRes.data) {
        setTransactions(transRes.data.filter(t => t.transaction_type === 'in').map(t => ({
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
            quantity: ki.quantity,
            dosage: ki.dosage || undefined
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
    const fullPayload: any = {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_quantity: item.min_quantity,
      expiration_date: item.expiration_date || null,
      purchase_price: item.purchase_price || null,
      currency: item.currency || null,
      internal_use: item.internal_use || false,
      is_patrimonio: item.is_patrimonio || false,
      patrimony_number: item.patrimony_number || null,
      location: item.location || null,
      condition: item.condition || 'bom'
    };

    if (item.dosage_form !== undefined) fullPayload.dosage_form = item.dosage_form || null;
    if (item.package_units !== undefined) fullPayload.package_units = item.package_units ? Number(item.package_units) : null;
    if (item.liquid_volume_ml !== undefined) fullPayload.liquid_volume_ml = item.liquid_volume_ml ? Number(item.liquid_volume_ml) : null;

    let { data, error } = await supabase.from('inventory').insert(fullPayload).select().single();
    
    // Resilient fallback if columns are not yet applied in the Supabase schema
    if (error && (error.message.includes('column') || error.code === '42703' || error.message.includes('patrimon') || error.message.includes('internal_use') || error.message.includes('dosage_form') || error.message.includes('package_units') || error.message.includes('liquid_volume'))) {
      const basicPayload = {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        min_quantity: item.min_quantity,
        expiration_date: item.expiration_date || null,
        purchase_price: item.purchase_price || null,
        currency: item.currency || null
      };
      const retry = await supabase.from('inventory').insert(basicPayload).select().single();
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }
    
    if (error) {
      console.error('Supabase Insert Error:', error);
      alert('Erro ao salvar no banco: ' + error.message);
    }
    
    if (data) {
      saveMedMetadata(data.id, {
        dosage_form: item.dosage_form,
        package_units: item.package_units,
        liquid_volume_ml: item.liquid_volume_ml
      });
      setItems(prev => [{
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        min_quantity: data.min_quantity || 0,
        expiration_date: data.expiration_date,
        purchase_price: data.purchase_price,
        currency: data.currency,
        internal_use: item.internal_use || false,
        is_patrimonio: item.is_patrimonio ?? (data.category?.toLowerCase().includes('patrim') || false),
        patrimony_number: item.patrimony_number || '',
        location: item.location || '',
        condition: item.condition || 'bom',
        dosage_form: item.dosage_form,
        package_units: item.package_units,
        liquid_volume_ml: item.liquid_volume_ml
      }, ...prev]);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const fullUpdates: any = {
      name: updates.name,
      category: updates.category,
      quantity: updates.quantity,
      unit: updates.unit,
      min_quantity: updates.min_quantity,
      expiration_date: updates.expiration_date || null,
      purchase_price: updates.purchase_price || null,
      currency: updates.currency || null
    };

    if (updates.internal_use !== undefined) fullUpdates.internal_use = updates.internal_use;
    if (updates.is_patrimonio !== undefined) fullUpdates.is_patrimonio = updates.is_patrimonio;
    if (updates.patrimony_number !== undefined) fullUpdates.patrimony_number = updates.patrimony_number || null;
    if (updates.location !== undefined) fullUpdates.location = updates.location || null;
    if (updates.condition !== undefined) fullUpdates.condition = updates.condition || 'bom';
    if (updates.dosage_form !== undefined) fullUpdates.dosage_form = updates.dosage_form || null;
    if (updates.package_units !== undefined) fullUpdates.package_units = updates.package_units ? Number(updates.package_units) : null;
    if (updates.liquid_volume_ml !== undefined) fullUpdates.liquid_volume_ml = updates.liquid_volume_ml ? Number(updates.liquid_volume_ml) : null;

    saveMedMetadata(id, {
      ...(updates.dosage_form !== undefined ? { dosage_form: updates.dosage_form } : {}),
      ...(updates.package_units !== undefined ? { package_units: updates.package_units } : {}),
      ...(updates.liquid_volume_ml !== undefined ? { liquid_volume_ml: updates.liquid_volume_ml } : {})
    });

    let { error } = await supabase.from('inventory').update(fullUpdates).eq('id', id);
    
    // Resilient fallback if columns are not yet applied in the Supabase schema
    if (error && (error.message.includes('column') || error.code === '42703' || error.message.includes('patrimon') || error.message.includes('internal_use') || error.message.includes('dosage_form') || error.message.includes('package_units') || error.message.includes('liquid_volume'))) {
      const basicUpdates = {
        name: updates.name,
        category: updates.category,
        quantity: updates.quantity,
        unit: updates.unit,
        min_quantity: updates.min_quantity,
        expiration_date: updates.expiration_date || null,
        purchase_price: updates.purchase_price || null,
        currency: updates.currency || null
      };
      const retry = await supabase.from('inventory').update(basicUpdates).eq('id', id);
      if (!retry.error) {
        error = null;
      }
    }

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
          quantity: ki.quantity,
          dosage: ki.dosage || null
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
            quantity: ki.quantity,
            dosage: ki.dosage || null
          })));
        }
      }
      setKits(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
    }
  };

  const deleteKit = async (id: string) => {
    try {
      // Disassociate from clinical events if referenced
      await supabase.from('clinical_events').update({ kit_delivered_id: null }).eq('kit_delivered_id', id);
    } catch (e) {
      console.warn('Could not nullify kit_delivered_id in clinical_events:', e);
    }

    // Explicitly delete kit_items to prevent FK constraint issues
    await supabase.from('kit_items').delete().eq('kit_id', id);

    const { error } = await supabase.from('kits').delete().eq('id', id);
    if (!error) {
      setKits(prev => prev.filter(k => k.id !== id));
    } else {
      console.error('Error deleting kit:', error);
      alert('Erro ao excluir kit: ' + error.message);
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
      }
    }
  };

  return (
    <InventoryContext.Provider value={{ 
      items, kits, categories, transactions, 
      addItem, updateItem, deleteItem,
      addKit, updateKit, deleteKit,
      addCategory, updateCategory, deleteCategory,
      deductKitFromInventory, deductPrescriptionsFromInventory, addTransaction,
      refreshData: fetchData
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
