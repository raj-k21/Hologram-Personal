export type HologramMode = 'dashboard' | 'clock' | 'stocks' | 'visuals';

export type VisualType =
  | 'vortex'      // Neon particle vortex
  | 'core'        // Rotating energy core
  | 'tunnel'      // Cyberpunk tunnel
  | 'helix'       // Floating DNA helix
  | 'grid'        // Sci-fi hologram grid
  | 'matrix'      // Matrix-style digital rain
  | 'galaxy'      // Galaxy spiral
  | 'synth'       // Audio-reactive visualizer
  | 'wireframe'   // Rotating wireframe sphere
  | 'geometric'   // Infinite geometric patterns
  | 'cube'        // Floating holographic cube
  | 'earth'       // Planet Earth hologram
  | 'solar'       // Solar System;

export interface MirrorConfig {
  horizontal: boolean;
  vertical: boolean;
  rotate180: boolean;
  bothAxes: boolean;
}

export interface HologramSettings {
  brightness: number; // 0.2 to 1.5
  glow: number;       // 0 to 40 (px shadow glow)
  contrast: number;   // 0.5 to 2.0
  colorPreset: 'cyan' | 'red' | 'purple' | 'green' | 'amber';
  hideUIInHologram: boolean;
  synthEnabled: boolean;
  synthVolume: number;
  audioSensitivity: number; // 0.1 to 3.0
  audioBassResponse: number; // 0.1 to 3.0
  audioReactionSource: 'microphone' | 'procedural';
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}
