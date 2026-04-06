import React, { useState } from 'react';
import RuleBookModal from './RuleBookModal';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Alderys",
    content: "This tutorial will guide you through the basics of the game. You can exit at any time.",
    position: "center"
  },
  {
    title: "The Game Board",
    content: "This is the map of Alderys. You start at your Faction's Capital. Your goal is to expand your territory, complete quests, and eventually defeat the Boss in the center.",
    position: "center"
  },
  {
    title: "Factions & Stats",
    content: "The Sidebar shows your Faction's stats, resources (Gold and XP), and your Action Cubes. You need 10 Victory Points (VP) to win.",
    position: "left"
  },
  {
    title: "Action Panel",
    content: "At the bottom is the Action Panel. You have 2 Actions per turn. You spend Action Cubes to perform actions like Production, Move, Recruit, and Build.",
    position: "bottom"
  },
  {
    title: "Production",
    content: "The Production action gives you Gold and XP based on the territories you control. It costs 2 Actions to perform.",
    position: "bottom"
  },
  {
    title: "Recruiting & Moving",
    content: "You can Recruit new units at your Castles, and Move them across the board to explore and claim new territories.",
    position: "bottom"
  },
  {
    title: "Quests & Skills",
    content: "Click the Quests and Skills buttons at the top right to view available public quests and the skill market to upgrade your units.",
    position: "top-right"
  },
  {
    title: "Ready to Rule",
    content: "That's the basics! Explore the map, manage your resources wisely, and claim the throne of Alderys.",
    position: "center"
  }
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [showRuleBook, setShowRuleBook] = useState(false);

  const currentStep = TUTORIAL_STEPS[step];

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'left': return 'top-1/2 left-4 md:left-72 -translate-y-1/2';
      case 'bottom': return 'bottom-32 left-1/2 -translate-x-1/2';
      case 'top-right': return 'top-16 right-4 md:right-16';
      default: return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex">
      {/* Dim background for center steps */}
      {currentStep.position === 'center' && (
        <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity" />
      )}
      
      <div className={`absolute ${getPositionClasses(currentStep.position)} w-80 md:w-96 bg-slate-900 border border-yellow-500/50 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] p-6 pointer-events-auto transition-all duration-500`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="fantasy-font text-xl text-yellow-500">{currentStep.title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {currentStep.content}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span>{step + 1} / {TUTORIAL_STEPS.length}</span>
            <button 
              onClick={() => setShowRuleBook(true)}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Rulebook
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrev}
              disabled={step === 0}
              className="px-3 py-1.5 rounded text-xs font-bold bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Prev
            </button>
            <button 
              onClick={handleNext}
              className="px-4 py-1.5 rounded text-xs font-bold bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {showRuleBook && <RuleBookModal onClose={() => setShowRuleBook(false)} />}
    </div>
  );
};

export default TutorialOverlay;
