import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isAlert?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ConfirmState | null>(null);

  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        setModalState({
          isOpen: true,
          title: 'Confirmação',
          message: options,
          type: 'danger',
          resolve
        });
      } else {
        setModalState({
          ...options,
          isOpen: true,
          type: options.type || 'danger',
          resolve
        });
      }
    });
  };

  const alert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'info',
        isAlert: true,
        resolve: () => resolve()
      });
    });
  };

  const handleClose = (value: boolean) => {
    if (modalState) {
      modalState.resolve(value);
      setModalState({ ...modalState, isOpen: false });
      setTimeout(() => setModalState(null), 200); // Wait for fade out animation
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      
      {modalState?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              modalState.type === 'danger' ? 'bg-red-50 text-red-500' :
              modalState.type === 'info' ? 'bg-blue-50 text-blue-500' :
              'bg-amber-50 text-amber-500'
            }`}>
              {modalState.type === 'danger' ? <AlertCircle size={32} /> :
               modalState.type === 'info' ? <Info size={32} /> :
               <AlertCircle size={32} />}
            </div>
            
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">{modalState.title}</h3>
            <p className="text-slate-500 text-center text-sm mb-8 font-medium">{modalState.message}</p>
            
            <div className="flex gap-3">
              {!modalState.isAlert && (
                <button 
                  onClick={() => handleClose(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all"
                >
                  {modalState.cancelText || 'Cancelar'}
                </button>
              )}
              <button 
                onClick={() => handleClose(true)}
                className={`flex-1 text-white py-3 rounded-xl font-bold transition-all shadow-lg ${
                  modalState.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                  modalState.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' :
                  'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                }`}
              >
                {modalState.confirmText || (modalState.isAlert ? 'OK' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
