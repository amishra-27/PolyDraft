import { Trophy, Award, TrendingUp, Calendar } from "lucide-react";
import { LeaderboardRow } from "@/components/LeaderboardRow";

export default function ProfilePage() {
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-primary" />
            <span className="text-xs text-text-muted uppercase">Wins</span>
          </div>
          <div className="text-2xl font-bold text-white">12</div>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-success" />
            <span className="text-xs text-text-muted uppercase">Rank</span>
          </div>
          <div className="text-2xl font-bold text-white">#42</div>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-primary" />
            <span className="text-xs text-text-muted uppercase">Trophies</span>
          </div>
          <div className="text-2xl font-bold text-white">3</div>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-text-muted" />
            <span className="text-xs text-text-muted uppercase">Joined</span>
          </div>
          <div className="text-2xl font-bold text-white">Jan '24</div>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Leagues</h2>
        <div className="space-y-2">
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">Crypto Whales 2024</p>
                <p className="text-xs text-text-muted">Ranked #8</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">450 pts</p>
                <p className="text-xs text-success">+12 spots</p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">Election Prediction</p>
                <p className="text-xs text-text-muted">Ranked #3</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">950 pts</p>
                <p className="text-xs text-success">+2 spots</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Your Rankings</h2>
        <div>
          <LeaderboardRow rank={42} username="You" points={4500} change={12} isCurrentUser />
        </div>
      </section>
    </div>
  );
}

