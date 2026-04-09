
import React from 'react';
import { motion } from 'motion/react';
import { User, Users, Play, BookOpen, Settings, Database, Dice5 } from 'lucide-react';

interface MainMenuProps {
  onSelectMode: (mode: 'SINGLE' | 'MULTI') => void;
  onShowAssets: () => void;
  onLoadGame: () => void;
  onShowRules: () => void;
  onShowDiceTests: () => void;
  intro: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onSelectMode, 
  onShowAssets, 
  onLoadGame, 
  onShowRules, 
  onShowDiceTests,
  intro 
}) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center z-10"
      >
        <h1 className="text-4xl sm:text-6xl md:text-9xl fantasy-font text-yellow-500 mb-2 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] tracking-tighter">
          ALDERYS
        </h1>
        <p className="text-slate-400 italic font-light max-w-lg mx-auto mb-12 text-sm md:text-lg">
          {intro}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode('SINGLE')}
            className="group relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-yellow-500/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User size={80} />
            </div>
            <h2 className="text-3xl fantasy-font text-yellow-500 mb-2 flex items-center gap-3">
              <User className="text-yellow-600" />
              Single Player
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Embark on a solo journey across the realm. Master the hexes, defeat monsters, and claim the throne.
            </p>
            <div className="mt-6 flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-widest">
              <span>Start Saga</span>
              <Play size={12} fill="currentColor" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode('MULTI')}
            className="group relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl hover:border-blue-500/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={80} />
            </div>
            <h2 className="text-3xl fantasy-font text-blue-500 mb-2 flex items-center gap-3">
              <Users className="text-blue-600" />
              Multiplayer
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create a room and invite your friends. Compete or collaborate in real-time for the fate of Alderys.
            </p>
            <div className="mt-6 flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
              <span>Enter Lobby</span>
              <Play size={12} fill="currentColor" />
            </div>
          </motion.button>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={onLoadGame}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 transition-all text-sm font-bold"
          >
            <Database size={16} className="text-yellow-600" />
            Load Chronicles
          </button>
          <button 
            onClick={onShowRules}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 transition-all text-sm font-bold"
          >
            <BookOpen size={16} className="text-blue-600" />
            Rulebook
          </button>
          <button 
            onClick={onShowAssets}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 transition-all text-sm font-bold"
          >
            <Settings size={16} className="text-purple-600" />
            Assets
          </button>
          <button 
            onClick={onShowDiceTests}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-xl text-slate-300 transition-all text-sm font-bold"
          >
            <Dice5 size={16} className="text-red-600" />
            Dice Tests
          </button>
        </div>

        <footer className="mt-16 text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          Alderys &copy; 2026 | The Chronicles of the Hexagonal Realm
        </footer>
      </motion.div>
    </div>
  );
};

export default MainMenu;
