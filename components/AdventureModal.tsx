
import React from 'react';
import { AdventureCard, AdventureOption } from '../types';

interface AdventureModalProps {
  adventure: AdventureCard;
  onSelectOption: (option: AdventureOption) => void;
  onHover: (type: 'UNIT' | 'BUILDING' | 'SKILL' | 'QUEST' | 'TILE' | 'MONSTER', data: any, x: number, y: number) => void;
  onClearHover: () => void;
}

const AdventureModal: React.FC<AdventureModalProps> = ({ adventure, onSelectOption, onHover, onClearHover }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(234,179,8,0.2)]">
        {/* Header */}
        <div className="p-6 bg-slate-800 border-b border-white/10 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
            {adventure.isAdvanced ? 'Advanced Adventure' : 'Adventure'}
          </div>
          <h2 className="fantasy-font text-2xl md:text-3xl text-yellow-500 mt-2">{adventure.title}</h2>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500/50">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
          
          <p className="text-slate-300 text-lg leading-relaxed italic mb-8">
            "{adventure.story}"
          </p>
 
          <div className="w-full space-y-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Choose your reward</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {adventure.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectOption(option)}
                  onMouseEnter={(e) => {
                    if (option.type === 'SKILL' && option.skill) {
                      onHover('SKILL', option.skill, e.clientX, e.clientY);
                    }
                  }}
                  onMouseLeave={onClearHover}
                  className="group relative p-4 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-yellow-500/50 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="text-yellow-500 group-hover:scale-110 transition-transform">
                    {option.type === 'GOLD' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18.06"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
                    )}
                    {option.type === 'XP' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/></svg>
                    )}
                    {option.type === 'SKILL' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    )}
                  </div>
                  <span className="font-bold text-slate-100">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureModal;
