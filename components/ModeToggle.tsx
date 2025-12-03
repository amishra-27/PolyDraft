'use client';

import { useState } from 'react';
import { Zap, Users } from 'lucide-react';

export function ModeToggle() {
    const [mode, setMode] = useState<'social' | 'live'>('social');

    return (
        <div className="flex bg-surface/50 backdrop-blur-md p-1 rounded-xl border border-white/10 relative">
            <div
                className={`absolute inset-y-1 w-1/2 bg-primary/20 rounded-lg transition-all duration-300 ease-out ${mode === 'live' ? 'translate-x-full left-[-4px]' : 'left-1'
                    }`}
            />

            <button
                onClick={() => setMode('social')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative z-10 ${mode === 'social' ? 'text-white' : 'text-text-muted hover:text-white'
                    }`}
            >
                <Users size={14} />
                Social
            </button>

            <button
                onClick={() => setMode('live')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative z-10 ${mode === 'live' ? 'text-primary shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-text-muted hover:text-white'
                    }`}
            >
                <Zap size={14} />
                Live
            </button>
        </div>
    );
}
