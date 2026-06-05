import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotification, Notification } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

export function NotificationBell({ isLight = false }: { isLight?: boolean }) {
  const { notifications, markAsRead, markAllAsRead, requestPermission, permission } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all",
          isLight ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 shadow-sm" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {unreadCount} Novas
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <Check size={12} /> Ler tudo
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-slate-50",
                      !notif.read ? "bg-blue-50/30" : "opacity-75"
                    )}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm mb-1", !notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-wider">
                          {new Date(notif.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {permission !== 'granted' && (
            <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium mb-1">Ative as notificações no navegador</p>
                <button 
                  onClick={requestPermission}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest"
                >
                  Ativar agora
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
