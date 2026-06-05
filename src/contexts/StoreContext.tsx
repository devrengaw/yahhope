import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreProduct } from '../pages/admin/AdminStoreManager';

interface StoreContextType {
  products: StoreProduct[];
  addProduct: (product: StoreProduct) => void;
  updateProduct: (product: StoreProduct) => void;
  deleteProduct: (id: string) => void;
}

const mockProducts: StoreProduct[] = [
  {
    id: '1',
    name: 'Camiseta YAH Hope',
    description: '100% Algodão, edição limitada da campanha de nutrição.',
    cost_price: 25.00,
    sale_price: 59.90,
    stock_quantity: 50,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    category: 'Vestuário',
    status: 'active'
  },
  {
    id: '2',
    name: 'Cesta Básica Completa',
    description: 'Doe uma cesta básica que alimentará uma família por 1 mês.',
    cost_price: 150.00,
    sale_price: 150.00,
    stock_quantity: 999,
    image_url: 'https://images.unsplash.com/photo-1584285404535-717013fcbd38?w=800&q=80',
    category: 'Doação Direta',
    status: 'active'
  },
  {
    id: '3',
    name: 'Caderno YAH Hope',
    description: 'Caderno de anotações exclusivo. Toda renda revertida para a escola.',
    cost_price: 10.00,
    sale_price: 35.00,
    stock_quantity: 120,
    image_url: 'https://images.unsplash.com/photo-1531346878377-a544e36049a5?w=800&q=80',
    category: 'Papelaria',
    status: 'active'
  }
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>(() => {
    const saved = localStorage.getItem('yah_store_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockProducts;
      }
    }
    return mockProducts;
  });

  useEffect(() => {
    localStorage.setItem('yah_store_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (product: StoreProduct) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (product: StoreProduct) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
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
