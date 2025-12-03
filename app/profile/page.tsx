'use client';

import { Trophy, Award, TrendingUp, Calendar } from "lucide-react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { useDevSettings } from "@/lib/contexts/DevSettingsContext";
import { dummyUserStats } from "@/lib/data/dummyData";

export default function ProfilePage() {
  const { settings } = useDevSettings();

  const stats = settings.showDummyData ? dummyUserStats : null;

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

      {stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className="text-primary" />
                <span className="text-xs text-text-muted uppercase">Wins</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.wins}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-success" />
                <span className="text-xs text-text-muted uppercase">Rank</span>
              </div>
              <div className="text-2xl font-bold text-white">#{stats.rank}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-primary" />
                <span className="text-xs text-text-muted uppercase">Trophies</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.trophies}</div>
            </div>
            <div className="bg-surface border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-xs text-text-muted uppercase">Joined</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.joinDate}</div>
            </div>
          </div>

          {/* Recent Activity */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Leagues</h2>
            <div className="space-y-2">
              {stats.recentLeagues.map((league) => (
                <div key={league.id} className="bg-surface border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-sm">{league.name}</p>
                      <p className="text-xs text-text-muted">Ranked #{league.rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{league.points} pts</p>
                      <p className="text-xs text-success">+{league.change} spots</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard Preview */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Your Rankings</h2>
            <div>
              <LeaderboardRow rank={stats.rank} username="You" points={4500} change={12} isCurrentUser />
            </div>
          </section>
        </>
      ) : (
        <div className="p-12 bg-surface border border-white/5 rounded-xl text-center">
          <p className="text-text-muted text-sm mb-2">No profile data available</p>
          <p className="text-text-dim text-xs">Enable dummy data in dev settings to see your stats</p>
        </div>
      )}
    </div>
  );
}

