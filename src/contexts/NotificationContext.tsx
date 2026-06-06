import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(window.Notification.permission);
    }
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const newRecord = payload.new;
        const newNotif: Notification = {
          id: newRecord.id,
          title: newRecord.title,
          message: newRecord.message,
          read: newRecord.read,
          date: newRecord.created_at,
          type: newRecord.type as 'info' | 'success' | 'warning'
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Browser push
        if ('Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification(newRecord.title, {
            body: newRecord.message,
            icon: '/vite.svg',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          read: n.read,
          date: n.created_at,
          type: n.type as 'info' | 'success' | 'warning'
        })));
      }
    } catch (e) {
      console.error('Error fetching notifications', e);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    const result = await window.Notification.requestPermission();
    setPermission(result);
  };

  const sendNotification = async (title: string, message: string, type: Notification['type'] = 'info') => {
    const tempId = Math.random().toString();
    const newNotif: Notification = {
      id: tempId,
      title,
      message,
      read: false,
      date: new Date().toISOString(),
      type
    };

    setNotifications(prev => [newNotif, ...prev]);

    try {
      const { data } = await supabase.from('notifications').insert({
        title,
        message,
        type,
        read: false
      }).select().single();

      if (data) {
        setNotifications(prev => prev.map(n => n.id === tempId ? { ...n, id: data.id } : n));
      }
    } catch (e) {
      console.error('Error saving notification', e);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (id.length > 10) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('read', false);
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
