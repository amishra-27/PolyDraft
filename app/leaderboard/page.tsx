'use client';

import { LeaderboardRow } from "@/components/LeaderboardRow";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useScores } from "@/lib/hooks/useScores";

export default function LeaderboardPage() {
  const { scores, loading } = useScores('global'); // Use global leaderboard for now

  // Transform scores for LeaderboardRow component
  const leaderboard = scores?.map(score => ({
    rank: (score.rank ?? 0) as number,
    username: score.wallet_address?.slice(0, 8) + '...', // Shorten address
    points: (score.points ?? 0) as number,
    change: 0, // TODO: Calculate change from previous period
    isCurrentUser: false // TODO: Check if current user
  })) || [];

  return (
    <div className="pb-24">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-text-muted text-sm">Top performers</p>
      </header>

      {loading ? (
        <SkeletonLoader type="leaderboard" count={5} />
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <LeaderboardRow
              key={entry.rank}
              rank={entry.rank}
              username={entry.username}
              points={entry.points}
              change={entry.change}
              isCurrentUser={entry.isCurrentUser}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 bg-surface border border-white/5 rounded-xl text-center">
          <p className="text-text-muted text-sm mb-2">No leaderboard data available</p>
          <p className="text-text-dim text-xs">Join a league to see rankings</p>
        </div>
      )}
    </div>
  );
}
