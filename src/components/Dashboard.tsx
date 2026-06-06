import React, { useEffect, useState } from 'react';
import { HologramMode, VisualType } from '../types';
import {
  Clock,
  TrendingUp,
  Cpu,
  Tv,
  Compass,
  Layout,
  Music,
  Maximize2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { visualsCatalog } from './HologramVisuals';

interface DashboardProps {
  onModeChange: (mode: HologramMode) => void;
  onVisualChange: (visual: VisualType) => void;
  colorPreset: 'cyan' | 'red' | 'purple' | 'green' | 'amber';
}

export default function Dashboard({
  onModeChange,
  onVisualChange,
  colorPreset,
}: DashboardProps) {
  const [digitalRain, setDigitalRain] = useState<string[]>([]);
  const [activeSystemLoad, setActiveSystemLoad] = useState<number>(60);

  // Generate glowing procedural HUD grid matrix letters on landing background
  useEffect(() => {
    const rawFeed = [];
    const hex = '01XYZCOREHUD$@#';
    for (let i = 0; i < 6; i++) {
      let str = '';
      for (let j = 0; j < 12; j++) {
        str += hex[Math.floor(Math.random() * hex.length)];
      }
      rawFeed.push(str);
    }
    setDigitalRain(rawFeed);

    const interval = setInterval(() => {
      setActiveSystemLoad(Math.floor(58 + Math.random() * 4));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="central-hud-dashboard" className="w-full h-full bg-black flex flex-col justify-between p-6 overflow-y-auto select-none">
      
      {/* Top Banner Telemetries */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-black tracking-[0.25em] text-cyan-400 uppercase">
              HOLOGRAM PROJECTION OS v1.0
            </h1>
            <p className="text-[9px] font-mono text-white/30 tracking-widest leading-none">
              PEPPER'S GHOST OPTIMIZED INTERFACE // IPAD SAFARI
            </p>
          </div>
        </div>

        {/* Humbler diagnostic tags */}
        <div className="hidden sm:flex items-center gap-5 text-[9px] font-mono text-white/45">
          <div className="flex items-center gap-1.5 ">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <span>RENDER CONCORDANCE: 1.000 (SECURE)</span>
          </div>
          <div>FPS MODE: {activeSystemLoad} / SEC</div>
        </div>
      </div>

      {/* Bento Grid layout holding options */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6 items-stretch">
        
        {/* Card 1: Neon LED Clock */}
        <div
          id="btn-card-clock"
          onClick={() => onModeChange('clock')}
          className="group relative border border-white/10 hover:border-red-500/50 bg-white/[0.01] hover:bg-red-950/5 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.01)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] overflow-hidden"
        >
          {/* Neon accent corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/20 transition-all" />

          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-mono text-white/35 tracking-widest">PROJECTION MODE 01</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:scale-110 transition-all" />
          </div>

          <div className="my-2 sm:my-4">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-mono font-black text-red-500 uppercase tracking-widest leading-snug">
              HOLOGRAM CLOCK
            </h2>
            <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-1 leading-snug">
              Displays a huge, ultra-bright digital clock. Configurable between 12H / 24H and beautiful floating 3D matrix timelines. Ideal for desktop mirrors.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 text-[8px] sm:text-[9px] font-mono text-red-400/70 font-bold uppercase tracking-widest">
            <span>[ RED LED GLOW ACTIVE ]</span>
            <span>LAUNCH →</span>
          </div>
        </div>

        {/* Card 2: Interactive Stock HUD */}
        <div
          id="btn-card-stocks"
          onClick={() => onModeChange('stocks')}
          className="group relative border border-white/10 hover:border-cyan-500/50 bg-white/[0.01] hover:bg-cyan-950/5 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.01)] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] overflow-hidden"
        >
          {/* Neon accent corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />

          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-mono text-white/35 tracking-widest">PROJECTION MODE 02</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-all" />
          </div>

          <div className="my-2 sm:my-4">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-mono font-black text-cyan-400 uppercase tracking-widest leading-snug">
              LIVE STOCK INDEXES
            </h2>
            <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-1 leading-snug">
              Real-time stock and cryptocurrency visualizations. Multi-view mode with custom vector line graphs, classic candlesticks, zoom, and live pan trackers.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 text-[8px] sm:text-[9px] font-mono text-cyan-400/70 font-bold uppercase tracking-widest">
            <span>[ HIGH ACUITY LINES ]</span>
            <span>LAUNCH →</span>
          </div>
        </div>

        {/* Card 3: 3D Holographic Animations */}
        <div
          id="btn-card-visuals"
          onClick={() => onModeChange('visuals')}
          className="group relative border border-white/10 hover:border-indigo-500/50 bg-white/[0.01] hover:bg-indigo-950/5 rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.01)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden"
        >
          {/* Neon accent corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />

          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-mono text-white/35 tracking-widest">PROJECTION MODE 03</span>
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:scale-110 transition-all" />
          </div>

          <div className="my-2 sm:my-4">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-mono font-black text-indigo-400 uppercase tracking-widest leading-snug">
              INFINITE VISUALS
            </h2>
            <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-1 leading-snug">
              Select from over 13 GPU-accelerated WebGL visuals. Includes stunning particles, core vortexes, DNA helices, coordinate spheres, planet globes, and solar paths.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 text-[8px] sm:text-[9px] font-mono text-indigo-400/80 font-bold uppercase tracking-widest">
            <span>[ 13 WEBGL RENDERERS ]</span>
            <span>LAUNCH →</span>
          </div>
        </div>
      </div>

      {/* Bottom telemetry grids & helpful suggestions for screensavers */}
      <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Dynamic code logs */}
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/20">
          <div>FEED VECTOR LOG:</div>
          {digitalRain.map((str, idx) => (
            <div key={idx} className="hidden lg:block select-none animate-pulse">
              {str}
            </div>
          ))}
        </div>

        {/* Quick select screensaver */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30 tracking-wider">QUICK RENDER:</span>
          <button
            id="btn-quick-earth"
            onClick={() => {
              onVisualChange('earth');
              onModeChange('visuals');
            }}
            className="px-2 py-1 text-[9px] font-mono rounded border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/20 text-white/60 hover:text-cyan-400 transition-all cursor-pointer"
          >
            HOLO PLANET EARTH
          </button>
          <button
            id="btn-quick-helix"
            onClick={() => {
              onVisualChange('helix');
              onModeChange('visuals');
            }}
            className="px-2 py-1 text-[9px] font-mono rounded border border-white/10 hover:border-purple-500/40 hover:bg-purple-950/20 text-white/60 hover:text-purple-400 transition-all cursor-pointer"
          >
            DOUBLE HELIX
          </button>
        </div>
      </div>
    </div>
  );
}
export { Dashboard };
