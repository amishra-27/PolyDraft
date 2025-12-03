import { LeagueCard } from "@/components/LeagueCard";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Search } from "lucide-react";

export default function Home() {
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
        
        <div className="space-y-3">
          <LeagueCard
            id="1"
            title="Crypto Whales 2024"
            entryFee="$50"
            prizePool="$500"
            members={8}
            maxMembers={10}
            status="drafting"
          />
          <LeagueCard
            id="2"
            title="Election Prediction"
            entryFee="$10"
            prizePool="$100"
            members={10}
            maxMembers={10}
            status="active"
          />
        </div>
      </section>

      {/* Open Leagues Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Open Leagues</h2>
          <button className="text-primary text-xs font-bold uppercase">Filter</button>
        </div>

        <div className="space-y-3">
          <LeagueCard
            id="3"
            title="Tech Stocks Q3"
            entryFee="$25"
            prizePool="$250"
            members={3}
            maxMembers={10}
            status="open"
          />
          <LeagueCard
            id="4"
            title="Sports Futures"
            entryFee="$5"
            prizePool="$50"
            members={1}
            maxMembers={10}
            status="open"
          />
        </div>
      </section>

    </div>
  );
}

