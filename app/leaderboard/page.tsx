'use client';

import { LeaderboardRow } from "@/components/LeaderboardRow";
import { useDevSettings } from "@/lib/contexts/DevSettingsContext";
import { dummyLeaderboard } from "@/lib/data/dummyData";

export default function LeaderboardPage() {
  const { settings } = useDevSettings();

  const leaderboard = settings.showDummyData ? dummyLeaderboard : [];

  return (
    <div className="pb-24">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-text-muted text-sm">Top performers</p>
      </header>

      {leaderboard.length > 0 ? (
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
          <p className="text-text-dim text-xs">Enable dummy data in dev settings to see rankings</p>
        </div>
      )}
    </div>
  );
}
