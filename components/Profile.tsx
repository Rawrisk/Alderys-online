
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MatchResult, UserProfile } from '../types';
import { Trophy, History, Swords, User, LogOut, ArrowLeft, Loader2, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  userId: string;
  onClose: () => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ userId, onClose, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STATS' | 'HISTORY'>('STATS');

  useEffect(() => {
    fetchProfileAndHistory();
  }, [userId]);

  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch or Create Profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guerreiro Errante',
              email: user.email!,
              avatar_url: user.user_metadata?.avatar_url || '',
              total_matches: 0,
              victories: 0,
              total_score: 0
            })
            .select()
            .single();
          if (!createError) profileData = newProfile;
        }
      }

      setProfile(profileData);

      // Fetch Matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('match_history')
        .select('*')
        .eq('user_id', userId)
        .order('ended_at', { ascending: false });

      if (!matchesError) setMatches(matchesData || []);

    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] backdrop-blur-xl">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[110] backdrop-blur-xl p-0 md:p-4">
      <div className="bg-slate-900 w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] md:rounded-3xl border-0 md:border-2 border-white/10 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 bg-indigo-950/20 border-b border-white/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="fantasy-font text-2xl text-white tracking-wider">Perfil de Jogador</h2>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair do Jogo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hero Section */}
          <div className="p-8 pb-4 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 p-1 shadow-2xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                    <User className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-4 border-slate-900 shadow-lg">
                {(profile?.victories || 0) + 1}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-white">{profile?.name}</h1>
              <p className="text-indigo-400 font-medium tracking-wide">Lenda de Alderys</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400 border border-white/10">
                  Membro desde {formatDate(profile?.created_at || new Date().toISOString())}
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400 border border-white/10">
                  {profile?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-8 mt-6">
            <div className="flex gap-8 border-b border-white/10">
              <button 
                onClick={() => setActiveTab('STATS')}
                className={`pb-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'STATS' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                ESTATÍSTICAS
                {activeTab === 'STATS' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`pb-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'HISTORY' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                HISTÓRICO
                {activeTab === 'HISTORY' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
              </button>
            </div>
          </div>

          <div className="p-8 h-full">
            <AnimatePresence mode="wait">
              {activeTab === 'STATS' ? (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"
                >
                  <StatCard 
                    icon={<Trophy className="w-8 h-8 text-yellow-500" />}
                    label="Vitórias"
                    value={profile?.victories || 0}
                    sub="Glórias imperecíveis"
                  />
                  <StatCard 
                    icon={<History className="w-8 h-8 text-indigo-500" />}
                    label="Partidas"
                    value={profile?.total_matches || 0}
                    sub="Jornadas concluídas"
                  />
                  <StatCard 
                    icon={<Swords className="w-8 h-8 text-red-500" />}
                    label="Pontuação Total"
                    value={profile?.total_score || 0}
                    sub="Pontos de Prestígio"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {matches.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                      <History className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 italic">Sua saga ainda não começou...</p>
                    </div>
                  ) : (
                    matches.map(match => (
                      <HistoryRow key={match.id} match={match} formatDate={formatDate} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }: any) => (
  <div className="bg-slate-800/50 border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 shadow-inner">
      {icon}
    </div>
    <div className="space-y-1">
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{label}</h3>
      <p className="text-4xl font-black text-white">{value}</p>
      <p className="text-slate-500 text-xs">{sub}</p>
    </div>
  </div>
);

const HistoryRow = ({ match, formatDate }: { match: MatchResult, formatDate:Function }) => (
  <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${match.is_winner ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-white/5'}`}>
    <div className="flex items-center gap-6">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${match.is_winner ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
        {match.is_winner ? <Trophy className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
      </div>
      <div>
        <h4 className="text-white font-bold text-lg">{match.faction || 'Alderys'}</h4>
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(match.ended_at)}</span>
          <span>•</span>
          <span>{match.opponent_count} Oponentes</span>
          <span>•</span>
          <span>{match.round_count} Rodadas</span>
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-2xl font-black ${match.is_winner ? 'text-yellow-500' : 'text-slate-300'}`}>{match.score} VP</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{match.is_winner ? 'Vitória' : 'Derrota'}</p>
    </div>
  </div>
);

export default Profile;
