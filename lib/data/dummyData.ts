/**
 * Dummy data for development and testing
 */

export const dummyLeagues = [
  {
    id: '1',
    name: 'Crypto Whales 2024',
    description: 'High-stakes crypto prediction league',
    entryFee: '50',
    maxPlayers: 10,
    currentPlayers: 8,
    status: 'active',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    prizePool: '500',
    creator: '0x1234...5678',
    image: '/crypto-whales.jpg'
  },
  {
    id: '2', 
    name: 'Live Election Prediction',
    description: 'Predict the 2024 election results',
    entryFee: '10',
    maxPlayers: 10,
    currentPlayers: 10,
    status: 'active',
    startDate: '2024-11-15',
    endDate: '2024-11-20',
    prizePool: '100',
    creator: '0x8765...4321',
    image: '/election-prediction.jpg'
  },
  {
    id: '3',
    name: 'Open Tech Stocks Q3',
    description: 'Technology stock predictions for Q3 2024',
    entryFee: '25',
    maxPlayers: 10,
    currentPlayers: 3,
    status: 'active',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    prizePool: '250',
    creator: '0x9876...1234',
    image: '/tech-stocks.jpg'
  },
  {
    id: '4',
    name: 'Open Sports Futures',
    description: 'Professional sports betting predictions',
    entryFee: '5',
    maxPlayers: 10,
    currentPlayers: 1,
    status: 'active',
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    prizePool: '50',
    creator: '0x5432...8765',
    image: '/sports-futures.jpg'
  },
  {
    id: '5',
    name: 'DeFi Summer 2024',
    description: 'Decentralized finance predictions',
    entryFee: '100',
    maxPlayers: 10,
    currentPlayers: 5,
    status: 'active',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    prizePool: '1000',
    creator: '0x2468...1357',
    image: '/defi-summer.jpg'
  }
];



export const dummyUsers = [
  {
    id: '1',
    name: 'CryptoWhale42',
    address: '0x1234...5678',
    avatar: '/whale-avatar.jpg',
    wins: 12,
    losses: 8,
    totalLeagues: 15,
    totalPoints: 2450
  },
  {
    id: '2',
    name: 'ElectionGuru',
    address: '0x8765...4321',
    avatar: '/election-avatar.jpg',
    wins: 8,
    losses: 5,
    totalLeagues: 10,
    totalPoints: 1820
  },
  {
    id: '3',
    name: 'TechBull2024',
    address: '0x9876...1234',
    avatar: '/tech-avatar.jpg',
    wins: 15,
    losses: 12,
    totalLeagues: 20,
    totalPoints: 3100
  },
  {
    id: '4',
    name: 'SportsFanatic',
    address: '0x5432...8765',
    avatar: '/sports-avatar.jpg',
    wins: 6,
    losses: 9,
    totalLeagues: 8,
    totalPoints: 1560
  }
];

export const dummyDraftPicks = [
  {
    id: 'pick-1',
    userId: '1',
    userName: 'CryptoWhale42',
    marketId: 'market-1',
    marketTitle: 'Bitcoin will reach $100k by end of 2024',
    outcome: 'YES',
    pickNumber: 1,
    timestamp: '2024-12-01T10:30:00Z'
  },
  {
    id: 'pick-2',
    userId: '2',
    userName: 'ElectionGuru',
    marketId: 'market-2',
    marketTitle: 'Trump wins 2024 election',
    outcome: 'NO',
    pickNumber: 2,
    timestamp: '2024-12-01T10:35:00Z'
  },
  {
    id: 'pick-3',
    userId: '3',
    userName: 'TechBull2024',
    marketId: 'market-3',
    marketTitle: 'Ethereum ETF approval by Q1 2025',
    outcome: 'YES',
    pickNumber: 3,
    timestamp: '2024-12-01T10:40:00Z'
  }
];