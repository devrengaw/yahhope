import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreProduct } from '../pages/admin/AdminStoreManager';
import { supabase } from '../lib/supabase';

interface StoreContextType {
  products: StoreProduct[];
  addProduct: (product: StoreProduct) => void;
  updateProduct: (product: StoreProduct) => void;
  deleteProduct: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false });
      if (data) {
        setProducts(data as StoreProduct[]);
      }
    } catch (e) {
      console.error('Error fetching store products', e);
    }
  };

  const addProduct = async (product: StoreProduct) => {
    const tempId = product.id || Math.random().toString();
    setProducts(prev => [{ ...product, id: tempId }, ...prev]);

    try {
      const { data } = await supabase.from('store_products').insert({
        name: product.name,
        description: product.description,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
        category: product.category,
        status: product.status
      }).select().single();

      if (data) {
        setProducts(prev => prev.map(p => p.id === tempId ? data : p));
      }
    } catch (e) {
      console.error('Error adding product', e);
      fetchProducts();
    }
  };

  const updateProduct = async (product: StoreProduct) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));

    if (product.id.length > 10) {
      await supabase.from('store_products').update({
        name: product.name,
        description: product.description,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
        category: product.category,
        status: product.status
      }).eq('id', product.id);
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (id.length > 10) {
      await supabase.from('store_products').delete().eq('id', id);
    }
  };

  return (
    <StoreContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
