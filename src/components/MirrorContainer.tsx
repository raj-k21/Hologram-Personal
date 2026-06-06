import React from 'react';
import { MirrorConfig, HologramSettings } from '../types';

interface MirrorContainerProps {
  children: React.ReactNode;
  mirror: MirrorConfig;
  settings: HologramSettings;
}

export default function MirrorContainer({
  children,
  mirror,
  settings,
}: MirrorContainerProps) {
  // Compute transform styles based on user configurations
  const getTransforms = () => {
    const parts: string[] = [];
    
    if (mirror.bothAxes) {
      parts.push('scale(-1, -1)');
    } else {
      if (mirror.horizontal) parts.push('scaleX(-1)');
      if (mirror.vertical) parts.push('scaleY(-1)');
    }

    if (mirror.rotate180) {
      parts.push('rotate(180deg)');
    }

    return parts.join(' ');
  };

  // Adjust style filter options (brightness, contrast, and glow/shadow settings)
  const containerStyle: React.CSSProperties = {
    transform: getTransforms(),
    transformOrigin: 'center center',
    filter: `brightness(${settings.brightness}) contrast(${settings.contrast})`,
    backgroundColor: '#000000',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
  };

  // Neon glow utility style mapping to push colors
  const colorShadows = {
    cyan: '0 0 var(--glow-px) rgba(34, 211, 238, 0.65)',
    red: '0 0 var(--glow-px) rgba(239, 68, 68, 0.65)',
    purple: '0 0 var(--glow-px) rgba(168, 85, 247, 0.65)',
    green: '0 0 var(--glow-px) rgba(34, 197, 94, 0.65)',
    amber: '0 0 var(--glow-px) rgba(245, 158, 11, 0.65)',
  };

  const cssVariables = {
    '--glow-px': `${settings.glow}px`,
    '--hologram-glow': colorShadows[settings.colorPreset],
    '--theme-color': 
      settings.colorPreset === 'cyan' ? '#22d3ee' :
      settings.colorPreset === 'red' ? '#ef4444' :
      settings.colorPreset === 'purple' ? '#a855f7' :
      settings.colorPreset === 'green' ? '#22c55e' : '#f59e0b',
  } as React.CSSProperties;

  return (
    <div 
      id="hologram-workspace-root" 
      style={{ ...containerStyle, ...cssVariables }}
      className="select-none text-white font-sans antialiased relative"
    >
      {/* Background Ambient Glow (Dynamic Adaptive) */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none transition-all duration-500 ${
          settings.colorPreset === 'cyan' ? 'bg-cyan-900/10' :
          settings.colorPreset === 'red' ? 'bg-red-900/10' :
          settings.colorPreset === 'purple' ? 'bg-purple-900/10' :
          settings.colorPreset === 'green' ? 'bg-green-900/10' : 'bg-amber-900/10'
        }`}
      />

      {/* Decorative Hologram Blueprint Grid Elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        {/* Circular Calibration Rings */}
        <div className="w-[750px] h-[750px] border border-white/5 rounded-full flex items-center justify-center opacity-40">
          <div className={`w-[580px] h-[580px] border rounded-full transition-colors duration-500 ${
            settings.colorPreset === 'cyan' ? 'border-cyan-500/10' :
            settings.colorPreset === 'red' ? 'border-red-500/10' :
            settings.colorPreset === 'purple' ? 'border-purple-500/10' :
            settings.colorPreset === 'green' ? 'border-green-500/10' : 'border-amber-500/10'
          }`} />
          <div className="absolute w-[420px] h-[420px] border border-white/5 rounded-full" />
          <div className="absolute w-[240px] h-[240px] border border-dashed border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
        </div>

        {/* Technical crosshairs */}
        <div className="absolute w-[800px] h-[1px] bg-white/[0.02]" />
        <div className="absolute h-[800px] w-[1px] bg-white/[0.02]" />

        {/* Floating calibration guides */}
        <div className={`absolute top-1/4 left-1/4 w-24 h-0.5 blur-[0.5px] transition-colors duration-500 ${
          settings.colorPreset === 'cyan' ? 'bg-cyan-500/20' :
          settings.colorPreset === 'red' ? 'bg-red-500/20' :
          settings.colorPreset === 'purple' ? 'bg-purple-500/20' :
          settings.colorPreset === 'green' ? 'bg-green-500/20' : 'bg-amber-500/20'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-24 h-0.5 blur-[0.5px] transition-colors duration-500 ${
          settings.colorPreset === 'cyan' ? 'bg-cyan-500/20' :
          settings.colorPreset === 'red' ? 'bg-red-500/20' :
          settings.colorPreset === 'purple' ? 'bg-purple-500/20' :
          settings.colorPreset === 'green' ? 'bg-green-500/20' : 'bg-amber-500/20'
        }`} />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
