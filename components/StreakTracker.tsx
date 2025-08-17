import React from 'react';
import { FireIcon } from './icons/FireIcon';

interface StreakTrackerProps {
  count: number;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ count }) => {
    if (count === 0) return null;
    
    const glowIntensity = Math.min(count / 10, 0.7); // Cap intensity at 70%

    return (
        <div 
            className="flex items-center gap-2 bg-slate-800/50 border border-amber-400/30 rounded-full px-4 py-2 text-amber-300 shadow-lg"
            style={{boxShadow: `0 0 15px rgba(251, 191, 36, ${glowIntensity})`}}
        >
            <div className="w-5 h-5">
                <FireIcon />
            </div>
            <span className="font-bold text-lg">{count}</span>
            <span className="text-sm text-slate-400 font-medium">Day Streak</span>
        </div>
    );
};
