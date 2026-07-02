import React from 'react';
import { Sparkles, Swords, Shield, Target, HelpCircle, ArrowUpRight } from 'lucide-react';
import { Skill } from '../types';

interface MiniSkillMarketProps {
  isBuyingSkill: boolean;
  currentPlayer: any;
  onClick: () => void;
}

const MiniSkillMarket: React.FC<MiniSkillMarketProps> = ({
  isBuyingSkill,
  currentPlayer,
  onClick,
}) => {
  // Simple check for affordable/available status to show a helper indicator
  const gold = currentPlayer?.gold ?? 0;
  const xp = currentPlayer?.xp ?? 0;

  return (
    <div
      id="mini-skill-market-board"
      onClick={onClick}
      className={`absolute left-3 bottom-3 md:left-6 md:bottom-6 z-30 flex flex-col p-4 w-52 md:w-60 bg-slate-900/95 border-2 rounded-2xl cursor-pointer hover:scale-102 transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.7)] group select-none ${
        isBuyingSkill
          ? 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.4)] bg-amber-950/40 animate-pulse'
          : 'border-amber-800/60 hover:border-amber-500 shadow-black'
      }`}
    >
      {/* Wooden Board Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-amber-800/30">
        <div className="flex items-center gap-1.5">
          <span className="text-base text-amber-500">🔮</span>
          <h4 className="fantasy-font text-xs font-black tracking-wider text-amber-500 uppercase">
            Skill Market
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-400 group-hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-0.5">
            BOARD <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>

      {/* Internal Mini Board Grid */}
      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-white/5 space-y-2">
        <div className="text-[10px] text-slate-400 leading-snug">
          Unlock magic, advanced tactics and legendary traits to empower your units.
        </div>

        {/* Skill Category Representation */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          <div 
            id="mini-skill-cat-magic"
            className="h-7 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/20 rounded flex items-center justify-center text-blue-400 transition-colors" 
            title="MAGIC"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div 
            id="mini-skill-cat-sword"
            className="h-7 bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 rounded flex items-center justify-center text-red-400 transition-colors" 
            title="SWORD/COMBAT"
          >
            <Swords className="w-3.5 h-3.5" />
          </div>
          <div 
            id="mini-skill-cat-lucky"
            className="h-7 bg-yellow-950/30 hover:bg-yellow-900/40 border border-yellow-500/20 rounded flex items-center justify-center text-yellow-400 transition-colors" 
            title="LUCKY/FORTUNE"
          >
            <span className="text-xs font-mono font-bold leading-none">🎲</span>
          </div>
          <div 
            id="mini-skill-cat-defense"
            className="h-7 bg-slate-800/40 hover:bg-slate-700/40 border border-slate-500/20 rounded flex items-center justify-center text-slate-300 transition-colors" 
            title="DEFENSE/ARMOR"
          >
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div 
            id="mini-skill-cat-ranged"
            className="h-7 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400 transition-colors" 
            title="RANGED"
          >
            <Target className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Dynamic Action Prompt */}
      <div className="mt-3 flex justify-between items-center text-[10px]">
        {isBuyingSkill ? (
          <span className="text-yellow-400 font-extrabold flex items-center gap-1 animate-bounce">
            🔥 CLICK TO BUY NOW
          </span>
        ) : (
          <span className="text-slate-500 font-medium group-hover:text-amber-400 transition-all">
            🔍 Click to expand
          </span>
        )}
        <div className="flex gap-2 text-slate-400 font-mono text-[9px] font-bold">
          <span className="text-yellow-500">{gold}G</span>
          {xp > 0 && <span className="text-blue-400">{xp}XP</span>}
        </div>
      </div>
    </div>
  );
};

export default MiniSkillMarket;
