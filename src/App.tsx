import React, { useState, useEffect } from 'react';
import { HologramMode, MirrorConfig, HologramSettings, VisualType } from './types';
import MirrorContainer from './components/MirrorContainer';
import { SettingsPanel } from './components/SettingsPanel';
import Dashboard from './components/Dashboard';
import HologramClock from './components/HologramClock';
import StockViewer from './components/StockViewer';
import HologramVisuals from './components/HologramVisuals';
import { Eye, Sliders, Layout, Zap } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<HologramMode>('dashboard');
  const [selectedVisual, setSelectedVisual] = useState<VisualType>('vortex');

  // Calibration and orientation defaults
  const [mirror, setMirror] = useState<MirrorConfig>({
    horizontal: false,
    vertical: false,
    rotate180: false,
    bothAxes: false,
  });

  const [settings, setSettings] = useState<HologramSettings>({
    brightness: 1.0,
    glow: 14,
    contrast: 1.0,
    colorPreset: 'cyan',
    hideUIInHologram: false,
    synthEnabled: false,
    synthVolume: 0.35,
    audioSensitivity: 1.0,
    audioBassResponse: 1.0,
    audioReactionSource: 'procedural',
  });

  const [isIdle, setIsIdle] = useState(false);

  // Screen idle tracking (fades out active controls after 5 seconds when using a screensaver mode)
  useEffect(() => {
    if (currentMode === 'dashboard') {
      setIsIdle(false);
      return;
    }

    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    };

    resetIdleTimer();

    const events = ['touchstart', 'mousedown', 'mousemove', 'click', 'keydown'];
    events.forEach(evt => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    return () => {
      clearTimeout(idleTimer);
      events.forEach(evt => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [currentMode]);

  // Keep screen active by disabling standard iPad OS sleep locks if supported
  useEffect(() => {
    try {
      if ('wakeLock' in navigator) {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
          try {
            wakeLock = await (navigator as any).wakeLock.request('screen');
          } catch (err) {
            console.warn('Wake Lock request fail:', err);
          }
        };
        requestWakeLock();
        return () => {
          if (wakeLock) wakeLock.release();
        };
      }
    } catch (e) {
      console.warn('Wake Lock API not supported context: ', e);
    }
  }, []);

  const handleModeChange = (mode: HologramMode) => {
    setCurrentMode(mode);
  };

  const handleVisualChange = (visual: VisualType) => {
    setSelectedVisual(visual);
  };

  const handleMirrorChange = (newMirror: MirrorConfig) => {
    setMirror(newMirror);
  };

  const handleSettingsChange = (newSettings: HologramSettings) => {
    setSettings(newSettings);
  };

  // Trigger escape layout from fullscreen black screen when tapping background
  const handleWorkspaceTap = () => {
    if (settings.hideUIInHologram) {
      setSettings((prev) => ({
        ...prev,
        hideUIInHologram: false,
      }));
    }
  };

  const renderActiveModeContent = () => {
    switch (currentMode) {
      case 'dashboard':
        return (
          <Dashboard
            onModeChange={handleModeChange}
            onVisualChange={handleVisualChange}
            colorPreset={settings.colorPreset}
          />
        );
      case 'clock':
        return <HologramClock glow={settings.glow} isIdle={isIdle} />;
      case 'stocks':
        return <StockViewer glow={settings.glow} isIdle={isIdle} />;
      case 'visuals':
        return (
          <HologramVisuals
            currentVisual={selectedVisual}
            colorPreset={settings.colorPreset}
            glow={settings.glow}
            onVisualChange={handleVisualChange}
            audioSensitivity={settings.audioSensitivity}
            audioBassResponse={settings.audioBassResponse}
            audioReactionSource={settings.audioReactionSource}
            isIdle={isIdle}
          />
        );
      default:
        return (
          <Dashboard
            onModeChange={handleModeChange}
            onVisualChange={handleVisualChange}
            colorPreset={settings.colorPreset}
          />
        );
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* Hologram Transformer Screen Section */}
      <div 
        className="w-full h-full cursor-pointer"
        onClick={handleWorkspaceTap}
      >
        <MirrorContainer mirror={mirror} settings={settings}>
          {renderActiveModeContent()}
        </MirrorContainer>
      </div>

      {/* Floating Global Utility HUD Bar (Hidden in HideUI Mode) */}
      {!settings.hideUIInHologram && (
        <div className={`fixed bottom-4 left-4 z-40 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-3 transition-opacity duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button
            id="btn-app-hud-panel"
            onClick={() => setCurrentMode('dashboard')}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              currentMode === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            title="Return to Hub Control"
          >
            <Layout className="w-4 h-4" />
          </button>
          
          <div className="w-[1px] h-4 bg-white/10" />

          {/* Quick HUD Preset selection labels */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
            <span>MODE:</span>
            <span className="text-cyan-400 capitalize bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/15">
              {currentMode === 'dashboard' ? 'LANDING DOCK' : currentMode}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Warning notice about reflecting screen */}
          <div className="hidden md:flex items-center gap-1 text-[9px] font-mono text-white/30">
            <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>ALIGN MIRROR FACING THE GLASS PYRAMID SETUP</span>
          </div>
        </div>
      )}

      {/* Custom Calibration Settings Drawer Dock */}
      <div className={`transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <SettingsPanel
          mirror={mirror}
          settings={settings}
          currentMode={currentMode}
          selectedVisual={selectedVisual}
          onMirrorChange={handleMirrorChange}
          onSettingsChange={handleSettingsChange}
          onModeChange={handleModeChange}
          onVisualChange={handleVisualChange}
        />
      </div>

      {/* Extreme Pure Black overlay instructions indicator when hiding control tools */}
      {settings.hideUIInHologram && (
        <div className="fixed top-4 left-4 z-50 pointer-events-none bg-black/80 border border-white/10 px-4 py-2 rounded-xl animate-bounce">
          <p className="text-[10px] font-mono text-rose-400/80 tracking-widest uppercase">
            [ HUD CALIBRATION HIDDEN // TAP GLASS TO RENDER BAR ]
          </p>
        </div>
      )}
    </div>
  );
}
export { App };
