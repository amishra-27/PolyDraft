import { X, Trophy, Medal, Award, Share2, Users, TrendingUp, Calendar, Star, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DraftCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftResults?: {
    leagueName: string;
    userPosition: number;
    totalPlayers: number;
    userPicks: Array<{
      marketTitle: string;
      outcome: 'YES' | 'NO';
      correct: boolean;
    }>;
    winners: Array<{
      position: number;
      userName: string;
      correctPicks: number;
      totalPicks: number;
    }>;
  };
}

// Mock data for demonstration
const mockDraftResults = {
  leagueName: "Crypto Predictions League",
  userPosition: 4,
  totalPlayers: 8,
  userPicks: [
    { marketTitle: "Bitcoin will reach $100k by end of year", outcome: 'YES' as const, correct: true },
    { marketTitle: "Ethereum will outperform Bitcoin in Q4", outcome: 'NO' as const, correct: false },
    { marketTitle: "Solana will hit new all-time high", outcome: 'YES' as const, correct: true },
    { marketTitle: "NFT trading volume will increase 50%", outcome: 'NO' as const, correct: true },
    { marketTitle: "DeFi TVL will exceed $100B", outcome: 'YES' as const, correct: false },
  ],
  winners: [
    { position: 1, userName: "CryptoKing", correctPicks: 8, totalPicks: 10 },
    { position: 2, userName: "OracleAlice", correctPicks: 7, totalPicks: 10 },
    { position: 3, userName: "BlockBob", correctPicks: 6, totalPicks: 10 },
  ]
};

export function DraftCompleteModal({
  isOpen,
  onClose,
  draftResults = mockDraftResults
}: DraftCompleteModalProps) {
  if (!isOpen) return null;

  const userSuccessRate = Math.round(
    (draftResults.userPicks.filter(pick => pick.correct).length / draftResults.userPicks.length) * 100
  );

  const correctPicks = draftResults.userPicks.filter(pick => pick.correct).length;

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-text-muted';
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return Trophy;
      case 2: return Medal;
      case 3: return Award;
      default: return Star;
    }
  };

  const handleShareResults = () => {
    // Mock share functionality
    const shareText = `I finished ${draftResults.userPosition} of ${draftResults.totalPlayers} in ${draftResults.leagueName} with ${userSuccessRate}% accuracy! 🎯`;
    console.log('Sharing:', shareText);
  };

  return (
    <>
      {/* Confetti Animation Styles */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
          z-index: 60;
        }
        
        .confetti:nth-child(1) { left: 10%; animation-delay: 0s; background: #ef4444; }
        .confetti:nth-child(2) { left: 20%; animation-delay: 0.2s; background: #f59e0b; }
        .confetti:nth-child(3) { left: 30%; animation-delay: 0.4s; background: #10b981; }
        .confetti:nth-child(4) { left: 40%; animation-delay: 0.6s; background: #3b82f6; }
        .confetti:nth-child(5) { left: 50%; animation-delay: 0.8s; background: #8b5cf6; }
        .confetti:nth-child(6) { left: 60%; animation-delay: 1s; background: #ec4899; }
        .confetti:nth-child(7) { left: 70%; animation-delay: 1.2s; background: #14b8a6; }
        .confetti:nth-child(8) { left: 80%; animation-delay: 1.4s; background: #f97316; }
        .confetti:nth-child(9) { left: 90%; animation-delay: 1.6s; background: #06b6d4; }
        .confetti:nth-child(10) { left: 95%; animation-delay: 1.8s; background: #84cc16; }
        
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        
         .trophy-animation {
           animation: trophy-bounce 2s ease-in-out infinite;
         }
         
         @keyframes slide-up {
           from {
             transform: translateY(20px);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         .slide-up {
           animation: slide-up 0.5s ease-out forwards;
         }
         
         @keyframes sparkle {
           0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
           50% { opacity: 1; transform: scale(1) rotate(180deg); }
         }
         
         .sparkle {
           animation: sparkle 2s ease-in-out infinite;
         }
         
         @keyframes float {
           0%, 100% { transform: translateY(0px); }
           50% { transform: translateY(-10px); }
         }
         
         .float {
           animation: float 3s ease-in-out infinite;
         }
      `}</style>

      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="confetti" />
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-white/5 bg-gradient-to-r from-primary/20 to-secondary/20">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X size={16} className="text-text-muted" />
            </button>
            
            <div className="text-center pr-8">
              <div className="relative inline-block mb-4">
                <div className="trophy-animation">
                  <Trophy size={48} className="text-yellow-400 mx-auto" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles size={20} className="text-yellow-300 sparkle" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Sparkles size={16} className="text-yellow-300 sparkle" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 float">Draft Complete! 🎉</h1>
              <p className="text-text-dim text-lg">Congratulations on finishing the draft</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
             {/* League Summary */}
             <div className="slide-up" style={{ animationDelay: '0.1s' }}>
               <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-4 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-bold text-white text-lg">{draftResults.leagueName}</h3>
                     <div className="flex items-center gap-4 text-text-dim text-sm mt-1">
                       <span className="flex items-center gap-1">
                         <Users size={14} />
                         {draftResults.totalPlayers} Players
                       </span>
                       <span className="flex items-center gap-1">
                         <Calendar size={14} />
                         {new Date().toLocaleDateString()}
                       </span>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-3xl font-bold text-primary">
                       #{draftResults.userPosition}
                     </div>
                     <div className="text-text-dim text-sm">
                       of {draftResults.totalPlayers}
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Your Performance */}
             <div className="slide-up" style={{ animationDelay: '0.2s' }}>
               <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                 <TrendingUp size={18} className="text-primary" />
                 Your Performance
               </h3>
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-surface border border-white/10 rounded-lg p-3 text-center hover:scale-105 transition-transform duration-200">
                   <div className="text-2xl font-bold text-success">{correctPicks}</div>
                   <div className="text-xs text-text-dim">Correct Picks</div>
                 </div>
                 <div className="bg-surface border border-white/10 rounded-lg p-3 text-center hover:scale-105 transition-transform duration-200">
                   <div className="text-2xl font-bold text-primary">{userSuccessRate}%</div>
                   <div className="text-xs text-text-dim">Success Rate</div>
                 </div>
                 <div className="bg-surface border border-white/10 rounded-lg p-3 text-center hover:scale-105 transition-transform duration-200">
                   <div className="text-2xl font-bold text-white">{draftResults.userPicks.length}</div>
                   <div className="text-xs text-text-dim">Total Picks</div>
                 </div>
               </div>
             </div>

            {/* Winners Podium */}
            <div className="slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-400" />
                Top Performers
              </h3>
              <div className="space-y-2">
                {draftResults.winners.map((winner) => {
                  const Icon = getMedalIcon(winner.position);
                  const accuracy = Math.round((winner.correctPicks / winner.totalPicks) * 100);
                  
                  return (
                     <div
                       key={winner.position}
                       className="bg-surface border border-white/10 rounded-lg p-3 flex items-center gap-3 hover:scale-102 hover:shadow-md transition-all duration-200"
                     >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getMedalColor(winner.position)}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{winner.userName}</div>
                        <div className="text-sm text-text-dim">
                          {winner.correctPicks}/{winner.totalPicks} correct ({accuracy}%)
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        #{winner.position}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Picks Preview */}
            <div className="slide-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="font-bold text-white mb-3">Your Recent Picks</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                 {draftResults.userPicks.slice(0, 3).map((pick, index) => (
                   <div key={index} className="bg-surface border border-white/10 rounded-lg p-3 flex items-center gap-3 hover:scale-102 transition-transform duration-200">
                     <div className={`w-2 h-2 rounded-full ${pick.correct ? 'bg-success animate-pulse' : 'bg-error'}`} />
                     <div className="flex-1">
                       <div className="text-sm text-white line-clamp-1">{pick.marketTitle}</div>
                       <div className="text-xs text-text-dim">
                         You picked {pick.outcome} {pick.correct ? <CheckCircle size={12} className="inline text-success" /> : <X size={12} className="inline text-error" />}
                       </div>
                     </div>
                   </div>
                 ))}
                {draftResults.userPicks.length > 3 && (
                  <div className="text-center text-text-dim text-xs">
                    +{draftResults.userPicks.length - 3} more picks
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
            <Button
              variant="secondary"
              onClick={handleShareResults}
              className="flex-1"
            >
              <Share2 size={16} className="mr-2" />
              Share Results
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/leaderboard', '_blank')}
              className="flex-1"
            >
              View Full Results
            </Button>
            <Button
              onClick={() => window.open('/leagues', '_blank')}
              className="flex-1"
            >
              Create New League
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}