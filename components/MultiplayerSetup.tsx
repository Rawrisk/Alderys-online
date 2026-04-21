
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, LogIn, Copy, Check, ArrowLeft, Play, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MultiplayerSetupProps {
  onBack: () => void;
  onCreateRoom: (roomCode: string, channel: RealtimeChannel) => void;
  onJoinRoom: (roomCode: string, channel: RealtimeChannel) => void;
  isConnected: boolean;
  isSupabaseConfigured: boolean;
  connectionError: string | null;
  onRetryConnection: () => void;
  myPresenceId: string;
}

const MultiplayerSetup: React.FC<MultiplayerSetupProps> = ({ 
  onBack, 
  onCreateRoom, 
  onJoinRoom, 
  isConnected, 
  isSupabaseConfigured,
  connectionError,
  onRetryConnection,
  myPresenceId 
}) => {
  const [mode, setMode] = useState<'CHOICE' | 'CREATE' | 'JOIN'>('CHOICE');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState('Player ' + Math.floor(Math.random() * 1000));
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setMode('CREATE');
    setError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add your keys in the Settings menu.');
      return;
    }
    if (roomCode && playerName) {
      setError(null);
      setIsChecking(true);
      
      const channel = supabase.channel(`room:${roomCode}`, {
        config: {
          presence: {
            key: myPresenceId,
          },
        },
      });

      channel.subscribe(async (status, err) => {
        console.log(`MultiplayerCreate: Subscription status is ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({ 
              id: myPresenceId,
              name: playerName, 
              isHost: true,
              online_at: new Date().toISOString() 
            });
            setIsChecking(false);
            onCreateRoom(roomCode, channel);
          } catch (err: any) {
            console.error('Presence tracking failed:', err);
            setError('Failed to initialize room presence.');
            setIsChecking(false);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const detail = err?.message ? `: ${err.message}` : '';
          setError(`Supabase connection failed (${status})${detail}. Check your internet or Supabase dashboard.`);
          setIsChecking(false);
        }
      });
    }
  };

  const handleJoin = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add your keys in the Settings menu.');
      return;
    }
    if (roomCode && playerName) {
      setIsChecking(true);
      setError(null);
      
      const channel = supabase.channel(`room:${roomCode}`, {
        config: {
          presence: {
            key: myPresenceId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const players = Object.values(state).flat();
          setPresenceCount(players.length);
          console.log(`MultiplayerJoin: Presence sync. Found ${players.length} participants.`);
          
          // If we see a host, we can proceed
          const host = players.find((p: any) => p.isHost) as any;
          if (host) {
            console.log(`MultiplayerJoin: Host found (${host.name}), joining room...`);
            setIsChecking(false);
            onJoinRoom(roomCode, channel);
          }
        })
        .subscribe(async (status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`MultiplayerJoin: Subscribed to room:${roomCode}. Tracking presence...`);
            await channel.track({ 
              id: myPresenceId,
              name: playerName, 
              isHost: false,
              online_at: new Date().toISOString() 
            });
            
            // Give it more time to check presence (from 2s to 6s)
            setTimeout(() => {
              const state = channel.presenceState();
              const players = Object.values(state).flat();
              const hasHost = players.some((p: any) => p.isHost);
              
              if (!hasHost) {
                console.warn(`MultiplayerJoin: No host found after timeout. Players seen:`, players);
                setIsChecking(false);
                setError('Room not found or host is offline. Make sure the room code is correct and the host is in the lobby.');
                channel.unsubscribe();
              }
            }, 6000);
          } else {
            console.error(`MultiplayerJoin: Subscription status: ${status}`, err || '');
            if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
              setError(`Join failed: ${status}. Check your connection or if Realtime is enabled.`);
              setIsChecking(false);
            }
          }
        });
    }
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={mode === 'CHOICE' ? onBack : () => setMode('CHOICE')}
          className="absolute top-4 left-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl fantasy-font text-blue-500 mb-2 flex items-center justify-center gap-3">
            <Users className="text-blue-600" />
            Multiplayer Lobby
          </h2>
          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : !isSupabaseConfigured ? 'bg-slate-700' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {!isSupabaseConfigured ? 'Supabase Not Configured' : isConnected ? 'Supabase Realtime Active' : connectionError || 'Connecting to Supabase...'}
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
                  Realtime connection failed. Check your Supabase dashboard.
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
          {presenceCount > 0 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">
                Players in Channel: {presenceCount}
              </span>
            </div>
          )}
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            {mode === 'CHOICE' ? 'Choose your path' : mode === 'CREATE' ? 'Create a new room' : 'Join an existing room'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'CHOICE' && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 gap-4"
              >
                <button 
                  onClick={generateRoomCode}
                  disabled={!isConnected}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  {isConnected ? 'Create Room' : 'Offline'}
                </button>
                <button 
                  onClick={() => setMode('JOIN')}
                  disabled={!isConnected}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-blue-500 border border-blue-500/30 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn size={20} />
                  {isConnected ? 'Join Room' : 'Offline'}
                </button>
              </motion.div>
            )}

            {mode === 'CREATE' && (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Room Code</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-2xl font-mono text-center text-blue-500 tracking-widest">
                      {roomCode}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl border border-white/5 transition-all"
                    >
                      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic text-center">Share this code with your friends to invite them.</p>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[10px] text-center font-bold uppercase tracking-tighter mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <button 
                  onClick={handleCreate}
                  disabled={isChecking || !isConnected}
                  className={`w-full py-4 ${isChecking ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                  {isChecking ? 'Creating Room...' : isConnected ? 'Start Lobby' : 'Offline'}
                </button>
              </motion.div>
            )}

            {mode === 'JOIN' && (
              <motion.div 
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Enter Room Code</label>
                  <input 
                    type="text"
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    className={`w-full bg-slate-950 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-2xl font-mono text-center text-blue-500 tracking-widest focus:outline-none focus:border-blue-500 transition-all`}
                    placeholder="CODE"
                    maxLength={6}
                  />
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[10px] text-center font-bold uppercase tracking-tighter"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <button 
                  onClick={handleJoin}
                  disabled={isChecking || !roomCode || !isConnected}
                  className={`w-full py-4 ${isChecking ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn size={20} />
                  )}
                  {isChecking ? 'Checking...' : !isConnected ? 'Offline' : 'Join Lobby'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 italic">
            "The fate of Alderys is best decided among allies and rivals alike."
          </p>
        </div>

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
  );
};

export default MultiplayerSetup;
