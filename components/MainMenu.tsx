
import React from 'react';
import { motion } from 'motion/react';
import { User, Users, Play, BookOpen, Settings, Database, Dice5, RefreshCw } from 'lucide-react';
import { testSupabaseConnection } from '../supabase';

interface MainMenuProps {
  onSelectMode: (mode: 'SINGLE' | 'MULTI') => void;
  onShowAssets: () => void;
  onLoadGame: () => void;
  onShowRules: () => void;
  onShowDiceTests: () => void;
  intro: string;
  isConnected: boolean;
  isSupabaseConfigured: boolean;
  connectionError: string | null;
  onRetryConnection: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onSelectMode, 
  onShowAssets, 
  onLoadGame, 
  onShowRules, 
  onShowDiceTests,
  intro,
  isConnected,
  isSupabaseConfigured,
  connectionError,
  onRetryConnection
}) => {
  const [showTroubleshooting, setShowTroubleshooting] = React.useState(false);
  const [testResults, setTestResults] = React.useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResults(null);
    try {
      const result = await testSupabaseConnection();
      setTestResults(result);
    } catch (err) {
      setTestResults({ success: false, message: 'Unexpected testing error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-y-auto custom-scrollbar">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full text-center"
        >
        <h1 className="text-4xl sm:text-6xl md:text-9xl fantasy-font text-yellow-500 mb-2 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)] tracking-tighter">
          ALDERYS
        </h1>
        <p className="text-slate-400 italic font-light max-w-lg mx-auto mb-12 text-sm md:text-lg">
          {intro}
        </p>

        <div className="flex flex-col items-center justify-center gap-2 mb-12">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : !isSupabaseConfigured ? 'bg-slate-700' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {!isSupabaseConfigured ? 'Supabase Not Configured' : isConnected ? 'Supabase Realtime Active' : connectionError || 'Supabase Offline'}
            </span>
            {!isConnected && isSupabaseConfigured && (
              <button 
                onClick={onRetryConnection}
                className="text-[10px] text-blue-500 hover:text-blue-400 underline uppercase tracking-widest font-bold ml-2"
              >
                Retry
              </button>
            )}
          </div>
          {connectionError === 'Connection Error' && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-[9px] text-red-500/70 max-w-xs mx-auto leading-tight">
                Check if Realtime is enabled in your Supabase dashboard or if the project is paused.
              </p>
              <button 
                onClick={() => setShowTroubleshooting(true)}
                className="text-[9px] text-slate-500 hover:text-slate-400 underline uppercase tracking-widest"
              >
                Troubleshooting Guide
              </button>
            </div>
          )}
        </div>

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

        {/* Troubleshooting Modal */}
        {showTroubleshooting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-2xl"
            >
              <h3 className="text-2xl fantasy-font text-yellow-500 mb-4">Supabase Troubleshooting</h3>
              <div className="space-y-4 text-slate-300 text-sm text-left">
                <p>If you are seeing a <span className="text-red-500 font-bold">CHANNEL_ERROR</span>, follow these steps:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-500 underline">Supabase Dashboard</a>.</li>
                  <li>Select your project and go to <span className="text-white font-bold">Project Settings</span> → <span className="text-white font-bold">API</span>.</li>
                  <li>Scroll down to <span className="text-white font-bold">Realtime</span> and ensure it is <span className="text-green-500 font-bold">Enabled</span>.</li>
                  <li>Check if your project is <span className="text-yellow-500 font-bold">Paused</span> (Free tier projects pause after 1 week of inactivity).</li>
                  <li>Verify that <span className="text-white font-bold">VITE_SUPABASE_URL</span> and <span className="text-white font-bold">VITE_SUPABASE_ANON_KEY</span> in your environment variables match exactly what is in the dashboard.</li>
                </ol>
                <p className="text-xs text-slate-500 mt-4 italic">Note: Multiplayer features require a valid Supabase configuration to work.</p>
                
                <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Engine</h4>
                    <button 
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="text-[10px] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                      {isTesting ? 'Testing...' : 'Run Diagnostics'}
                    </button>
                  </div>
                  
                  {testResults && (
                    <div className={`mt-2 p-3 rounded-md text-xs font-mono leading-relaxed ${testResults.success ? 'bg-green-950/30 text-green-400' : 'bg-red-950/30 text-red-400'}`}>
                      {testResults.message}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setShowTroubleshooting(false)}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
    </div>
  );
};

export default MainMenu;
