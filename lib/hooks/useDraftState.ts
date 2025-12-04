import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DraftErrorClass, 
  retryWithBackoff,
  logError,
  parseError 
} from '@/lib/utils/error-handling';
import { useToast } from '@/lib/utils/toast';

// Types
export interface User {
  id: string;
  name: string;
  address: string;
  avatar?: string;
}

export interface Pick {
  id: string;
  pickNumber: number;
  userId: string;
  userName: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  timestamp: Date;
}

export interface DraftLeague {
  id: string;
  name: string;
  users: User[];
  draftOrder: string[];
  status: 'waiting' | 'active' | 'completed';
  totalRounds: number;
  currentPick: number;
  createdAt: Date;
}

export interface UseDraftStateReturn {
  // State
  currentPick: number;
  currentTurnUserId: string;
  picks: Pick[];
  timeRemaining: number;
  isUserTurn: boolean;
  isLoading: boolean;
  error: DraftErrorClass | null;
  draftStatus: 'waiting' | 'active' | 'completed';
  league: DraftLeague | null;
  
  // Actions
  makePick: (marketId: string, outcome: 'YES' | 'NO') => Promise<void>;
  startDraft: () => Promise<void>;
  leaveDraft: () => void;
  retryLastAction: () => Promise<void>;
  
  // Computed
  getCurrentTurnUser: () => User | null;
  getPickByNumber: (pickNumber: number) => Pick | null;
  getUserPicks: (userId: string) => Pick[];
  getTurnOrder: () => User[];
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Chen',
    address: '0x1234...5678',
    avatar: '👨‍💻'
  },
  {
    id: '2',
    name: 'Sarah Miller',
    address: '0x8765...4321',
    avatar: '👩‍💼'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    address: '0x9876...1234',
    avatar: '🧑‍🎓'
  },
  {
    id: '4',
    name: 'Emma Davis',
    address: '0x5432...8765',
    avatar: '👩‍🎨'
  },
  {
    id: '5',
    name: 'Chris Wilson',
    address: '0x2468...1357',
    avatar: '🧑‍🔬'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    address: '0x1357...2468',
    avatar: '👩‍🏫'
  }
];

const mockMarkets = [
  { id: 'market-1', title: 'Will Bitcoin reach $100k by end of 2024?' },
  { id: 'market-2', title: 'Will Trump win 2024 US election?' },
  { id: 'market-3', title: 'Will Ethereum 2.0 be fully implemented by Q4 2024?' },
  { id: 'market-4', title: 'Will AI surpass human intelligence by 2030?' },
  { id: 'market-5', title: 'Will Tesla stock reach $500 by end of 2024?' },
  { id: 'market-6', title: 'Will US enter recession in 2024?' },
  { id: 'market-7', title: 'Will SpaceX land humans on Mars by 2030?' },
  { id: 'market-8', title: 'Will Apple release AR glasses by 2025?' },
  { id: 'market-9', title: 'Will China overtake US economy by 2030?' },
  { id: 'market-10', title: 'Will quantum computing break encryption by 2035?' },
  { id: 'market-11', title: 'Will renewable energy provide 50% of global power by 2030?' },
  { id: 'market-12', title: 'Will self-driving cars be mainstream by 2028?' }
];

// Helper functions
const calculateSnakeDraftOrder = (users: User[], totalRounds: number): string[] => {
  const order: string[] = [];
  
  for (let round = 0; round < totalRounds; round++) {
    const roundUsers = round % 2 === 0 
      ? users.map(u => u.id)
      : users.map(u => u.id).reverse();
    
    order.push(...roundUsers);
  }
  
  return order;
};

const getCurrentTurnUserId = (currentPick: number, draftOrder: string[]): string | null => {
  if (currentPick >= draftOrder.length) return null;
  return draftOrder[currentPick];
};

// Mock API functions
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

const mockStartDraft = async (leagueId: string): Promise<void> => {
  await mockApiDelay();
  // Simulate API call
  if (Math.random() < 0.1) {
    throw new Error('Failed to start draft. Please try again.');
  }
};

const mockMakePick = async (pick: Omit<Pick, 'id' | 'timestamp'>): Promise<Pick> => {
  await mockApiDelay();
  
  // Simulate validation errors
  if (Math.random() < 0.05) {
    throw new Error('Market is no longer available for picking.');
  }
  
  if (Math.random() < 0.05) {
    throw new Error('Invalid pick. Please try again.');
  }
  
  return {
    ...pick,
    id: `pick-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date()
  };
};

// Main hook
export function useDraftState(leagueId?: string, currentUserId?: string): UseDraftStateReturn {
  const [league, setLeague] = useState<DraftLeague | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(45);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<DraftErrorClass | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);
  const { showError, showSuccess, showWarning } = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  
  // Initialize mock league
  useEffect(() => {
    if (!leagueId) return;
    
    const mockLeague: DraftLeague = {
      id: leagueId,
      name: 'PolyDraft Championship',
      users: mockUsers.slice(0, 4 + Math.floor(Math.random() * 3)), // 4-6 users
      draftOrder: [],
      status: 'waiting',
      totalRounds: 3,
      currentPick: 0,
      createdAt: new Date()
    };
    
    mockLeague.draftOrder = calculateSnakeDraftOrder(mockLeague.users, mockLeague.totalRounds);
    setLeague(mockLeague);
  }, [leagueId]);
  
  // Calculate derived state
  const currentPick = league?.currentPick ?? 0;
  const currentTurnUserId = getCurrentTurnUserId(currentPick, league?.draftOrder ?? []);
  const draftStatus = league?.status ?? 'waiting';
  const isUserTurn = currentUserId === currentTurnUserId;
  const totalPicks = league?.draftOrder.length ?? 0;
  
  // Timer management
  useEffect(() => {
    if (draftStatus !== 'active' || !isUserTurn) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-pick random market for user if time expires
          handleAutoPick();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [draftStatus, isUserTurn, currentTurnUserId]);
  
  // Simulate opponent picks
  useEffect(() => {
    if (draftStatus !== 'active' || isUserTurn || !league) return;
    
    const simulateOpponentPick = async () => {
      const currentUser = league.users.find(u => u.id === currentTurnUserId);
      if (!currentUser) return;
      
      // Random delay between 3-8 seconds
      const delay = 3000 + Math.random() * 5000;
      
      simulationRef.current = setTimeout(async () => {
        try {
          const availableMarkets = mockMarkets.filter(
            market => !picks.some(pick => pick.marketId === market.id)
          );
          
          if (availableMarkets.length === 0) return;
          
          const randomMarket = availableMarkets[Math.floor(Math.random() * availableMarkets.length)];
          const randomOutcome = Math.random() < 0.5 ? 'YES' : 'NO';
          
          const newPick = await mockMakePick({
            pickNumber: currentPick,
            userId: currentUser.id,
            userName: currentUser.name,
            marketId: randomMarket.id,
            marketTitle: randomMarket.title,
            outcome: randomOutcome
          });
          
          setPicks(prev => [...prev, newPick]);
          setLeague(prev => prev ? { ...prev, currentPick: currentPick + 1 } : null);
          setTimeRemaining(45);
          
          // Check if draft is completed
          if (currentPick + 1 >= totalPicks) {
            setLeague(prev => prev ? { ...prev, status: 'completed' } : null);
          }
        } catch (err) {
          console.error('Error simulating opponent pick:', err);
        }
      }, delay);
    };
    
    simulateOpponentPick();
    
    return () => {
      if (simulationRef.current) {
        clearTimeout(simulationRef.current);
      }
    };
  }, [draftStatus, isUserTurn, currentTurnUserId, currentPick, league, picks, totalPicks]);
  
  // Auto-pick handler
  const handleAutoPick = useCallback(async () => {
    if (!currentUserId || !league) return;
    
    try {
      const availableMarkets = mockMarkets.filter(
        market => !picks.some(pick => pick.marketId === market.id)
      );
      
      if (availableMarkets.length === 0) return;
      
      const randomMarket = availableMarkets[Math.floor(Math.random() * availableMarkets.length)];
      const randomOutcome = Math.random() < 0.5 ? 'YES' : 'NO';
      
      await makePick(randomMarket.id, randomOutcome);
    } catch (err) {
      console.error('Error in auto-pick:', err);
    }
  }, [currentUserId, league, picks]);
  
  // Actions
  const makePick = useCallback(async (marketId: string, outcome: 'YES' | 'NO') => {
    if (!currentUserId || !league || draftStatus !== 'active' || !isUserTurn) {
      throw new Error('Cannot make pick at this time.');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const market = mockMarkets.find(m => m.id === marketId);
      if (!market) {
        throw new Error('Market not found.');
      }
      
      // Check if market already picked
      if (picks.some(pick => pick.marketId === marketId)) {
        throw new Error('Market already picked.');
      }
      
      const currentUser = league.users.find(u => u.id === currentUserId);
      if (!currentUser) {
        throw new Error('User not found in league.');
      }
      
      const newPick = await mockMakePick({
        pickNumber: currentPick,
        userId: currentUserId,
        userName: currentUser.name,
        marketId,
        marketTitle: market.title,
        outcome
      });
      
      setPicks(prev => [...prev, newPick]);
      setLeague(prev => prev ? { ...prev, currentPick: currentPick + 1 } : null);
      setTimeRemaining(45);
      
      // Check if draft is completed
      if (currentPick + 1 >= totalPicks) {
        setLeague(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    } catch (err) {
      const draftError = parseError(err);
      setError(draftError);
      logError(draftError, { action: 'makePick', marketId, outcome });
      showError(draftError);
      setLastFailedAction(() => () => makePick(marketId, outcome));
      throw draftError;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, league, draftStatus, isUserTurn, currentPick, picks, totalPicks]);
  
  const startDraft = useCallback(async () => {
    if (!league) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await mockStartDraft(league.id);
      setLeague(prev => prev ? { ...prev, status: 'active' } : null);
      setTimeRemaining(45);
    } catch (err) {
      const draftError = parseError(err);
      setError(draftError);
      logError(draftError, { action: 'startDraft', leagueId: league?.id });
      showError(draftError);
      setLastFailedAction(() => startDraft());
      throw draftError;
    } finally {
      setIsLoading(false);
    }
  }, [league]);
  
  const leaveDraft = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (simulationRef.current) {
      clearTimeout(simulationRef.current);
    }
    
    setLeague(null);
    setPicks([]);
    setTimeRemaining(45);
    setError(null);
    setLastFailedAction(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const retryLastAction = useCallback(async () => {
    if (!lastFailedAction) {
      showWarning('No action to retry');
      return;
    }

    try {
      await retryWithBackoff(lastFailedAction, {
        maxAttempts: 3,
        baseDelay: 1000,
        shouldRetry: (error, attempt) => error.retryable && attempt < 3
      });
      setLastFailedAction(null);
      showSuccess('Action completed successfully');
    } catch (err) {
      const draftError = parseError(err);
      logError(draftError, { action: 'retryLastAction' });
      showError(draftError);
    }
  }, [lastFailedAction, showError, showSuccess, showWarning]);
  
  // Computed functions
  const getCurrentTurnUser = useCallback((): User | null => {
    if (!league || !currentTurnUserId) return null;
    return league.users.find(u => u.id === currentTurnUserId) ?? null;
  }, [league, currentTurnUserId]);
  
  const getPickByNumber = useCallback((pickNumber: number): Pick | null => {
    return picks.find(pick => pick.pickNumber === pickNumber) ?? null;
  }, [picks]);
  
  const getUserPicks = useCallback((userId: string): Pick[] => {
    return picks.filter(pick => pick.userId === userId);
  }, [picks]);
  
  const getTurnOrder = useCallback((): User[] => {
    if (!league) return [];
    return league.draftOrder
      .map(userId => league.users.find(u => u.id === userId))
      .filter((user): user is User => user !== undefined);
  }, [league]);
  
  return {
    // State
    currentPick,
    currentTurnUserId: currentTurnUserId ?? '',
    picks,
    timeRemaining,
    isUserTurn,
    isLoading,
    error,
    draftStatus,
    league,
    
    // Actions
    makePick,
    startDraft,
    leaveDraft,
    retryLastAction,
    
    // Computed
    getCurrentTurnUser,
    getPickByNumber,
    getUserPicks,
    getTurnOrder
  };
}