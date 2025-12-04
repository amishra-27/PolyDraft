'use client';

import { Trophy, Award, TrendingUp, Calendar } from "lucide-react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useUser } from "@/lib/hooks/useUser";

export default function ProfilePage() {
  const { user, loading } = useUser('0x1234567890123456789012345678901234567890'); // TODO: Get from wallet connection

  return (
    <div className="pb-24">
      <header className="mb-8 pt-2">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
            <p className="text-text-muted text-sm">@username</p>
          </div>
        </div>
      </header>

      {user ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className="text-primary" />
                <span className="text-xs text-text-muted uppercase">Wins</span>
              </div>
              <div className="text-2xl font-bold text-white">{user.wins}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-success" />
                <span className="text-xs text-text-muted uppercase">Rank</span>
              </div>
              <div className="text-2xl font-bold text-white">#{user.total_leagues || 0}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-primary" />
                <span className="text-xs text-text-muted uppercase">Trophies</span>
              </div>
              <div className="text-2xl font-bold text-white">{user.total_points || 0}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-xs text-text-muted uppercase">Joined</span>
              </div>
              <div className="text-2xl font-bold text-white">{new Date(user.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
            </div>
          </div>



          {/* Leaderboard Preview */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Your Rankings</h2>
            <div>
              <LeaderboardRow rank={user.total_leagues || 0} username="You" points={user.total_points || 0} change={0} isCurrentUser />
            </div>
          </section>
        </>
      ) : loading ? (
        <SkeletonLoader type="profile" count={1} />
      ) : (
        <div className="p-12 bg-surface border border-white/5 rounded-xl text-center">
          <p className="text-text-muted text-sm mb-2">No profile data available</p>
          <p className="text-text-dim text-xs">Connect your wallet to see your stats</p>
        </div>
      )}
    </div>
  );
}

