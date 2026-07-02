
import React from 'react';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { X, Box } from 'lucide-react';
import { FACTION_UNIT_MODELS, TILE_IMAGES } from '../constants';
import { TileType } from '../types';
import Unit3DModel, { Model } from './Unit3DModel';

interface Model3DPreviewModalProps {
  onClose: () => void;
}

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

// Fills most of the inspector canvas at its default camera distance (see
// camera position/fov below). OBJ exports vary in native scale, so the model
// is normalized to this height rather than using a fixed scale factor.
const INSPECTOR_TARGET_HEIGHT = 1.4;

const Model3DPreviewModal: React.FC<Model3DPreviewModalProps> = ({ onClose }) => {
  const modelUrl = FACTION_UNIT_MODELS.orc?.warrior;
  const hexImage = TILE_IMAGES[TileType.PLAINS];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-4 md:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(234,179,8,0.1)] relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <h2 className="fantasy-font text-2xl md:text-3xl text-yellow-500 flex items-center gap-3">
            <Box size={24} />
            3D Model Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {!modelUrl ? (
          <p className="text-slate-400 text-sm">No 3D model has been assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Large interactive preview */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold self-start">
                Inspect Model (drag to rotate, scroll to zoom)
              </h3>
              <div
                className="relative w-full max-w-[320px] aspect-[0.87/1] bg-cover bg-center border-4 border-yellow-700/40 shadow-2xl"
                style={{ clipPath: HEX_CLIP, backgroundImage: `url(${hexImage})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <Canvas camera={{ position: [0, 1.2, 2.2], fov: 40 }} gl={{ antialias: true, alpha: true }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                  <React.Suspense fallback={null}>
                    <Center>
                      <Model url={modelUrl} color="#dc2626" targetHeight={INSPECTOR_TARGET_HEIGHT} />
                    </Center>
                  </React.Suspense>
                  <Environment preset="city" />
                  <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
                </Canvas>
              </div>
              <p className="text-[11px] text-slate-500 text-center max-w-xs">
                Orc Warrior, shown over an actual map hex tile texture for context.
              </p>
            </div>

            {/* True in-game scale comparison */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold self-start">
                Actual size on the game board
              </h3>
              <div className="flex items-center justify-center gap-2 flex-wrap p-6 bg-slate-950/50 rounded-xl border border-white/5 w-full">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="relative w-24 h-28 bg-cover bg-center flex items-center justify-center"
                    style={{ clipPath: HEX_CLIP, backgroundImage: `url(${hexImage})` }}
                  >
                    <div className="absolute inset-0 bg-black/10" />
                    {i === 1 && (
                      <div className="relative z-10 rounded-full overflow-hidden shadow-lg">
                        <Unit3DModel modelUrl={modelUrl} color="#dc2626" size={32} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 text-center max-w-xs">
                This is how the unit token renders in-game (24-32px, angled, no orbit controls).
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Model3DPreviewModal;
