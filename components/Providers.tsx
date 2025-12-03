'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        chain={base}
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      >
        {children}
      </OnchainKitProvider>
    </QueryClientProvider>
  );
}