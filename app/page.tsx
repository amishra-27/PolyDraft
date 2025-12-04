'use client';

import { useState } from 'react';
import { LeagueCard } from "@/components/LeagueCard";
import { CreateLeagueModal } from "@/components/CreateLeagueModal";
import { JoinLeagueButton } from "@/components/JoinLeagueButton";

import { Search, Trophy, Plus } from "lucide-react";
import { useDevSettings } from "@/lib/contexts/DevSettingsContext";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useLeagues } from "@/lib/hooks/useLeagues";

export default function Home() {
  const { settings } = useDevSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { leagues, loading, error } = useLeagues();

  // Filter leagues by status and transform for LeagueCard
  const activeLeagues = leagues?.filter(league => league.status === 'active').map(league => ({
    id: league.id,
    title: league.name,
    entryFee: "Free", // TODO: Add entry fee to schema
    prizePool: "$0", // TODO: Calculate from entry fees
    members: 0, // TODO: Get from league_members count
    maxMembers: league.max_players || 6,
    status: league.status as 'open' | 'drafting' | 'active' | 'ended'
  })) || [];
  
  const openLeagues = leagues?.filter(league => league.status === 'open').map(league => ({
    id: league.id,
    title: league.name,
    entryFee: "Free", // TODO: Add entry fee to schema
    prizePool: "$0", // TODO: Calculate from entry fees
    members: 0, // TODO: Get from league_members count
    maxMembers: league.max_players || 6,
    status: league.status as 'open' | 'drafting' | 'active' | 'ended'
  })) || [];
  
  const isLoadingLeagues = loading;

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
        
        {/* League Actions */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create League
          </button>
          <JoinLeagueButton 
            className="flex-1"
            onLeagueJoined={(leagueId) => {
              console.log('Joined league:', leagueId);
            }}
          />
        </div>
        

      </header>

      {/* Active Leagues Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Your Leagues</h2>
          <button className="text-primary text-xs font-bold uppercase">View All</button>
        </div>

        {loading ? (
          <SkeletonLoader type="league" count={2} />
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
              Create or join a league to get started
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
          <SkeletonLoader type="league" count={3} />
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
              Browse available leagues or create your own
            </p>
          </div>
        )}
      </section>
      
      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

