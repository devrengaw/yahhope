import React from 'react';
import { useDonationModal } from '../../contexts/DonationModalContext';
import { HomeDonationCard } from '../public/HomeDonationCard';

export function DonationModal() {
  const { isOpen, closeDonationModal } = useDonationModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-gotham-regular animate-fade-in overflow-y-auto">
      {/* Backdrop com Blur */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={closeDonationModal}
      />
      
      {/* Container do Card Idêntico à Página Inicial */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md my-auto max-h-[92vh] overflow-y-auto rounded-3xl animate-slideUp sm:animate-none">
        <HomeDonationCard 
          isModal={true}
          onClose={closeDonationModal}
          className="shadow-2xl border-2 border-orange-200"
        />
      </div>
    </div>
  );
}
