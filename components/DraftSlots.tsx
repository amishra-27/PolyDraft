interface DraftSlotsProps {
  totalSlots: number;
  currentPick: number;
}

export function DraftSlots({ totalSlots, currentPick }: DraftSlotsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar snap-x">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const slotNum = i + 1;
        const isFilled = slotNum < currentPick;
        const isCurrent = slotNum === currentPick;

        return (
          <div
            key={i}
            className={`
              flex-shrink-0 w-16 h-20 rounded-lg border flex flex-col items-center justify-center gap-1 snap-start
              ${isFilled 
                ? 'bg-primary/20 border-primary text-primary' 
                : isCurrent 
                  ? 'bg-surface border-primary animate-pulse shadow-[0_0_10px_rgba(255,107,157,0.3)]' 
                  : 'bg-surface border-white/5 text-text-muted opacity-50'
              }
            `}
          >
            <span className="text-[10px] uppercase tracking-wider">Pick</span>
            <span className={`font-bold text-xl ${isCurrent ? 'text-white' : ''}`}>
              {slotNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

