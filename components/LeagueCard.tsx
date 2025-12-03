import { Users, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

interface LeagueCardProps {
  id: string;
  title: string;
  entryFee: string;
  prizePool: string;
  members: number;
  maxMembers: number;
  status: 'open' | 'drafting' | 'active' | 'ended';
}

export function LeagueCard({ id, title, entryFee, prizePool, members, maxMembers, status }: LeagueCardProps) {
  const statusConfig = {
    open: { color: "text-success", bg: "bg-success/10", border: "border-success/20", label: "Open" },
    drafting: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "Drafting" },
    active: { color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20", label: "Live" },
    ended: { color: "text-text-muted", bg: "bg-white/5", border: "border-white/10", label: "Ended" },
  };

  const config = statusConfig[status];

  return (
    <Link href={`/leagues/${id}`} className="block group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-surface backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 group-hover:border-primary/30 group-hover:translate-y-[-2px]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${config.bg} ${config.color} ${config.border} border`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'drafting' || status === 'active' ? 'animate-pulse bg-current' : 'bg-current'}`} />
              {config.label}
            </div>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{title}</h3>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
            <span className="text-primary-light font-bold text-sm">{entryFee}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-text-muted text-xs font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-text-dim" />
              <span>{members}/{maxMembers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-warning" />
              <span className="text-text-dim">Pool:</span>
              <span className="text-white">{prizePool}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-text-dim">
            <Clock size={14} />
            <span>2d left</span>
          </div>
        </div>

        {/* Progress bar for members */}
        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${(members / maxMembers) * 100}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

