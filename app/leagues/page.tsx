'use client';

import { LeagueCard } from "@/components/LeagueCard";
import { Search, Filter } from "lucide-react";
import { useDevSettings } from "@/lib/contexts/DevSettingsContext";
import { dummyLeagues } from "@/lib/data/dummyData";

export default function LeaguesPage() {
  const { settings } = useDevSettings();

  const activeLeagues = settings.showDummyData ? dummyLeagues.active : [];
  const openLeagues = settings.showDummyData ? dummyLeagues.open : [];

  return (
    <div className="pb-24">
      <header className="mb-6 pt-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Leagues</h1>
            <p className="text-text-muted text-sm">Join or create a league</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface p-2 rounded-full border border-white/10">
              <Filter size={18} className="text-text-muted" />
            </div>
            <div className="bg-surface p-2 rounded-full border border-white/10">
              <Search size={18} className="text-text-muted" />
            </div>
          </div>
        </div>
      </header>

      {/* Your Leagues Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Your Leagues</h2>
          <button className="text-primary text-xs font-bold uppercase">View All</button>
        </div>

        {activeLeagues.length > 0 ? (
          <div className="space-y-3">
            {activeLeagues.map((league) => (
              <LeagueCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface border border-white/5 rounded-xl text-center">
            <p className="text-text-muted text-sm">No active leagues</p>
            <p className="text-text-dim text-xs mt-1">
              {!settings.showDummyData && "Enable dummy data in dev settings"}
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

        {openLeagues.length > 0 ? (
          <div className="space-y-3">
            {openLeagues.map((league) => (
              <LeagueCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface border border-white/5 rounded-xl text-center">
            <p className="text-text-muted text-sm">No open leagues available</p>
            <p className="text-text-dim text-xs mt-1">
              {!settings.showDummyData && "Enable dummy data in dev settings"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

