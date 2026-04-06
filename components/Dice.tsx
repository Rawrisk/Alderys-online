import React, { useState, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Sword, Zap, Shield, Sparkles } from 'lucide-react';

interface DiceProps {
  type: 'MELEE' | 'MANA' | 'DEFENSE' | 'ORC_MELEE' | 'FLYING_DEFENSE';
  value: number;
  isRolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRollComplete?: () => void;
  manualRotation?: { x: number; y: number };
  delay?: number;
}

const DICE_DISTRIBUTIONS = {
  MELEE: [0, 0, 1, 1, 1, 1],
  ORC_MELEE: [1, 1, 1, 1, 1, 2],
  MANA: [0, 1, 1, 1, 1, -1], // -1 represents the explosion/sparkles
  DEFENSE: [0, 1, 0, 1, 0, 1],
  FLYING_DEFENSE: [1, 1, 1, 1, 1, 2],
};

const Dice: React.FC<DiceProps> = ({ type, value, isRolling = false, size = 'md', onRollComplete, manualRotation, delay = 0 }) => {
  const controls = useAnimation();
  const [displayValue, setDisplayValue] = useState(value);

  const sizePx = useMemo(() => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 80;
      default: return 48;
    }
  }, [size]);

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 32;
      default: return 20;
    }
  };

  const getPipIconSize = () => {
    switch (size) {
      case 'sm': return 8;
      case 'lg': return 20;
      default: return 12;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'MELEE':
      case 'ORC_MELEE':
        return {
          bg: 'bg-red-600',
          border: 'border-red-400',
          shadow: 'shadow-red-900/50',
          accent: 'text-red-100'
        };
      case 'MANA':
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-400',
          shadow: 'shadow-blue-900/50',
          accent: 'text-blue-100'
        };
      case 'DEFENSE':
      case 'FLYING_DEFENSE':
        return {
          bg: 'bg-slate-600',
          border: 'border-slate-400',
          shadow: 'shadow-slate-900/50',
          accent: 'text-slate-100'
        };
      default:
        return {
          bg: 'bg-slate-700',
          border: 'border-slate-500',
          shadow: 'shadow-slate-900/50',
          accent: 'text-slate-200'
        };
    }
  };

  const colors = getColors();

  useEffect(() => {
    if (isRolling) {
      const sequence = async () => {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        // Chaotic rolling animation
        await controls.start({
          y: [-20, -60, -40, -20, 0],
          rotateX: [0, 360, 720, 1080, 1440],
          rotateY: [0, -360, -720, -1080, -1440],
          rotateZ: [0, 90, 180, 270, 360],
          transition: { duration: 1.2, ease: "easeInOut" }
        });

        setDisplayValue(value);
        
        // Settle animation
        await controls.start({
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: [1, 1.1, 1],
          transition: { duration: 0.3 }
        });

        if (onRollComplete) onRollComplete();
      };
      sequence();
    } else if (!manualRotation) {
      setDisplayValue(value);
      controls.set({ rotateX: 0, rotateY: 0, rotateZ: 0, y: 0, scale: 1 });
    }
  }, [isRolling, value, controls, onRollComplete, manualRotation, delay]);

  useEffect(() => {
    if (!isRolling && manualRotation) {
      controls.start({ 
        rotateX: manualRotation.x, 
        rotateY: manualRotation.y,
        rotateZ: 0,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 200, damping: 20 }
      });
    }
  }, [manualRotation, isRolling, controls]);

  const renderIcon = (val: number) => {
    if (val === 0) return null;
    if (val === -1 || val === -2) return <Sparkles size={getIconSize()} className="animate-pulse text-yellow-300" />;

    const Icon = ({ sizeOverride }: { sizeOverride?: number }) => {
      const iconSize = sizeOverride || (val > 1 ? getIconSize() * 0.7 : getIconSize());
      switch (type) {
        case 'MELEE':
        case 'ORC_MELEE':
          return <Sword size={iconSize} />;
        case 'MANA':
          return <Zap size={iconSize} />;
        case 'DEFENSE':
        case 'FLYING_DEFENSE':
          return <Shield size={iconSize} />;
        default:
          return <span className="font-bold">{val}</span>;
      }
    };

    if (val === 1) return <Icon />;

    // For values > 1, show multiple icons in a small grid
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {[...Array(val)].map((_, i) => (
          <Icon key={i} />
        ))}
      </div>
    );
  };

  const halfSize = sizePx / 2;

  const Face = ({ transform, val }: { transform: string, val: number }) => (
    <div 
      className={`absolute inset-0 ${colors.bg} ${colors.border} border-2 rounded-lg flex items-center justify-center shadow-inner`}
      style={{ 
        transform,
        backfaceVisibility: 'hidden',
        width: sizePx,
        height: sizePx,
        position: 'absolute'
      }}
    >
      {/* Pips */}
      <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full" />
      <div className="absolute top-1 right-1 w-1 h-1 bg-white/20 rounded-full" />
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/20 rounded-full" />
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/20 rounded-full" />
      
      <div className="relative z-10 flex items-center justify-center text-white">
        {renderIcon(val)}
      </div>
      
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );

  const getFaces = () => {
    const dist = [...DICE_DISTRIBUTIONS[type]];
    // Find the first index of the current value to put it on the front face
    const valIndex = dist.indexOf(displayValue);
    if (valIndex !== -1) {
      // Remove the current value from the pool to distribute the rest
      dist.splice(valIndex, 1);
    } else {
      // Fallback if value isn't in distribution (shouldn't happen)
      dist.shift();
    }
    
    return {
      front: displayValue,
      back: dist[0],
      right: dist[1],
      left: dist[2],
      top: dist[3],
      bottom: dist[4]
    };
  };

  const faces = getFaces();

  return (
    <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx, perspective: '1000px' }}>
      {/* Shadow */}
      <motion.div
        animate={isRolling ? {
          scale: [1, 0.6, 0.4, 0.6, 1],
          opacity: [0.2, 0.1, 0.05, 0.1, 0.2],
        } : { scale: 1, opacity: 0.2 }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-2 bg-black/40 blur-md rounded-full pointer-events-none"
      />

      <motion.div
        animate={controls}
        transformTemplate={({ rotateX, rotateY, rotateZ }) => 
          `perspective(1000px) rotateY(${rotateY}) rotateX(${rotateX}) rotateZ(${rotateZ})`
        }
        style={{ 
          width: sizePx, 
          height: sizePx, 
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}
      >
        {/* Front */}
        <Face transform={`translateZ(${halfSize}px)`} val={faces.front} />
        {/* Back */}
        <Face transform={`rotateY(180deg) translateZ(${halfSize}px)`} val={faces.back} />
        {/* Right */}
        <Face transform={`rotateY(90deg) translateZ(${halfSize}px)`} val={faces.right} />
        {/* Left */}
        <Face transform={`rotateY(-90deg) translateZ(${halfSize}px)`} val={faces.left} />
        {/* Top */}
        <Face transform={`rotateX(90deg) translateZ(${halfSize}px)`} val={faces.top} />
        {/* Bottom */}
        <Face transform={`rotateX(-90deg) translateZ(${halfSize}px)`} val={faces.bottom} />
      </motion.div>
    </div>
  );
};

export default Dice;
