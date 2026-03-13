import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockInventory, InventoryItem, mockKits, Kit } from '../lib/mockData';

interface InventoryContextType {
  items: InventoryItem[];
  kits: Kit[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setKits: React.Dispatch<React.SetStateAction<Kit[]>>;
  deductKitFromInventory: (kitId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [kits, setKits] = useState<Kit[]>(mockKits);

  const deductKitFromInventory = (kitId: string) => {
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
        }
      });
      return newItems;
    });
  };

  return (
    <InventoryContext.Provider value={{ items, kits, setItems, setKits, deductKitFromInventory }}>
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
