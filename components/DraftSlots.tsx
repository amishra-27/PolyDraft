interface DraftSlotsProps {
  totalSlots: number;
  currentPick: number;
}

export function DraftSlots({ totalSlots, currentPick }: DraftSlotsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto py-4 px-4 no-scrollbar snap-x mask-linear-fade">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const slotNum = i + 1;
        const isFilled = slotNum < currentPick;
        const isCurrent = slotNum === currentPick;

        return (
          <div
            key={i}
            className={`
              flex-shrink-0 w-16 h-20 rounded-xl border flex flex-col items-center justify-center gap-1 snap-center transition-all duration-300
              ${isFilled
                ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : isCurrent
                  ? 'bg-surface border-primary scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] z-10'
                  : 'bg-surface/30 border-white/5 text-text-dim'
              }
            `}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Pick</span>
            <span className={`font-bold text-2xl ${isCurrent ? 'text-white animate-pulse' : ''}`}>
              {slotNum}
            </span>
            {isCurrent && (
              <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-full blur-[2px]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

