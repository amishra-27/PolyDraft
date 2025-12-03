// Dummy data for development and preview

export const dummyLeagues = {
  active: [
    {
      id: "1",
      title: "Crypto Whales 2024",
      entryFee: "$50",
      prizePool: "$500",
      members: 8,
      maxMembers: 10,
      status: "drafting" as const,
    },
    {
      id: "2",
      title: "Election Prediction",
      entryFee: "$10",
      prizePool: "$100",
      members: 10,
      maxMembers: 10,
      status: "active" as const,
    },
  ],
  open: [
    {
      id: "3",
      title: "Tech Stocks Q3",
      entryFee: "$25",
      prizePool: "$250",
      members: 3,
      maxMembers: 10,
      status: "open" as const,
    },
    {
      id: "4",
      title: "Sports Futures",
      entryFee: "$5",
      prizePool: "$50",
      members: 1,
      maxMembers: 10,
      status: "open" as const,
    },
    {
      id: "5",
      title: "DeFi Summer 2024",
      entryFee: "$100",
      prizePool: "$1000",
      members: 5,
      maxMembers: 10,
      status: "open" as const,
    },
  ],
};

export const dummyMarkets = [
  {
    id: "1",
    title: "Will Bitcoin hit $100k by Dec 31, 2024?",
    category: "Crypto",
    endDate: "Dec 31, 2024",
  },
  {
    id: "2",
    title: "US Election 2024: Winner?",
    category: "Politics",
    endDate: "Nov 5, 2024",
  },
  {
    id: "3",
    title: "Super Bowl 2025 Winner",
    category: "Sports",
    endDate: "Feb 2025",
  },
  {
    id: "4",
    title: "Ethereum ETF Approval Date",
    category: "Crypto",
    endDate: "May 2024",
  },
  {
    id: "5",
    title: "SpaceX Starship Successful Orbit",
    category: "Tech",
    endDate: "Jun 2024",
  },
];

export const dummyUserStats = {
  wins: 12,
  rank: 42,
  trophies: 3,
  joinDate: "Jan '24",
  recentLeagues: [
    {
      id: "1",
      name: "Crypto Whales 2024",
      rank: 8,
      points: 450,
      change: 12,
    },
    {
      id: "2",
      name: "Election Prediction",
      rank: 3,
      points: 950,
      change: 2,
    },
  ],
};

export const dummyLeaderboard = [
  { rank: 1, username: "CryptoKing", points: 9500, change: 2 },
  { rank: 2, username: "MarketMaster", points: 8900, change: -1 },
  { rank: 3, username: "PredictPro", points: 8400, change: 1 },
  { rank: 42, username: "You", points: 4500, change: 12, isCurrentUser: true },
];
