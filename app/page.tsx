'use client';

import { LeagueCard } from "@/components/LeagueCard";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Skeleton, LeagueCardSkeleton } from "@/components/ui/Skeleton";
import { Search, AlertCircle, Trophy } from "lucide-react";
import { useDevSettings } from "@/lib/contexts/DevSettingsContext";
import { dummyLeagues } from "@/lib/data/dummyData";

export default function Home() {
  const { settings } = useDevSettings();

  // Use dummy data or empty arrays based on settings
  // TODO: Replace with real league data when we implement league smart contracts
  const activeLeagues = settings.showDummyData ? dummyLeagues.active : [];
  const openLeagues = settings.showDummyData ? dummyLeagues.open : [];
  const loading = false; // TODO: Add real loading state

  return (
    <div className="pb-20">
      <header className="mb-6 pt-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">PolyDraft</h1>
            <p className="text-text-muted text-sm">Fantasy Markets</p>
          </div>
          <div className="bg-surface p-2 rounded-full border border-white/10">
            <Search size={20} className="text-text-muted" />
          </div>
        </div>
        <ConnectWallet className="w-full" />
      </header>

      {/* Active Leagues Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Your Leagues</h2>
          <button className="text-primary text-xs font-bold uppercase">View All</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <LeagueCardSkeleton />
            <LeagueCardSkeleton />
          </div>
        ) : activeLeagues.length > 0 ? (
          <div className="space-y-3">
            {activeLeagues.map((league) => (
              <LeagueCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface border border-white/5 rounded-xl text-center">
            <Trophy size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-sm">No active leagues</p>
            <p className="text-text-dim text-xs mt-1">
              {!settings.showDummyData ? "Create or join a league to get started" : "Enable dummy data in dev settings to see examples"}
            </p>
          </div>
        )}
      </section>

      {/* Open Leagues Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Open Leagues</h2>
          <button className="text-primary text-xs font-bold uppercase">Filter</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <LeagueCardSkeleton />
            <LeagueCardSkeleton />
            <LeagueCardSkeleton />
          </div>
        ) : openLeagues.length > 0 ? (
          <div className="space-y-3">
            {openLeagues.map((league) => (
              <LeagueCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface border border-white/5 rounded-xl text-center">
            <Trophy size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-sm">No open leagues</p>
            <p className="text-text-dim text-xs mt-1">
              {!settings.showDummyData ? "Browse available leagues or create your own" : "Enable dummy data in dev settings to see examples"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

