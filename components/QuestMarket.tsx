
import React from 'react';
import { Player, Quest, HexTile, Unit, Building } from '../types';

interface QuestMarketProps {
  player: Player;
  publicQuests: Quest[];
  onComplete: (questId: string, isSecret: boolean) => void;
  onCancel: () => void;
  checkFulfillment: (player: Player, quest: Quest, board: HexTile[], units: Unit[], buildings: Building[]) => boolean;
  board: HexTile[];
  units: Unit[];
  buildings: Building[];
  isViewOnly?: boolean;
  isYearEndPhase?: boolean;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const QuestMarket: React.FC<QuestMarketProps> = ({ 
  player, 
  publicQuests, 
  onComplete, 
  onCancel, 
  checkFulfillment,
  board,
  units,
  buildings,
  isViewOnly = false,
  isYearEndPhase = false,
  onHover,
  onClearHover
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        <div className="p-6 bg-slate-800 border-b border-white/10 flex justify-between items-center">
          <h2 className="fantasy-font text-3xl text-indigo-400">
            {isYearEndPhase ? `Year End: ${player.name} (${player.faction}) - Complete a Quest?` : 'Quest Market'}
          </h2>
          {isYearEndPhase ? (
            <button 
              onClick={onCancel}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Skip Quest Option
            </button>
          ) : (
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>

        <div className="p-8 flex flex-col gap-8 overflow-y-auto max-h-[70vh]">
          {/* Secret Quest */}
          {player.secretQuest && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Your Secret Quest</h3>
              <div 
                className="p-6 bg-slate-800 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
                onMouseEnter={(e) => onHover('QUEST', player.secretQuest, e.clientX, e.clientY)}
                onMouseLeave={onClearHover}
              >
                <div className="flex items-center gap-6 text-center md:text-left">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-100 font-bold text-lg">{player.secretQuest.description}</p>
                    <p className="text-indigo-400 text-sm font-bold mt-1">Reward: {player.secretQuest.rewardVP} Victory Point</p>
                  </div>
                </div>
                {!isViewOnly && (
                  <button
                    onClick={() => player.secretQuest && onComplete(player.secretQuest.id, true)}
                    disabled={!player.secretQuest || !checkFulfillment(player, player.secretQuest, board, units, buildings)}
                    className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      player.secretQuest && checkFulfillment(player, player.secretQuest, board, units, buildings)
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Complete Quest
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Public Quests */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Public Quests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicQuests.map((quest, index) => (
                <div 
                  key={`${quest.id}-${index}`} 
                  className="p-6 bg-slate-800 border border-white/10 rounded-2xl flex flex-col gap-4"
                  onMouseEnter={(e) => onHover('QUEST', quest, e.clientX, e.clientY)}
                  onMouseLeave={onClearHover}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-100 font-bold">{quest.description}</p>
                      <p className="text-yellow-500 text-xs font-bold mt-1">Reward: {quest.rewardVP} Victory Point</p>
                    </div>
                  </div>
                  {!isViewOnly && (
                    <button
                      onClick={() => onComplete(quest.id, false)}
                      disabled={!checkFulfillment(player, quest, board, units, buildings)}
                      className={`mt-auto px-4 py-2 rounded-lg font-bold transition-all ${
                        checkFulfillment(player, quest, board, units, buildings)
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Complete Quest
                    </button>
                  )}
                </div>
              ))}
              {publicQuests.length === 0 && (
                <div className="col-span-2 p-12 bg-slate-800/50 border border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-slate-500 italic">No public quests available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestMarket;
