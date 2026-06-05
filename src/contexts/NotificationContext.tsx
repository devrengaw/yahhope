import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  type: 'info' | 'success' | 'warning';
}

interface NotificationContextType {
  notifications: Notification[];
  sendNotification: (title: string, message: string, type?: Notification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestPermission: () => Promise<void>;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(window.Notification.permission);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    const result = await window.Notification.requestPermission();
    setPermission(result);
  };

  const sendNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      read: false,
      date: new Date().toISOString(),
      type
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Send browser push notification if permitted
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, {
        body: message,
        icon: '/vite.svg', // generic icon
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      sendNotification, 
      markAsRead, 
      markAllAsRead, 
      requestPermission, 
      permission 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
