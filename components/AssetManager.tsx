
import React, { useState, useEffect, useRef } from 'react';
import { 
  Hexagon, 
  Users, 
  Image as ImageIcon, 
  Zap, 
  Skull, 
  MoreHorizontal, 
  Plus, 
  X, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  url: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'hex', name: 'Hex Tiles', icon: Hexagon },
  { id: 'unit', name: 'Faction Units', icon: Users },
  { id: 'monster', name: 'Monsters', icon: Skull },
  { id: 'background', name: 'Faction Backgrounds', icon: ImageIcon },
  { id: 'skill', name: 'Skills', icon: Zap },
  { id: 'other', name: 'Other', icon: MoreHorizontal }
];

const AssetManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('hex');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl) return;

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch('/api/assets/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAssetName || 'Unnamed Asset',
          url: newAssetUrl,
          category: selectedCategory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      await fetchAssets();
      setNewAssetName('');
      setNewAssetUrl('');
      setShowAddForm(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="fantasy-font text-2xl text-yellow-500">Asset Repository</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Global Game Assets</p>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              showAddForm 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
            }`}
          >
            {showAddForm ? (
              <>
                <X size={14} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={14} />
                Add New Asset
              </>
            )}
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('close-assets'))}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                isActive 
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' 
                  : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {showAddForm && (
        <form onSubmit={handleRegister} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Asset Name</label>
              <input 
                type="text" 
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="e.g. Forest Hex"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Supabase Image URL</label>
              <input 
                type="url" 
                required
                value={newAssetUrl}
                onChange={(e) => setNewAssetUrl(e.target.value)}
                placeholder="https://your-project.supabase.co/storage/v1/object/public/..."
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Category:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500/50 transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              disabled={isRegistering || !newAssetUrl}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2 rounded-lg transition-all"
            >
              {isRegistering ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.filter(a => a.category === selectedCategory).length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-500 italic text-sm">No assets in this category yet.</p>
            </div>
          ) : (
            assets.filter(a => a.category === selectedCategory).map((asset) => (
              <div key={asset.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-2 group hover:border-yellow-500/30 transition-all relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/40 mb-2 relative">
                  <img 
                    src={asset.url} 
                    alt={asset.name} 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 right-1 bg-black/60 text-[8px] text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                    {(() => {
                      const cat = CATEGORIES.find(c => c.id === asset.category);
                      const Icon = cat?.icon || MoreHorizontal;
                      return <Icon size={8} />;
                    })()}
                    {asset.category}
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-[10px] text-slate-300 font-bold truncate mb-1" title={asset.name}>{asset.name}</p>
                  <button 
                    onClick={() => copyToClipboard(asset.url, asset.id)}
                    className={`w-full py-1.5 rounded text-[9px] font-bold transition-all flex items-center justify-center gap-1 ${
                      copiedId === asset.id 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    {copiedId === asset.id ? (
                      <>
                        <Check size={10} />
                        Copied URL
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
        <p>Total Assets: {assets.length}</p>
        <p className="italic">Use these URLs in your game configuration for custom visuals.</p>
      </div>
    </div>
  );
};

export default AssetManager;
