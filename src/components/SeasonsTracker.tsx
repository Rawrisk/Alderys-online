
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

  return (
    <div id="seasons-tracker" className="absolute top-20 right-20 z-50 flex flex-col items-center gap-2 scale-75 md:scale-100 origin-top-right">
      <div className="relative w-24 h-24 rounded-full bg-slate-800/80 border-2 border-slate-700 shadow-xl overflow-hidden">
        {/* Background segments */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {seasons.map((s, i) => (
            <div key={s.id} className={`${s.bg} border border-slate-700/30`} />
          ))}
        </div>

        {/* Indicator */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <div className="absolute top-1 w-1 h-8 bg-white rounded-full shadow-lg z-10" />
        </motion.div>

        {/* Center year display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[1px] rounded-full m-4 border border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Year</span>
          <span className="text-xl text-white font-black leading-none">{currentYear}</span>
        </div>
      </div>

      {/* Current Season Label */}
      <motion.div
        key={currentSeason}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 shadow-lg flex items-center gap-2`}
      >
        <span className="text-lg">{seasons[currentIndex].icon}</span>
        <span className={`font-bold text-sm uppercase tracking-widest ${seasons[currentIndex].color}`}>
          {seasons[currentIndex].label}
        </span>
      </motion.div>
    </div>
  );
};

export default SeasonsTracker;
