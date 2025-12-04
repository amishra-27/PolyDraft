import { Button } from "@/components/ui/Button";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { Clock, Users, Trophy, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 pt-2">
        <Link href="/leagues" className="inline-flex items-center text-text-muted text-sm mb-4 hover:text-white">
          <ChevronLeft size={16} className="mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Crypto Whales 2024</h1>
        <div className="flex items-center gap-4 text-text-muted text-xs">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">DRAFTING NOW</span>
          <span>ID: #{id}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
          <Users size={16} className="mx-auto mb-1 text-text-muted" />
          <div className="font-bold text-white">8/10</div>
          <div className="text-[10px] text-text-muted uppercase">Members</div>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
          <Trophy size={16} className="mx-auto mb-1 text-primary" />
          <div className="font-bold text-white">$500</div>
          <div className="text-[10px] text-text-muted uppercase">Pool</div>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-3 text-center">
          <Clock size={16} className="mx-auto mb-1 text-text-muted" />
          <div className="font-bold text-white">2d</div>
          <div className="text-[10px] text-text-muted uppercase">Left</div>
        </div>
      </div>

      {/* Draft CTA */}
      <div className="bg-gradient-to-r from-primary/20 to-surface border border-primary/30 rounded-xl p-5 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-1">Draft is Live!</h2>
          <p className="text-sm text-text-muted mb-4">It's your turn to pick.</p>
          <Link href="/draft">
            <Button variant="primary" className="w-full">
              Enter Draft Room
            </Button>
          </Link>
        </div>
        {/* Background decoration */}
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
      </div>

      {/* Snapshot Leaderboard */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Top Players</h2>
          <Link href="/leaderboard" className="text-primary text-xs font-bold uppercase flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        <div>
          <LeaderboardRow rank={1} username="CryptoKing" points={1250} change={2} />
          <LeaderboardRow rank={2} username="SatoshiN" points={1100} change={-1} />
          <LeaderboardRow rank={3} username="MoonBoi" points={950} change={0} />
          <LeaderboardRow rank={8} username="You" points={450} change={4} isCurrentUser />
        </div>
      </section>
    </div>
  );
}

