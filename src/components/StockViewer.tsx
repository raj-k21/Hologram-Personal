import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2, BarChart2, Eye } from 'lucide-react';
import { StockData } from '../types';

interface StockViewerProps {
  glow: number;
  isIdle?: boolean;
}

// Pre-seeded template generator for stable price movements
const initialStockTemplates: Record<string, { name: string; basePrice: number; volatility: number }> = {
  AAPL: { name: 'Apple Inc.', basePrice: 175.50, volatility: 0.015 },
  TSLA: { name: 'Tesla Inc.', basePrice: 220.80, volatility: 0.04 },
  NVDA: { name: 'NVIDIA Corp.', basePrice: 880.20, volatility: 0.035 },
  RELIANCE: { name: 'Reliance Industries', basePrice: 2450.00, volatility: 0.012 },
  TCS: { name: 'Tata Consultancy', basePrice: 3820.00, volatility: 0.01 },
  BTC: { name: 'Bitcoin / USD', basePrice: 67200.00, volatility: 0.06 },
  ETH: { name: 'Ethereum / USD', basePrice: 3450.00, volatility: 0.05 },
};

export default function StockViewer({ glow, isIdle = false }: StockViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTicker, setCurrentTicker] = useState('NVDA');
  const [activeStock, setActiveStock] = useState<StockData | null>(null);
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // ranges from 0.5 to 2.0
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startDragX = useRef(0);

  // Seed / Generate Stock History data
  const generateStockData = (ticker: string, numPoints = 80): StockData => {
    const uppercaseTicker = ticker.toUpperCase().trim() || 'COIN';
    const temp = initialStockTemplates[uppercaseTicker] || {
      name: `${uppercaseTicker} Asset Group`,
      basePrice: Math.random() * 450 + 50,
      volatility: 0.02 + Math.random() * 0.03,
    };

    let price = temp.basePrice;
    const history: StockData['history'] = [];
    const timestampStep = 5 * 60 * 1000; // 5-minute ticks
    let now = Date.now() - numPoints * timestampStep;

    for (let i = 0; i < numPoints; i++) {
      const changePercent = (Math.random() - 0.495) * temp.volatility;
      const open = price;
      price = price * (1 + changePercent);
      const close = price;

      const spread = price * (Math.random() * 0.5 * temp.volatility);
      const high = Math.max(open, close) + spread;
      const low = Math.min(open, close) - spread * (0.8 + Math.random() * 0.4);
      const volume = Math.floor(10000 + Math.random() * 900000);

      history.push({
        time: now,
        open,
        high,
        low,
        close,
        volume,
      });

      now += timestampStep;
    }

    const firstPrice = history[0].open;
    const lastPrice = history[history.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      ticker: uppercaseTicker,
      name: temp.name,
      price: lastPrice,
      change,
      changePercent,
      history,
    };
  };

  // Initial Seed
  useEffect(() => {
    const data = generateStockData(currentTicker);
    setActiveStock(data);
  }, [currentTicker]);

  // Live Auto-Refresh ticker mimicking market action every 1.5s
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setActiveStock(prev => {
        if (!prev) return null;

        const uppercaseTicker = prev.ticker.toUpperCase();
        const temp = initialStockTemplates[uppercaseTicker] || {
          name: prev.name,
          basePrice: prev.price,
          volatility: 0.02,
        };

        const tickChange = (Math.random() - 0.495) * temp.volatility * 0.25;
        const currentPrice = prev.price * (1 + tickChange);
        
        // Append or edit last history block, keeping the chart active
        const updatedHistory = [...prev.history];
        const lastIndex = updatedHistory.length - 1;
        const lastCandle = updatedHistory[lastIndex];

        // Partially mutate last candle or make a new one dynamically
        if (Math.random() > 0.85) {
          // Add new candle
          updatedHistory.shift();
          updatedHistory.push({
            time: Date.now(),
            open: lastCandle.close,
            high: Math.max(lastCandle.close, currentPrice) + (currentPrice * 0.002),
            low: Math.min(lastCandle.close, currentPrice) - (currentPrice * 0.002),
            close: currentPrice,
            volume: Math.floor(50000 + Math.random() * 100000),
          });
        } else {
          // Mutate the final candle representing live updates
          updatedHistory[lastIndex] = {
            ...lastCandle,
            high: Math.max(lastCandle.high, currentPrice),
            low: Math.min(lastCandle.low, currentPrice),
            close: currentPrice,
          };
        }

        const firstPrice = updatedHistory[0].open;
        const finalChange = currentPrice - firstPrice;
        const finalPercent = (finalChange / firstPrice) * 100;

        return {
          ...prev,
          price: currentPrice,
          change: finalChange,
          changePercent: finalPercent,
          history: updatedHistory,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Search Submit Handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setCurrentTicker(searchTerm.toUpperCase());
    setSearchTerm('');
    setDragOffset(0);
  };

  // Rendering vector logic into index-drawing canvas
  useEffect(() => {
    if (!activeStock || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderChart = () => {
      if (!canvas || !canvas.parentElement) return;
      let width = (canvas.width = canvas.parentElement.clientWidth || 700);
      let height = (canvas.height = canvas.parentElement.clientHeight || 400);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const history = activeStock.history;
      if (history.length === 0) return;

      // View bounds configuration
      const paddingLeft = 10;
      const paddingRight = 65;
      const paddingTop = 40;
      const paddingBottom = 40;

      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;

      // Calculate dynamic Candle slicing based on zoom
      const originalCandleCount = history.length;
      const visibleCandleCount = Math.max(
        15,
        Math.min(originalCandleCount, Math.round(originalCandleCount / zoomLevel))
      );

      // Apply swipe index offsets
      const deltaIndex = Math.round(dragOffset / (chartWidth / visibleCandleCount));
      let startIndex = Math.max(0, originalCandleCount - visibleCandleCount - deltaIndex);
      let endIndex = Math.min(originalCandleCount, startIndex + visibleCandleCount);

      if (startIndex === 0) {
        endIndex = Math.min(originalCandleCount, visibleCandleCount);
      }
      if (endIndex === originalCandleCount) {
        startIndex = Math.max(0, originalCandleCount - visibleCandleCount);
      }

      const visibleSegment = history.slice(startIndex, endIndex);
      if (visibleSegment.length === 0) return;

      // Highest/Lowest in current focus slice to size vertical resolution
      const highPrices = visibleSegment.map(c => c.high);
      const lowPrices = visibleSegment.map(c => c.low);
      const maxVal = Math.max(...highPrices) * 1.002;
      const minVal = Math.min(...lowPrices) * 0.998;
      const valRange = maxVal - minVal;

      // Mapping vectors to screen coordinates
      const getX = (index: number) => {
        const step = chartWidth / (visibleSegment.length - 1);
        return paddingLeft + index * step;
      };

      const getY = (price: number) => {
        return paddingTop + chartHeight - ((price - minVal) / valRange) * chartHeight;
      };

      // Draw coordinate Grid Lines with glows
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const gridY = paddingTop + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, gridY);
        ctx.lineTo(width - paddingRight, gridY);
        ctx.stroke();

        // Right axis labels
        const gridVal = maxVal - (valRange / 4) * i;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(gridVal.toFixed(2), width - paddingRight + 5, gridY + 3);
      }

      // Drawing of historical trends
      if (chartMode === 'line') {
        // Connect line nodes beautifully with high-contrast Cyan
        ctx.shadowBlur = glow;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.7)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(getX(0), getY(visibleSegment[0].close));
        for (let i = 1; i < visibleSegment.length; i++) {
          ctx.lineTo(getX(i), getY(visibleSegment[i].close));
        }
        ctx.stroke();

        // Create glowing neon gradient fills under the trend line
        ctx.shadowBlur = 0; // Turn off shadows during alpha fills to save CPU
        const fillGlow = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
        fillGlow.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
        fillGlow.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
        ctx.fillStyle = fillGlow;
        ctx.lineTo(getX(visibleSegment.length - 1), paddingTop + chartHeight);
        ctx.lineTo(getX(0), paddingTop + chartHeight);
        ctx.closePath();
        ctx.fill();
      } else {
        // Candlestick rendering logic
        const step = chartWidth / visibleSegment.length;
        const candleWidth = step * 0.7;

        visibleSegment.forEach((candle, idx) => {
          const x = paddingLeft + idx * step + step * 0.15;
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);

          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#22c55e' : '#ef4444'; // Bright green or bright red
          const glowColor = isGreen ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)';

          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 1.5;

          // Draw shadow glow for holographic Pepper's ghost high contrast
          ctx.shadowBlur = Math.min(glow / 1.5, 8); // clamp canvas glow to optimize memory
          ctx.shadowColor = glowColor;

          // Draw Wick
          ctx.beginPath();
          ctx.moveTo(x + candleWidth / 2, yHigh);
          ctx.lineTo(x + candleWidth / 2, yLow);
          ctx.stroke();

          // Draw Candle Body
          const top = Math.min(yOpen, yClose);
          const bh = Math.max(2, Math.abs(yClose - yOpen));
          ctx.fillRect(x, top, candleWidth, bh);
        });
        ctx.shadowBlur = 0; // reset
      }

      // Render horizontal timeline stamps at bottom
      ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.font = '8px "JetBrains Mono", monospace';
      const totalVisible = visibleSegment.length;
      const intervalTicks = Math.floor(totalVisible / 4);

      for (let idx = 0; idx < totalVisible; idx += intervalTicks) {
        if (idx >= totalVisible) break;
        const xPos = getX(idx);
        const timeStr = new Date(visibleSegment[idx].time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        ctx.fillText(timeStr, xPos - 12, height - paddingBottom + 20);
      }
    };

    renderChart();

    const handleResize = () => {
      setTimeout(renderChart, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeStock, chartMode, zoomLevel, dragOffset, glow]);

  // Gestures for dragging / Swipe action to pan chart history
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    startDragX.current = e.clientX - dragOffset;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const delta = e.clientX - startDragX.current;
    setDragOffset(delta);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch Support for iPad
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      startDragX.current = e.touches[0].clientX - dragOffset;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const delta = e.touches[0].clientX - startDragX.current;
    setDragOffset(delta);
  };

  const isPositive = activeStock ? activeStock.changePercent >= 0 : true;

  return (
    <div
      ref={containerRef}
      id="stock-viewer-hud"
      className={`relative w-full h-full bg-black flex flex-col justify-between overflow-hidden p-6 select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Top Search bar and Stock Quick Badges */}
      <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-cyan-500/10 pb-5 z-20 transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Ticker Selector details */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full border border-cyan-500/25 flex items-center justify-center bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-[pulse_3s_infinite]">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-black tracking-widest text-cyan-400">
                {activeStock?.ticker || '...'}
              </span>
              <span className="text-xs bg-cyan-950/40 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/20">
                LIVE HUDFEED
              </span>
            </div>
            <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
              {activeStock?.name || 'Loading aggregate metadata...'}
            </p>
          </div>
        </div>

        {/* Input Search Block */}
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-cyan-500 transition-all w-full max-w-[280px]">
          <Search className="w-4 h-4 text-white/40 mr-2" />
          <input
            id="input-ticker-search"
            type="text"
            placeholder="Search AAPL, BTC, TCS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-white/30 text-xs font-mono focus:outline-none w-full uppercase"
          />
        </form>

        {/* Action Widgets */}
        <div className="flex items-center gap-2">
          {Object.keys(initialStockTemplates).map((tk) => (
            <button
              id={`quick-ticker-${tk}`}
              key={tk}
              onClick={() => {
                setCurrentTicker(tk);
                setDragOffset(0);
              }}
              className={`px-2.5 py-1 text-[10px] font-mono rounded tracking-widest uppercase border cursor-pointer transition-all ${
                currentTicker === tk
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                  : 'bg-transparent text-white/50 border-white/5 hover:border-white/20'
              }`}
            >
              {tk}
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph Grid Core */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 py-6 overflow-hidden">
        
        {/* Left Side Quote stats */}
        <div className={`w-full md:w-[220px] bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col justify-between gap-4 backdrop-blur-md transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">LAST TRANSACTION PRICE</span>
            <div 
              className={`text-4xl font-mono font-black tracking-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}
              style={{ filter: `drop-shadow(0 0 ${glow / 2}px ${isPositive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'})` }}
            >
              ${activeStock?.price.toFixed(2) || '0.00'}
            </div>
            
            <div className={`flex items-center gap-1.5 font-mono text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{activeStock?.change.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{activeStock?.changePercent.toFixed(2)}%)</span>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Aggregate HUD stats */}
          <div className="flex flex-col gap-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-white/40 text-[10px]">COORDINATE REF:</span>
              <span className="text-white/80">STOCK_INDEX_A2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-[10px]">TIME FRAME:</span>
              <span className="text-white/80">5M RECURRENT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-[10px]">VOLUME SYNC:</span>
              <span className="text-white/80 text-[10px]">
                {((activeStock?.history[activeStock.history.length - 1]?.volume || 0) / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-[10px]">HOST ACCURACY:</span>
              <span className="text-emerald-400">OPTIMAL</span>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Chart format togglers */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-mono text-white/40 tracking-wider">CHART FORMATTING</span>
            <div className="flex rounded bg-black/60 p-1 border border-white/5">
              <button
                id="btn-chart-mode-candle"
                onClick={() => setChartMode('candle')}
                className={`flex-1 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  chartMode === 'candle' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-white/40 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>CANDLES</span>
              </button>
              <button
                id="btn-chart-mode-line"
                onClick={() => setChartMode('line')}
                className={`flex-1 py-1.5 text-[10px] font-mono tracking-widest uppercase rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  chartMode === 'line' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-white/40 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>LINE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Draggable Canvas Grid */}
        <div className="flex-1 bg-black rounded-xl border border-white/5 overflow-hidden flex flex-col relative">
          
          {/* Swipe Indicator Overlay */}
          <div className={`absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 bg-black/70 border border-white/5 rounded-full px-3 py-1 text-[9px] font-mono text-white/40 transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <span>[ SWIPE GRAPH TO PAN HISTORY ]</span>
          </div>

          <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Bottom Graph utilities: Zoom level slider */}
          <div className={`bg-white/[0.02] border-t border-white/5 px-4 py-2 flex items-center justify-between transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">ZOOM:</span>
              <button
                id="btn-zoom-out"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                className="p-1 rounded text-white/60 hover:text-cyan-400 hover:bg-white/5 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                id="slider-zoom-stock"
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 h-1 rounded bg-white/10"
              />
              <button
                id="btn-zoom-in"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                className="p-1 rounded text-white/60 hover:text-cyan-400 hover:bg-white/5 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
              <button
                id="btn-auto-refresh-toggle"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${autoRefresh ? 'text-cyan-400' : ''}`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                <span>{autoRefresh ? 'AUTO TICK LIVE' : 'SYNC PAUSED'}</span>
              </button>

              <button
                id="btn-chart-expand"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
