import React from 'react'; // Added import
import ProviderBottomNav from '@/components/provider/ProviderBottomNav';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProviderBottomNav />
    </>
  );
}