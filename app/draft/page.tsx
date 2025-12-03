'use client';

import { useState } from 'react';
import { MarketCard } from '@/components/MarketCard';
import { DraftSlots } from '@/components/DraftSlots';
import { Button } from '@/components/ui/Button';
import { Clock, Filter, Search } from 'lucide-react';

export default function DraftPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  return (
    <div className="pb-24 h-screen flex flex-col">
      {/* Fixed Header Area */}
      <div className="flex-none pt-2">
        <header className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Draft Room</h1>
            <p className="text-primary font-medium text-xs animate-pulse">Your Turn • 00:45</p>
          </div>
          <div className="bg-surface px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            <span className="font-mono font-bold text-white">R3:P8</span>
          </div>
        </header>

        {/* Draft Slots Strip */}
        <div className="mb-6 -mx-4 px-4">
           <DraftSlots totalSlots={10} currentPick={8} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <Button variant="secondary" size="sm" className="rounded-full bg-white text-black border-transparent hover:bg-white/90 whitespace-nowrap">
            All Markets
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full whitespace-nowrap">
            Crypto
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full whitespace-nowrap">
            Politics
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full whitespace-nowrap">
            Sports
          </Button>
        </div>
      </div>

      {/* Scrollable Market List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-3 pb-20">
        <MarketCard
          title="Will Bitcoin hit $100k by Dec 31, 2024?"
          category="Crypto"
          endDate="Dec 31, 2024"
          isSelected={selectedMarket === '1'}
          onSelect={() => setSelectedMarket('1')}
        />
        <MarketCard
          title="US Election 2024: Winner?"
          category="Politics"
          endDate="Nov 5, 2024"
          isSelected={selectedMarket === '2'}
          onSelect={() => setSelectedMarket('2')}
        />
        <MarketCard
          title="Super Bowl 2025 Winner"
          category="Sports"
          endDate="Feb 2025"
          isSelected={selectedMarket === '3'}
          onSelect={() => setSelectedMarket('3')}
        />
        <MarketCard
          title="Ethereum ETF Approval Date"
          category="Crypto"
          endDate="May 2024"
          isSelected={selectedMarket === '4'}
          onSelect={() => setSelectedMarket('4')}
        />
        <MarketCard
          title="SpaceX Starship Successful Orbit"
          category="Tech"
          endDate="Jun 2024"
          isSelected={selectedMarket === '5'}
          onSelect={() => setSelectedMarket('5')}
        />
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent z-40">
        <div className="max-w-md mx-auto">
          <Button 
            variant="primary" 
            className="w-full shadow-xl" 
            disabled={!selectedMarket}
          >
            Confirm Pick
          </Button>
        </div>
      </div>
    </div>
  );
}

