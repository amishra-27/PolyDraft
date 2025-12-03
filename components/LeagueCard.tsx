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
  const statusColors = {
    open: "text-success",
    drafting: "text-primary",
    active: "text-blue-400",
    ended: "text-text-muted",
  };

  return (
    <Link href={`/leagues/${id}`} className="block group">
      <div className="bg-surface border border-white/5 rounded-xl p-4 transition-all hover:border-primary/50 hover:bg-surface-hover hover:shadow-[0_0_20px_rgba(255,107,157,0.25)]">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{title}</h3>
            <p className={`text-xs font-medium uppercase tracking-wider ${statusColors[status]}`}>
              {status}
            </p>
          </div>
          <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <span className="text-primary font-bold text-sm">{entryFee}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-text-muted text-xs font-medium">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{members}/{maxMembers}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy size={14} />
            <span>{prizePool}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Clock size={14} />
            <span>2d left</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

