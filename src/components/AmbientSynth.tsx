import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music, Zap } from 'lucide-react';

interface AmbientSynthProps {
  enabled: boolean;
  volume: number;
  onToggle: (enabled: boolean) => void;
  onVolumeChange: (vol: number) => void;
}

export default function AmbientSynth({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: AmbientSynthProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Oscillators and Filters for the drone synth
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Web Audio
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Filter with resonance for sci-fi sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);
      filter.connect(masterGain);
      filterRef.current = filter;

      // Heavy low frequency drone (Osc 1 - Sawtooth)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(filter);
      osc1Ref.current = osc1;

      // Harmony drone (Osc 2 - Triangle, detuned)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(82.41, ctx.currentTime); // E2 note (Fifth)
      osc2.detune.setValueAtTime(12, ctx.currentTime); // slightly detuned
      
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.4, ctx.currentTime);
      osc2.connect(gain2);
      gain2.connect(filter);
      osc2Ref.current = osc2;

      // LFO to slowly sweep the filter frequency
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // extremely slow (12.5s cycle)

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(150, ctx.currentTime); // modulation depth

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // modulate lowpass cutoff
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;

      // Start all sound generations
      osc1.start();
      osc2.start();
      lfo.start();
      setIsPlaying(true);
    } catch (e) {
      console.error("Web Audio API not supported or error initializing: ", e);
    }
  };

  // Handle Play/Stop transitions
  useEffect(() => {
    if (enabled) {
      if (!audioCtxRef.current) {
        initAudio();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => setIsPlaying(true));
      } else {
        setIsPlaying(true);
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().then(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    }
  }, [enabled]);

  // Handle volume changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(
        volume * 0.15,
        audioCtxRef.current.currentTime + 0.1
      );
    }
  }, [volume]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (osc1Ref.current) {
        try { osc1Ref.current.stop(); } catch(e) {}
      }
      if (osc2Ref.current) {
        try { osc2Ref.current.stop(); } catch(e) {}
      }
      if (lfoRef.current) {
        try { lfoRef.current.stop(); } catch(e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const triggerTapActivate = () => {
    if (!audioCtxRef.current) {
      initAudio();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    onToggle(!enabled);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className={`w-4 h-4 text-cyan-400 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/80">
            Ambient Synth (Generator)
          </span>
        </div>
        <button
          id="btn-toggle-synth"
          onClick={triggerTapActivate}
          className={`px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded border transition-all duration-300 ${
            enabled
              ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400 font-bold shadow-[0_0_12px_rgba(34,211,238,0.25)]'
              : 'border-white/10 text-white/50 hover:bg-white/5'
          }`}
        >
          {enabled ? 'DRONE LIVE' : 'ACTIVATE'}
        </button>
      </div>

      {enabled && (
        <div className="flex items-center gap-3 mt-1">
          <button
            id="btn-volume-mute"
            onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
            className="p-1 rounded text-white/60 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40">MIN</span>
            <input
              id="slider-synth-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 h-1 rounded bg-white/10 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
      <div className="text-[10px] text-white/40 font-mono flex items-center gap-1 leading-tight">
        <Zap className="w-3 h-3 text-amber-400 animate-pulse flex-shrink-0" />
        <span>Synthesized procedural pad in real-time. Designed to reflect cleanly on Pepper's Ghost projectors.</span>
      </div>
    </div>
  );
}
