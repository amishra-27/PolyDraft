import { Trophy, ArrowUp, ArrowDown } from 'lucide-react';

interface LeaderboardRowProps {
  rank: number;
  username: string;
  points: number;
  change?: number;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ rank, username, points, change = 0, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div 
      className={`
        flex items-center justify-between p-4 rounded-xl border mb-2 transition-all
        ${isCurrentUser 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-surface border-white/5 hover:border-white/20 hover:bg-surface-hover'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
          ${rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-600 text-black' : 'bg-white/5 text-text-muted'}
        `}>
          {rank <= 3 ? <Trophy size={14} /> : rank}
        </div>
        
        <div>
          <p className={`font-bold text-sm ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
            {username}
          </p>
          <div className="flex items-center gap-1">
            {change > 0 && <ArrowUp size={10} className="text-success" />}
            {change < 0 && <ArrowDown size={10} className="text-red-400" />}
            {change !== 0 && (
              <span className={`text-[10px] ${change > 0 ? 'text-success' : 'text-red-400'}`}>
                {Math.abs(change)} spots
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold text-white">{points.toLocaleString()}</p>
        <p className="text-[10px] text-text-muted uppercase">Points</p>
      </div>
    </div>
  );
}

