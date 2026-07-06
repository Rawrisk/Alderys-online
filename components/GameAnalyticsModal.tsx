
import React from 'react';
import { Player, PlayerAnalytics } from '../types';
import { FACTION_THEMES } from '../constants';
import {
  X, BarChart2, Coins, Sparkles, Swords, Users, ScrollText, Landmark, Castle, Compass, Trophy
} from 'lucide-react';

interface GameAnalyticsModalProps {
  players: Player[];
  finalScores: Record<number, number>;
  onClose: () => void;
}

const EMPTY_ANALYTICS: PlayerAnalytics = {
  goldGenerated: 0,
  goldSpent: 0,
  xpGenerated: 0,
  xpSpent: 0,
  combatsWon: 0,
  combatsLost: 0,
  unitsRecruited: 0,
  unitsLost: 0,
  skillsBought: 0,
  questsCompleted: 0,
  monumentsBuilt: 0,
  castlesBuilt: 0,
  productionCount: 0,
};

const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-black/10 last:border-b-0">
    <div className="flex items-center gap-2 text-xs text-[#6b4f2c] font-bold uppercase tracking-wide">
      {icon}
      {label}
    </div>
    <span className="text-sm font-bold text-[#3a2a16] tabular-nums">{value}</span>
  </div>
);

const GameAnalyticsModal: React.FC<GameAnalyticsModalProps> = ({ players, finalScores, onClose }) => {
  const rankedPlayers = [...players].sort((a, b) => (finalScores[b.id] ?? b.score) - (finalScores[a.id] ?? a.score));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 md:p-6">
      <div className="frame-board bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.15)]">
        <div className="trim-gold-b flex items-center justify-between px-5 py-4 bg-slate-950/60">
          <h2 className="fantasy-font text-2xl md:text-3xl text-yellow-500 flex items-center gap-3">
            <BarChart2 size={26} />
            Match Analytics
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rankedPlayers.map((p, index) => {
              const a = p.analytics || EMPTY_ANALYTICS;
              const theme = p.faction ? FACTION_THEMES[p.faction] : null;
              const vp = finalScores[p.id] ?? p.score;

              return (
                <div
                  key={p.id}
                  className="panel-parchment rounded-xl p-4 relative overflow-hidden"
                  style={{ borderColor: theme?.color || '#8a6d3b' }}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2" style={{ borderColor: theme?.color ? `${theme.color}66` : 'rgba(0,0,0,0.15)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {index === 0 ? <Trophy size={14} /> : index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-[#3a2a16] truncate leading-tight" style={{ color: theme?.color || '#3a2a16' }}>
                          {p.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-[#6b4f2c]/70 truncate">
                          {p.faction || 'Unknown'} {p.isAI ? '(AI)' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="fantasy-font text-xl font-bold text-yellow-700">{vp}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[#6b4f2c]/70">VP</div>
                    </div>
                  </div>

                  <StatRow icon={<Coins size={12} />} label="Gold Generated" value={`+${a.goldGenerated}`} />
                  <StatRow icon={<Coins size={12} />} label="Gold Spent" value={`-${a.goldSpent}`} />
                  <StatRow icon={<Sparkles size={12} />} label="XP Generated" value={`+${a.xpGenerated}`} />
                  <StatRow icon={<Sparkles size={12} />} label="XP Spent" value={`-${a.xpSpent}`} />
                  <StatRow icon={<Swords size={12} />} label="Combats Won" value={a.combatsWon} />
                  <StatRow icon={<Swords size={12} />} label="Combats Lost" value={a.combatsLost} />
                  <StatRow
                    icon={<Swords size={12} />}
                    label="Monsters Defeated"
                    value={`${p.questProgress.monstersDefeated + p.questProgress.level2MonstersDefeated + p.questProgress.level3MonstersDefeated} (L1:${p.questProgress.monstersDefeated} L2:${p.questProgress.level2MonstersDefeated} L3:${p.questProgress.level3MonstersDefeated})`}
                  />
                  <StatRow icon={<Users size={12} />} label="Units Recruited" value={a.unitsRecruited} />
                  <StatRow icon={<Users size={12} />} label="Units Lost" value={a.unitsLost} />
                  <StatRow icon={<ScrollText size={12} />} label="Skills Bought" value={a.skillsBought} />
                  <StatRow icon={<ScrollText size={12} />} label="Quests Completed" value={a.questsCompleted} />
                  <StatRow icon={<Landmark size={12} />} label="Monuments Built" value={a.monumentsBuilt} />
                  <StatRow icon={<Castle size={12} />} label="Castles Built" value={a.castlesBuilt} />
                  <StatRow icon={<Compass size={12} />} label="Adventures Done" value={p.questProgress.adventuresCompleted} />
                  <StatRow icon={<Coins size={12} />} label="Production Actions" value={a.productionCount} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAnalyticsModal;
