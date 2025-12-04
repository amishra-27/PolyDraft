'use client';
import { Button } from '@/components/ui/Button';
import { Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className }: ConnectWalletProps) {
  const { user, isAuthenticated, isLoading, signIn, signOut, error } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="bg-muted/10 border border-muted/30 rounded-full px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 bg-muted rounded-full animate-pulse"></div>
          <span className="text-muted font-mono text-xs font-bold">Connecting...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button 
          onClick={signIn}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <Shield className="w-3 h-3 mr-1" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="bg-success/10 border border-success/30 rounded-full px-3 py-1.5 flex items-center gap-2">
          <User className="w-3 h-3 text-success" />
          <span className="text-success font-mono text-xs font-bold">
            {user.display_name || user.username}
          </span>
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="text-xs text-muted hover:text-text"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Not authenticated - show sign in button
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        onClick={signIn}
        variant="primary"
        size="sm"
        className="text-xs font-bold"
      >
        <Shield className="w-3 h-3 mr-1" />
        Sign In with Base
      </Button>
    </div>
  );
}