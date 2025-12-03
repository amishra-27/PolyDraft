import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface MarketCardProps {
  title: string;
  category: string;
  endDate: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function MarketCard({ title, category, endDate, isSelected, onSelect }: MarketCardProps) {
  const [vote, setVote] = useState<'YES' | 'NO' | null>(null);

  return (
    <div 
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all
        ${isSelected 
          ? 'bg-surface border-primary shadow-[0_0_15px_rgba(255,107,157,0.2)]' 
          : 'bg-surface border-white/5 hover:border-white/20 hover:bg-surface-hover'
        }
      `}
    >
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
            {category}
          </span>
          <h3 className="font-medium text-white text-sm mt-2 leading-snug">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="text-[10px] text-text-muted">
          Ends: {endDate}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setVote('YES'); }}
            className={`h-8 w-12 rounded flex items-center justify-center font-bold text-xs transition-colors ${vote === 'YES' ? 'bg-success text-black' : 'bg-white/5 hover:bg-white/10 text-success'}`}
          >
            YES
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setVote('NO'); }}
            className={`h-8 w-12 rounded flex items-center justify-center font-bold text-xs transition-colors ${vote === 'NO' ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-red-400'}`}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}

