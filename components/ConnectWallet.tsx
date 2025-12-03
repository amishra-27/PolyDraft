'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Wallet, Check } from 'lucide-react';

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className }: ConnectWalletProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = () => {
    // Placeholder for wallet connection logic
    // In a real app, this would integrate with wallet providers (MetaMask, WalletConnect, etc.)
    setIsConnected(true);
    setAddress('0x1234...5678'); // Mock address
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress(null);
  };

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="bg-success/10 border border-success/30 rounded-full px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full"></div>
          <span className="text-success font-mono text-xs font-bold">{address}</span>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleDisconnect}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="primary" 
      size="md" 
      onClick={handleConnect}
      className={`opacity-90 hover:opacity-100 ${className}`}
    >
      <Wallet size={18} className="mr-2" />
      Connect Wallet
    </Button>
  );
}

