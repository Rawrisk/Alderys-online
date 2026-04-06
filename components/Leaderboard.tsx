import React, { useEffect, useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  created_at: string;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="text-slate-400 text-sm animate-pulse">Loading legends...</div>;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
      <h3 className="fantasy-font text-xl text-yellow-500 mb-4 border-b border-yellow-500/30 pb-2">Hall of Legends</h3>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-slate-500 italic text-sm">No legends yet. Will you be the first?</div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id} className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {index + 1}
                </span>
                <span className="text-slate-200 font-medium">{entry.name}</span>
              </div>
              <span className="fantasy-font text-yellow-400 font-bold">{entry.score} VP</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
