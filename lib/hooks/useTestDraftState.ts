import { useState, useCallback } from 'react';

// Types
interface User {
  id: string;
  name: string;
  address: string;
}

interface Pick {
  pickNumber: number;
  userId: string;
  userName: string;
  outcome: 'YES' | 'NO';
  marketTitle: string;
}

interface League {
  id: string;
  name: string;
  users: User[];
  totalRounds: number;
}

// Simple test hook
export function useTestDraftState() {
  const [currentPick, setCurrentPick] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  
  const makePick = useCallback(async (marketId: string, outcome: 'YES' | 'NO') => {
    console.log('Test pick:', marketId, outcome);
  }, []);
  
  const mockPicks: Pick[] = [
    {
      pickNumber: 1,
      userId: 'user1',
      userName: 'Alex Chen',
      outcome: 'YES',
      marketTitle: 'Will BTC reach $100k by EOY?'
    },
    {
      pickNumber: 2,
      userId: 'user2', 
      userName: 'Sarah Miller',
      outcome: 'NO',
      marketTitle: 'Will ETH 2.0 launch in Q4?'
    },
    {
      pickNumber: 3,
      userId: 'user3',
      userName: 'Mike Johnson',
      outcome: 'YES',
      marketTitle: 'Will Solana flip ETH?'
    },
    {
      pickNumber: 4,
      userId: 'current-user',
      userName: 'You',
      outcome: 'NO',
      marketTitle: 'Will NFT volume increase?'
    },
    {
      pickNumber: 5,
      userId: 'user5',
      userName: 'Emma Davis',
      outcome: 'YES',
      marketTitle: 'Will DeFi TVL hit $200B?'
    },
    {
      pickNumber: 6,
      userId: 'user6',
      userName: 'Tom Wilson',
      outcome: 'NO',
      marketTitle: 'Will GameFi tokens rally?'
    },
    {
      pickNumber: 7,
      userId: 'user7',
      userName: 'Lisa Anderson',
      outcome: 'YES',
      marketTitle: 'Will Layer 2s dominate?'
    }
  ];
  
  const mockLeague: League = {
    id: 'demo-league',
    name: 'PolyDraft Championship',
    users: [
      { id: 'current-user', name: 'You', address: '0x1234...5678' },
      { id: 'user1', name: 'Alex Chen', address: '0x8765...4321' },
      { id: 'user2', name: 'Sarah Miller', address: '0x9876...1234' },
      { id: 'user3', name: 'Mike Johnson', address: '0x5432...8765' }
    ],
    totalRounds: 3
  };
  
  return {
    currentPick,
    isLoading,
    makePick,
    picks: mockPicks,
    timeRemaining: 45,
    isUserTurn: true,
    error: null,
    draftStatus: 'active' as const,
    league: mockLeague,
    startDraft: async () => {},
    getCurrentTurnUser: () => ({ id: 'current-user', name: 'You', address: '0x1234...5678' })
  };
}