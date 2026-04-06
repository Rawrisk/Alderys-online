
import React from 'react';
import { Quest } from '../types';

interface QuestSelectionModalProps {
  playerName: string;
  choices: Quest[];
  onSelect: (questId: string) => void;
  title?: string;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const QuestSelectionModal: React.FC<QuestSelectionModalProps> = ({ playerName, choices, onSelect, title, onHover, onClearHover }) => {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        <div className="p-8 bg-slate-800 border-b border-white/10 text-center">
          <h2 className="fantasy-font text-3xl text-indigo-400 mb-2">{playerName}, {title || 'Choose Your Secret Quest'}</h2>
          <p className="text-slate-400">Select one quest to keep as your secret objective. The other will become a public quest for all players.</p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {choices.map((quest, index) => (
            <button
              key={`${quest.id}-${index}`}
              onClick={() => onSelect(quest.id)}
              onMouseEnter={(e) => onHover('QUEST', quest, e.clientX, e.clientY)}
              onMouseLeave={onClearHover}
              className="group relative p-6 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-indigo-500/50 rounded-2xl transition-all flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-lg mb-2">Objective</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{quest.description}</p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-yellow-500 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                <span>{quest.rewardVP} Victory Point</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestSelectionModal;
