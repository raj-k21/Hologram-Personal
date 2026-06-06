import React, { useState, useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight, Rotate3d, Compass } from 'lucide-react';

interface HologramClockProps {
  glow: number;
  isIdle?: boolean;
}

export default function HologramClock({ glow, isIdle = false }: HologramClockProps) {
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tick the clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 100); // 10 ticks per sec for instant responsiveness
    return () => clearInterval(timer);
  }, []);

  // Format Helper
  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    let ampm = '';

    if (!is24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
    }

    const hrs = hours.toString().padStart(2, '0');
    return { hrs, minutes, seconds, ampm };
  };

  const { hrs, minutes, seconds, ampm } = formatTime();

  // Date formatted nicely
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  // 3D holographic canvas effect representing floating strings in orbital space
  useEffect(() => {
    if (!is3DMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      // Brief delay for mobile Safari / Chrome viewport layout settle
      setTimeout(() => {
        width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    // Trigger once instantly
    handleResize();

    // Particle nodes floating behind clock
    interface Point {
      x: number;
      y: number;
      z: number;
      char: string;
      color: string;
    }
    
    const points: Point[] = [];
    const textOptions = ['0', '1', 'CLOCK', 'HUD', 'SEC', 'UTC', 'SYS', 'SYNC'];

    for (let i = 0; i < 50; i++) {
      points.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        z: Math.random() * 800 - 400,
        char: textOptions[Math.floor(Math.random() * textOptions.length)],
        color: Math.random() > 0.4 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(244, 63, 94, 0.3)',
      });
    }

    let angleY = 0;
    let angleX = 0;

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.lineWidth = 1;
      const numLines = 20;
      for (let i = 0; i <= numLines; i++) {
        const xNow = (width / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(xNow, 0);
        ctx.lineTo(xNow, height);
        ctx.stroke();

        const yNow = (height / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, yNow);
        ctx.lineTo(width, yNow);
        ctx.stroke();
      }

      angleY += 0.005;
      angleX += 0.002;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Sort points back to front by z coordinate
      const projected = points.map(p => {
        // Rotate around Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate around X
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Perspective projection
        const scaleRef = 400 / (400 + z2);
        const screenX = width / 2 + x1 * scaleRef;
        const screenY = height / 2 + y1 * scaleRef;

        return { screenX, screenY, scaleRef, color: p.color, char: p.char, z2 };
      });

      projected.sort((a, b) => b.z2 - a.z2);

      projected.forEach(p => {
        if (p.scaleRef < 0) return;
        ctx.fillStyle = p.color;
        ctx.font = `${Math.floor(12 * p.scaleRef)}px Courier New`;
        ctx.fillText(p.char, p.screenX, p.screenY);
      });

      // Render the floating central clock in 3D perspective space
      const focalScale = 500 / (500 + Math.sin(angleY) * 100);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.sin(angleY * 0.5) * 0.1);
      ctx.scale(focalScale, focalScale);

      // Glow setting
      ctx.shadowBlur = document.documentElement.classList.contains('harmonyos-optimized') ? 0 : glow;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 80px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mainStr = `${hrs}:${minutes}:${seconds}${ampm}`;
      ctx.fillText(mainStr, 0, -20);

      // Date in sub 3D
      ctx.font = '20px "Courier New", monospace';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.fillText(formattedDate, 0, 40);

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [is3DMode, hrs, minutes, seconds, ampm, glow, formattedDate]);

  return (
    <div id="hologram-clock-screen" className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden">
      
      {/* Sleek Interface Top HUD Bar */}
      <header className={`flex items-center justify-between px-8 py-5 border-b border-white/10 backdrop-blur-md bg-black/40 z-20 transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <h1 className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-red-500 font-mono">
            Projector Mode: Active
          </h1>
        </div>
        <div className="flex items-center gap-6 md:gap-8">
          <div className="hidden sm:block text-[9px] md:text-[10px] tracking-widest text-white/40 uppercase font-medium font-mono">
            System: Stable
          </div>
          <div className="text-[9px] md:text-[10px] tracking-widest text-white/40 uppercase font-medium font-mono">
            Output: 4K Mirror Enabled
          </div>
        </div>
      </header>

      {/* 3D Canvas Background & Projection */}
      {is3DMode && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        
        {/* Static LED Glow Elements (Optimized 2D Mode) */}
        {!is3DMode && (
          <div className="flex flex-col items-center text-center">
            
            {/* The Huge LED Clock Display */}
            <div 
              className="text-[clamp(2.5rem,11.5vw,9.5rem)] sm:text-[clamp(4.5rem,14vw,11rem)] md:text-[clamp(6rem,14vw,11.5rem)] lg:text-[11.5rem] leading-none font-mono font-black text-red-600 tracking-tighter select-none flex items-baseline justify-center"
              style={{ filter: document.documentElement.classList.contains('harmonyos-optimized') ? 'none' : `drop-shadow(0 0 ${glow + 10}px rgba(220, 38, 38, 0.85))` }}
            >
              <span>{hrs}</span>
              <span className="animate-pulse mx-1">:</span>
              <span>{minutes}</span>
              <span className="animate-pulse mx-1">:</span>
              <span className="text-red-500/90">{seconds}</span>
              {!is24Hour && (
                <span className="text-2xl md:text-4xl text-red-500/70 font-semibold tracking-wider ml-3 select-none">
                  {ampm.trim()}
                </span>
              )}
            </div>

            {/* Decorative subrow matching Sleek Interface design */}
            <div className="mt-6 flex flex-wrap gap-4 md:gap-6 items-center justify-center">
              <span className="text-red-500/70 font-mono text-sm md:text-xl tracking-[0.2em] uppercase">
                {formattedDate}
              </span>
              <span className="h-[2px] w-8 md:w-12 bg-red-600/30" />
              <span className="text-red-500/70 font-mono text-sm md:text-xl tracking-[0.2em] uppercase">
                GMT {time.toTimeString().split(' ')[1] || 'UTC'}
              </span>
            </div>

            {/* Micro-coordinate indicator tag */}
            <div className="mt-8 flex items-center gap-2.5 text-[10px] font-mono text-white/20 select-none">
              <span>COORD: PR_SYS_ACC</span>
              <span className="w-1.5 h-1.5 bg-red-600/60 rounded-full animate-ping" />
              <span>STABILIZED REFERENCE POINT</span>
            </div>

          </div>
        )}
      </main>

      {/* Bottom Visual Feedback Labels */}
      <div className={`absolute left-8 bottom-8 flex flex-col gap-1 z-20 pointer-events-none select-none text-left transition-opacity duration-500 ${isIdle ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-[9px] font-mono text-white/25">GPU_LOAD: 12%</div>
        <div className="text-[9px] font-mono text-white/25">REFRESH_RATE: 120HZ</div>
        <div className="text-[9px] font-mono text-white/25">LATENCY: 1.1MS</div>
      </div>

      {/* Clock Controls HUD Bar (Visible, floats elegantly at the bottom) */}
      <div className={`absolute bottom-6 right-8 z-30 flex items-center gap-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* format toggle */}
        <button
          id="btn-clock-format-toggle"
          onClick={() => setIs24Hour(!is24Hour)}
          className="flex items-center gap-2 hover:opacity-80 transition-all text-[10px] font-mono tracking-widest text-red-500 uppercase cursor-pointer"
        >
          {is24Hour ? (
            <ToggleRight className="w-4 h-4 text-red-600" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-red-600/50" />
          )}
          <span>{is24Hour ? '24H' : '12H'}</span>
        </button>

        <div className="w-[1px] h-3 bg-white/10" />

        {/* 3D Mode Toggle */}
        <button
          id="btn-clock-3d-toggle"
          onClick={() => setIs3DMode(!is3DMode)}
          className="flex items-center gap-2 hover:opacity-80 transition-all text-[10px] font-mono tracking-widest text-red-500 uppercase cursor-pointer"
        >
          {is3DMode ? (
            <Rotate3d className="w-4 h-4 text-red-600" />
          ) : (
            <Compass className="w-4 h-4 text-red-600/50" />
          )}
          <span>{is3DMode ? '3D MATRIX' : '2D LED'}</span>
        </button>
      </div>
    </div>
  );
}
