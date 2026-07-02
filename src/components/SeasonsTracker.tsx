
import React from 'react';
import { motion } from 'motion/react';

interface SeasonsTrackerProps {
  currentSeason: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  currentYear: number;
}

const SeasonsTracker: React.FC<SeasonsTrackerProps> = ({ currentSeason, currentYear }) => {
  const seasons = [
    { id: 'SPRING', label: 'Spring', color: 'text-green-500', bg: 'bg-green-500/20', icon: '🌱' },
    { id: 'SUMMER', label: 'Summer', color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: '☀️' },
    { id: 'AUTUMN', label: 'Autumn', color: 'text-orange-500', bg: 'bg-orange-500/20', icon: '🍂' },
    { id: 'WINTER', label: 'Winter', color: 'text-blue-500', bg: 'bg-blue-500/20', icon: '❄️' },
  ];

  const currentIndex = seasons.findIndex(s => s.id === currentSeason);
  const rotation = currentIndex * 90;

  // Compact horizontal badge anchored to the board area (not the header).
  // pointer-events-none so it never blocks clicks on hexes underneath.
  return (
    <div
      id="seasons-tracker"
      className="absolute top-1 left-1 md:top-2 md:left-2 z-30 pointer-events-none flex items-center gap-1.5 md:gap-2 px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-full panel-wood-translucent backdrop-blur-sm border border-[#a97e42]/50 shadow-lg"
    >
      {/* Mini season wheel */}
      <div className="relative w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-800/80 border border-slate-700 overflow-hidden shrink-0">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {seasons.map((s) => (
            <div key={s.id} className={`${s.bg} border border-slate-700/30`} />
          ))}
        </div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <div className="absolute top-0.5 w-0.5 h-3 md:h-4 bg-white rounded-full shadow z-10" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] md:text-xs text-white font-black bg-slate-900/70 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-slate-700/60">
            {currentYear}
          </span>
        </div>
      </div>

      {/* Season name - hidden on very small screens, icon always visible */}
      <div className="flex items-center gap-1 pr-0.5">
        <span className="text-sm md:text-base leading-none">{seasons[currentIndex].icon}</span>
        <motion.span
          key={currentSeason}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className={`hidden sm:inline font-bold text-[9px] md:text-[11px] uppercase tracking-widest ${seasons[currentIndex].color}`}
        >
          {seasons[currentIndex].label}
        </motion.span>
      </div>
    </div>
  );
};

export default SeasonsTracker;
