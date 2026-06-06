import React, { useState } from 'react';
import { MirrorConfig, HologramSettings, VisualType } from '../types';
import {
  Settings,
  Minimize2,
  Maximize2,
  EyeOff,
  Eye,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Maximize,
  Volume2,
} from 'lucide-react';
import AmbientSynth from './AmbientSynth';
import { visualsCatalog } from './HologramVisuals';

interface SettingsPanelProps {
  mirror: MirrorConfig;
  settings: HologramSettings;
  currentMode: 'dashboard' | 'clock' | 'stocks' | 'visuals';
  selectedVisual: VisualType;
  onMirrorChange: (mirror: MirrorConfig) => void;
  onSettingsChange: (settings: HologramSettings) => void;
  onModeChange: (mode: 'dashboard' | 'clock' | 'stocks' | 'visuals') => void;
  onVisualChange: (visual: VisualType) => void;
}

export default function SettingsPanel({
  mirror,
  settings,
  currentMode,
  selectedVisual,
  onMirrorChange,
  onSettingsChange,
  onModeChange,
  onVisualChange,
}: SettingsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Dynamic Theme Styling Arrays
  const activeColorBase = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
  }[settings.colorPreset] || 'text-cyan-400';

  const activeColorBg = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  }[settings.colorPreset] || 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';

  const activeAccentRange = {
    cyan: 'accent-cyan-400',
    red: 'accent-red-500',
    purple: 'accent-purple-500',
    green: 'accent-green-500',
    amber: 'accent-amber-500',
  }[settings.colorPreset] || 'accent-cyan-400';

  // Toggle helpers
  const handleMirrorToggle = (key: keyof MirrorConfig) => {
    onMirrorChange({
      ...mirror,
      [key]: !mirror[key],
    });
  };

  const handleSettingsToggle = <K extends keyof HologramSettings>(key: K) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key] as any,
    });
  };

  const handleSliderChange = (key: keyof HologramSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const colorPresets: Array<{ id: HologramSettings['colorPreset']; label: string; color: string }> = [
    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
    { id: 'red', label: 'Red', color: 'bg-red-500' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { id: 'green', label: 'Green', color: 'bg-green-500' },
    { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
  ];

  // Request fullscreen specifically optimized for iPads/tablets
  const requestToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen error: ", err);
        });
      } else {
        document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request error context: ", e);
    }
  };

  return (
    <div
      id="floating-dock-pane"
      className={`fixed top-4 right-4 z-40 w-80 max-h-[90vh] flex flex-col border border-white/10 bg-black/60 rounded-2xl backdrop-blur-xl shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all duration-300 overflow-hidden ${
        collapsed ? 'h-14 w-14 rounded-full' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Settings className={`w-4 h-4 ${activeColorBase} animate-[spin_8s_linear_infinite]`} />
            <span className={`text-xs font-mono font-black tracking-widest ${activeColorBase}`}>
              HUD CALIBRATION DOCK
            </span>
          </div>
        ) : (
          <button
            id="btn-settings-expand"
            onClick={() => setCollapsed(false)}
            className={`w-10 h-10 flex items-center justify-center ${activeColorBase} hover:bg-white/5 rounded-full transition-all cursor-pointer`}
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {!collapsed && (
          <button
            id="btn-settings-collapse"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* Section: Mode Quick Nav */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 tracking-wider">
              <Sparkles className={`w-3 h-3 ${activeColorBase}`} />
              <span>ACTIVE PROJECTION MODES</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30 border border-white/5 rounded-lg">
              {(['dashboard', 'clock', 'stocks', 'visuals'] as const).map((m) => (
                <button
                  id={`btn-mode-nav-${m}`}
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`py-1.5 text-[9px] font-mono tracking-widest uppercase rounded cursor-pointer transition-all ${
                    currentMode === m
                      ? activeColorBg
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {m === 'dashboard' ? 'PANEL CENTRAL' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Section: Mirror Configs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 tracking-wider">
              <Sliders className={`w-3.5 h-3.5 ${activeColorBase}`} />
              <span>PEPPER'S MIRROR AXES</span>
            </div>
            <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/5 rounded-xl p-3">
              {/* Horizontal */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">HORIZONTAL FLIP</span>
                <button
                  id="btn-mirror-h"
                  onClick={() => handleMirrorToggle('horizontal')}
                  className={`${activeColorBase} transition-colors`}
                >
                  {mirror.horizontal ? (
                    <ToggleRight className={`w-8 h-8 ${activeColorBase}`} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-white/20" />
                  )}
                </button>
              </div>

              {/* Vertical */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">VERTICAL FLIP</span>
                <button
                  id="btn-mirror-v"
                  onClick={() => handleMirrorToggle('vertical')}
                  className={`${activeColorBase} transition-colors`}
                >
                  {mirror.vertical ? (
                    <ToggleRight className={`w-8 h-8 ${activeColorBase}`} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-white/20" />
                  )}
                </button>
              </div>

              {/* Both Axes */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">DUAL AXES SPLIT</span>
                <button
                  id="btn-mirror-both"
                  onClick={() => handleMirrorToggle('bothAxes')}
                  className={`${activeColorBase} transition-colors`}
                >
                  {mirror.bothAxes ? (
                    <ToggleRight className={`w-8 h-8 ${activeColorBase}`} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-white/20" />
                  )}
                </button>
              </div>

              {/* Rotate 180 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70">ROTATE 180°</span>
                <button
                  id="btn-mirror-rotate"
                  onClick={() => handleMirrorToggle('rotate180')}
                  className={`${activeColorBase} transition-colors`}
                >
                  {mirror.rotate180 ? (
                    <ToggleRight className={`w-8 h-8 ${activeColorBase}`} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-white/20" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Section: Slide modifiers for project calibration */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-white/40 tracking-wider">PROJECTOR CALIBRATION</span>
            
            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">BRIGHTNESS LEVEL</span>
                <span className={activeColorBase}>{Math.round(settings.brightness * 100)}%</span>
              </div>
              <input
                id="slider-cal-brightness"
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={settings.brightness}
                onChange={(e) => handleSliderChange('brightness', parseFloat(e.target.value))}
                className={`w-full ${activeAccentRange} h-1 rounded bg-white/10 cursor-pointer`}
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">CONTRAST CONSTANT</span>
                <span className={activeColorBase}>{Math.round(settings.contrast * 100)}%</span>
              </div>
              <input
                id="slider-cal-contrast"
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={settings.contrast}
                onChange={(e) => handleSliderChange('contrast', parseFloat(e.target.value))}
                className={`w-full ${activeAccentRange} h-1 rounded bg-white/10 cursor-pointer`}
              />
            </div>

            {/* Glow Rad */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/70">NEON GLOW RADIUS</span>
                <span className={activeColorBase}>{settings.glow}px</span>
              </div>
              <input
                id="slider-cal-glow"
                type="range"
                min="0"
                max="50"
                step="2"
                value={settings.glow}
                onChange={(e) => handleSliderChange('glow', parseInt(e.target.value))}
                className={`w-full ${activeAccentRange} h-1 rounded bg-white/10 cursor-pointer`}
              />
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Preset Colors */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-white/40 tracking-wider">HUD THEME MATRIX</span>
            <div className="flex items-center justify-between gap-1 bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
              {colorPresets.map((preset) => (
                <button
                  id={`btn-preset-color-${preset.id}`}
                  key={preset.id}
                  onClick={() => onSettingsChange({ ...settings, colorPreset: preset.id })}
                  className={`w-7 h-7 rounded-lg cursor-pointer transition-all flex items-center justify-center p-0.5 border ${
                    settings.colorPreset === preset.id
                      ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={preset.label}
                >
                  <span className={`w-full h-full rounded-md ${preset.color}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Synth Integrated module */}
          <AmbientSynth
            enabled={settings.synthEnabled}
            volume={settings.synthVolume}
            onToggle={(val) => onSettingsChange({ ...settings, synthEnabled: val })}
            onVolumeChange={(val) => onSettingsChange({ ...settings, synthVolume: val })}
          />

          {/* Section: Audio Reactive Tuning - Custom Visualizer Options */}
          {currentMode === 'visuals' && (
            <>
              <div className="h-[1px] bg-white/5" />
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-mono text-white/40 tracking-wider">AUDIO VISUALIZER OPTIONS</span>

                {/* Audio Source Input selector */}
                <div className="flex flex-col gap-1.5 p-2 bg-black/30 border border-white/5 rounded-xl">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/60 text-[10px]">CAPTURE SOURCE</span>
                    <span className={`uppercase font-bold text-[10px] ${activeColorBase}`}>
                      {settings.audioReactionSource === 'microphone' ? 'PHYSICAL MIC' : 'VIRTUAL PROCEDURAL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    <button
                      id="btn-source-procedural"
                      onClick={() => onSettingsChange({ ...settings, audioReactionSource: 'procedural' })}
                      className={`py-1 text-[9px] font-mono tracking-widest uppercase rounded cursor-pointer transition-all ${
                        settings.audioReactionSource === 'procedural'
                          ? activeColorBg
                          : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      PROCEDURAL
                    </button>
                    <button
                      id="btn-source-microphone"
                      onClick={() => onSettingsChange({ ...settings, audioReactionSource: 'microphone' })}
                      className={`py-1 text-[9px] font-mono tracking-widest uppercase rounded cursor-pointer transition-all ${
                        settings.audioReactionSource === 'microphone'
                          ? activeColorBg
                          : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      LIVE MIC
                    </button>
                  </div>
                </div>

                {/* Sensitivity Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/70">VISUAL SENSITIVITY</span>
                    <span className={activeColorBase}>{Math.round(settings.audioSensitivity * 100)}%</span>
                  </div>
                  <input
                    id="slider-cal-sensitivity"
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.audioSensitivity}
                    onChange={(e) => onSettingsChange({ ...settings, audioSensitivity: parseFloat(e.target.value) })}
                    className={`w-full ${activeAccentRange} h-1 rounded bg-white/10 cursor-pointer`}
                  />
                  <div className="flex justify-between text-[8px] font-mono text-white/30 px-1">
                    <span>LOW GAIN</span>
                    <span>BOOSTED</span>
                  </div>
                </div>

                {/* Bass Response Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/70">BASS FREQ RESPONSE</span>
                    <span className={activeColorBase}>{Math.round(settings.audioBassResponse * 100)}%</span>
                  </div>
                  <input
                    id="slider-cal-bass"
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.audioBassResponse}
                    onChange={(e) => onSettingsChange({ ...settings, audioBassResponse: parseFloat(e.target.value) })}
                    className={`w-full ${activeAccentRange} h-1 rounded bg-white/10 cursor-pointer`}
                  />
                  <div className="flex justify-between text-[8px] font-mono text-white/30 px-1">
                    <span>FLAT</span>
                    <span>HEAVY BASS</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="h-[1px] bg-white/5" />

          {/* Screen utility toggles: Fullscreen + Hide HUD */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-white/40 tracking-wider">GLASS SCREEN VIEWPORTS</span>
            
            {/* Hide UI Selector */}
            <button
              id="btn-settings-hide-ui"
              onClick={() => handleSettingsToggle('hideUIInHologram')}
              className="w-full flex items-center justify-between px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-left text-rose-400 text-xs font-mono transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {settings.hideUIInHologram ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{settings.hideUIInHologram ? 'RESTORE INTERFACE' : 'HIDE CALIBRATION UI'}</span>
              </div>
              <span className="text-[9px] opacity-40 bg-black/40 px-1.5 py-0.5 rounded border border-rose-500/20">
                [TAP GLASS TO ESCAPE]
              </span>
            </button>

            {/* iPad Fullscreen Button */}
            <button
              id="btn-settings-fullscreen"
              onClick={requestToggleFullscreen}
              className="w-full h-10 px-4 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.07] rounded-xl text-xs font-mono text-white transition-all cursor-pointer"
            >
              <Maximize className={`w-4 h-4 ${activeColorBase}`} />
              <span>TOGGLE SAFARI FULLSCREEN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export { SettingsPanel };
