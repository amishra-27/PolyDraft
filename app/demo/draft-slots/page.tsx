'use client';

import { DraftSlots } from '@/components/DraftSlots';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export default function DraftSlotsDemo() {
  const [currentPick, setCurrentPick] = useState(5);
  const [animating, setAnimating] = useState(true);

  const mockPicks = [
    {
      pickNumber: 1,
      userId: 'user1',
      userName: 'Alex Chen',
      outcome: 'YES' as const,
      marketTitle: 'Will BTC reach $100k by EOY?'
    },
    {
      pickNumber: 2,
      userId: 'user2', 
      userName: 'Sarah Miller',
      outcome: 'NO' as const,
      marketTitle: 'Will ETH 2.0 launch in Q4?'
    },
    {
      pickNumber: 3,
      userId: 'user3',
      userName: 'Mike Johnson',
      outcome: 'YES' as const,
      marketTitle: 'Will Solana flip ETH?'
    },
    {
      pickNumber: 4,
      userId: 'current-user',
      userName: 'You',
      outcome: 'NO' as const,
      marketTitle: 'Will NFT volume increase?'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">DraftSlots Component Demo</h1>
        <p className="text-text-muted mb-8">Enhanced draft slots with visual feedback and pick outcomes</p>

        {/* Controls */}
        <div className="bg-surface rounded-xl p-6 mb-8 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Controls</h2>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-text-muted text-sm">Current Pick:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentPick}
                onChange={(e) => setCurrentPick(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-white font-bold">{currentPick}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAnimating(!animating)}
            >
              {animating ? 'Stop' : 'Start'} Animation
            </Button>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-surface rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Enhanced DraftSlots</h2>
          <div className="mb-4">
            <DraftSlots 
              totalSlots={10} 
              currentPick={currentPick}
              picks={mockPicks}
              currentUserId="current-user"
              animating={animating}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">Features Demonstrated:</h3>
              <ul className="text-text-muted space-y-1">
                <li>• YES picks shown in green</li>
                <li>• NO picks shown in red</li>
                <li>• User initials in completed picks</li>
                <li>• Current user picks highlighted</li>
                <li>• Animated current pick indicator</li>
                <li>• Hover tooltips with market info</li>
                <li>• Smooth transitions</li>
              </ul>
            </div>
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">Interactive Elements:</h3>
              <ul className="text-text-muted space-y-1">
                <li>• Hover over completed picks for details</li>
                <li>• Current pick has pulsing animation</li>
                <li>• Scale effect on hover</li>
                <li>• User icon for current user picks</li>
                <li>• Check/X icons for outcomes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-surface rounded-xl p-6 border border-white/10 mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Usage Example</h2>
          <pre className="bg-surface/50 rounded-lg p-4 text-xs overflow-x-auto">
{`<DraftSlots 
  totalSlots={10} 
  currentPick={8}
  picks={[
    {
      pickNumber: 1,
      userId: 'user1',
      userName: 'Alex Chen',
      outcome: 'YES',
      marketTitle: 'Will BTC reach $100k?'
    },
    // ... more picks
  ]}
  currentUserId="current-user"
  animating={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}