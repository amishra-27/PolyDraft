'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UserPlus, X, Check, AlertCircle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/lib/utils/toast';
import { 
  DraftErrorClass, 
  ErrorCode,
  createNetworkError, 
  createTimeoutError, 
  createLeagueError,
  retryWithBackoff,
  logError,
  parseError 
} from '@/lib/utils/error-handling';

interface JoinLeagueButtonProps {
  className?: string;
  onLeagueJoined?: (leagueId: string) => void;
}

type JoinState = 'idle' | 'input' | 'loading' | 'success' | 'error';

interface ValidationError {
  isValid: boolean;
  message: string;
}

export function JoinLeagueButton({ className, onLeagueJoined }: JoinLeagueButtonProps) {
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [leagueId, setLeagueId] = useState('');
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [joinError, setJoinError] = useState<DraftErrorClass | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedJoin, setLastFailedJoin] = useState<string>('');
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  // Mock valid league IDs for simulation
  const mockValidLeagues = ['ABC123', 'XYZ789', 'DRAFT1'];
  const mockFullLeagues = ['FULL99'];
  const mockAlreadyJoinedLeagues = ['MYLEAG'];

  const validateLeagueId = (id: string): ValidationError => {
    if (!id.trim()) {
      return { isValid: false, message: 'League ID is required' };
    }
    if (id.length < 3) {
      return { isValid: false, message: 'League ID must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return { isValid: false, message: 'League ID must be alphanumeric only' };
    }
    return { isValid: true, message: '' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setLeagueId(value);
    
    if (value) {
      const validation = validateLeagueId(value);
      setValidationError(validation);
    } else {
      setValidationError(null);
    }
  };

  const simulateJoinLeague = async (id: string): Promise<void> => {
    await retryWithBackoff(async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate network errors
      if (Math.random() < 0.1) {
        throw createNetworkError('Unable to connect to league service');
      } else if (Math.random() < 0.15) {
        throw createTimeoutError(5000);
      }

      // Mock different scenarios
      if (mockValidLeagues.includes(id)) {
        return; // Success
      } else if (mockFullLeagues.includes(id)) {
        throw createLeagueError(ErrorCode.LEAGUE_FULL, 'This league is full');
      } else if (mockAlreadyJoinedLeagues.includes(id)) {
        throw createLeagueError(ErrorCode.ALREADY_JOINED, 'You have already joined this league');
      } else {
        throw createLeagueError(ErrorCode.LEAGUE_NOT_FOUND, 'League not found');
      }
    }, {
      maxAttempts: 3,
      baseDelay: 1000,
      shouldRetry: (error, attempt) => error.retryable && attempt < 3
    });
  };

  const handleJoinClick = async () => {
    const validation = validateLeagueId(leagueId);
    if (!validation.isValid) {
      setValidationError(validation);
      return;
    }

    setJoinState('loading');
    setJoinError(null);
    setRetryCount(0);
    setLastFailedJoin('');

    try {
      await simulateJoinLeague(leagueId);
      
      // Success
      setJoinState('success');
      showSuccess('Successfully joined league!');
      onLeagueJoined?.(leagueId);
      
      // Reset form after success
      setTimeout(() => {
        setJoinState('idle');
        setLeagueId('');
        setValidationError(null);
        setJoinError(null);
        setRetryCount(0);
        setLastFailedJoin('');
      }, 2000);
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'joinLeague', leagueId });
      
      setJoinState('error');
      setJoinError(error);
      setLastFailedJoin(leagueId);
      showError(error);
    }
  };

  const handleRetry = async () => {
    if (!lastFailedJoin) return;
    
    setRetryCount(prev => prev + 1);
    setJoinState('loading');
    setJoinError(null);
    
    try {
      await simulateJoinLeague(lastFailedJoin);
      
      // Success on retry
      setJoinState('success');
      showSuccess('Successfully joined league!');
      onLeagueJoined?.(lastFailedJoin);
      
      setTimeout(() => {
        setJoinState('idle');
        setLeagueId('');
        setValidationError(null);
        setJoinError(null);
        setRetryCount(0);
        setLastFailedJoin('');
      }, 2000);
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'retryJoinLeague', leagueId: lastFailedJoin, retryCount: retryCount + 1 });
      
      setJoinState('error');
      setJoinError(error);
      
      if (retryCount >= 2) {
        showWarning('Maximum retry attempts reached. Please check your connection and try again later.');
      } else {
        showError(error);
      }
    }
  };

  const handleCancel = () => {
    setJoinState('idle');
    setLeagueId('');
    setValidationError(null);
    setJoinError(null);
    setRetryCount(0);
    setLastFailedJoin('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && joinState === 'input') {
      handleJoinClick();
    }
  };

  if (joinState === 'idle') {
    return (
      <Button
        onClick={() => setJoinState('input')}
        className={className}
        variant="outline"
      >
        <UserPlus size={16} className="mr-2" />
        Join League
      </Button>
    );
  }

  if (joinState === 'success') {
    return (
      <div className="flex items-center gap-2 text-success animate-in fade-in slide-in-from-left-2 duration-300">
        <Check size={16} className="animate-bounce" />
        <span className="text-sm">League joined successfully!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={leagueId}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter league ID"
            className="w-full h-11 px-4 bg-surface border border-white/10 rounded-lg text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            disabled={joinState === 'loading'}
            maxLength={10}
            autoFocus
          />
          
          {joinState === 'loading' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <Button
          onClick={handleJoinClick}
          disabled={joinState === 'loading' || !validationError?.isValid}
          isLoading={joinState === 'loading'}
          size="md"
          className="min-w-[60px]"
        >
          Join
        </Button>
        
        <Button
          onClick={handleCancel}
          variant="outline"
          size="md"
          disabled={joinState === 'loading'}
          className="min-w-[40px] px-2"
        >
          <X size={16} />
        </Button>
      </div>
      
       {/* Validation Error */}
       {validationError && !validationError.isValid && leagueId && (
         <div className="flex items-center gap-1 text-error text-xs animate-in fade-in slide-in-from-top-1 duration-200">
           <AlertCircle size={12} />
           <span>{validationError.message}</span>
         </div>
       )}
       
        {/* Join Error */}
        {joinError && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1 text-error text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{joinError.userMessage}</span>
            </div>
            
            {/* Retry option for retryable errors */}
            {joinError.retryable && retryCount < 3 && (
              <button
                onClick={handleRetry}
                disabled={joinState === 'loading'}
                className="flex items-center gap-1 text-xs text-warning hover:text-warning/80 font-medium disabled:opacity-50"
              >
                <RefreshCw size={10} className={joinState === 'loading' ? 'animate-spin' : ''} />
                {joinState === 'loading' ? 'Retrying...' : `Retry (${retryCount}/3)`}
              </button>
            )}
            
            {/* Network status indicator */}
            {joinError.code === ErrorCode.NETWORK_ERROR && (
              <div className="flex items-center gap-1 text-xs text-text-dim">
                <WifiOff size={10} />
                <span>Check your internet connection</span>
              </div>
            )}
          </div>
        )}
      
      {/* Help Text */}
      {!validationError?.isValid && !leagueId && (
        <div className="text-text-dim text-xs">
          Enter a league ID (3-10 alphanumeric characters)
        </div>
      )}
      
      {/* Mock League IDs for testing */}
      <div className="text-text-dim text-xs">
        Test IDs: ABC123 (valid), FULL99 (full), MYLEAG (already joined)
      </div>
    </div>
  );
}