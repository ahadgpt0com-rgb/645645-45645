import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Clip, MediaFile } from '../types/trimmer.ts';
import { clamp, formatTime } from '../utils/time.ts';

interface TimelineProps {
  media: MediaFile;
  currentTime: number;
  startTime: number;
  endTime: number;
  queuedClips: Clip[];
  activeClipId?: string;
  onSeek: (time: number) => void;
  onRangeChange: (start: number, end: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  media,
  currentTime,
  startTime,
  endTime,
  queuedClips,
  activeClipId,
  onSeek,
  onRangeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | 'seek' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragInitialRange, setDragInitialRange] = useState({ start: 0, end: 0 });
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const duration = Math.max(0.1, media.duration);

  // Convert time (seconds) to percentage (0 - 100)
  const timeToPct = useCallback(
    (t: number) => (clamp(t, 0, duration) / duration) * 100,
    [duration]
  );

  // Convert client coordinate X to time in seconds
  const clientXToTime = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clamp(clientX - rect.left, 0, rect.width);
      const ratio = clickX / rect.width;
      return clamp(ratio * duration, 0, duration);
    },
    [duration]
  );

  // Draw waveform / visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const peaks = media.waveformPeaks || [];
    if (peaks.length === 0) {
      // Draw subtle placeholder waveform line
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barWidth = width / peaks.length;
    const startRatio = startTime / duration;
    const endRatio = endTime / duration;

    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = Math.max(4, peak * (height - 12));
      const y = (height - barHeight) / 2;
      const ratio = i / peaks.length;

      const isInSelection = ratio >= startRatio && ratio <= endRatio;

      if (isInSelection) {
        ctx.fillStyle = '#6366F1'; // vibrant indigo for active clip
      } else {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.45)'; // muted slate for inactive
      }

      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1.5, barWidth - 1), barHeight, 1);
      ctx.fill();
    });
  }, [media.waveformPeaks, startTime, endTime, duration]);

  // Handle Dragging
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'start' | 'end' | 'range' | 'seek'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
    setDragStartX(e.clientX);
    setDragInitialRange({ start: startTime, end: endTime });

    if (type === 'seek') {
      const targetTime = clientXToTime(e.clientX);
      onSeek(targetTime);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentMouseTime = clientXToTime(e.clientX);

      if (isDragging === 'seek') {
        onSeek(currentMouseTime);
      } else if (isDragging === 'start') {
        const newStart = Math.min(currentMouseTime, endTime - 0.05);
        onRangeChange(Math.max(0, newStart), endTime);
      } else if (isDragging === 'end') {
        const newEnd = Math.max(currentMouseTime, startTime + 0.05);
        onRangeChange(startTime, Math.min(duration, newEnd));
      } else if (isDragging === 'range') {
        const deltaPx = e.clientX - dragStartX;
        const deltaTime = (deltaPx / rect.width) * duration;
        const clipLength = dragInitialRange.end - dragInitialRange.start;

        let newStart = dragInitialRange.start + deltaTime;
        let newEnd = dragInitialRange.end + deltaTime;

        if (newStart < 0) {
          newStart = 0;
          newEnd = clipLength;
        } else if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - clipLength;
        }

        onRangeChange(newStart, newEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragInitialRange, startTime, endTime, duration, clientXToTime, onRangeChange, onSeek]);

  // Mouse hover timestamp calculation
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    setHoverTime(clientXToTime(e.clientX));
  };

  const handleContainerMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
  };

  // Generate ruler markers
  const renderRulerTicks = () => {
    const ticks = [];
    const stepSec = duration > 180 ? 30 : duration > 40 ? 10 : duration > 10 ? 2 : 1;
    const numTicks = Math.floor(duration / stepSec);

    for (let i = 0; i <= numTicks; i++) {
      const sec = i * stepSec;
      const pct = (sec / duration) * 100;
      // On small screens, hide odd ticks if many ticks exist to avoid text collision
      const isMajor = numTicks > 6 ? (i % 2 === 0) : true;

      ticks.push(
        <div
          key={sec}
          className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
          style={{ left: `${pct}%` }}
        >
          <div className={`w-px bg-slate-700/80 ${isMajor ? 'h-2 bg-slate-500' : 'h-1'}`} />
          <span
            className={`text-[10px] text-slate-400 font-mono -translate-x-1/2 select-none ${
              !isMajor ? 'hidden sm:inline-block' : 'inline-block'
            }`}
          >
            {formatTime(sec, false)}
          </span>
        </div>
      );
    }
    return ticks;
  };

  const startPct = timeToPct(startTime);
  const endPct = timeToPct(endTime);
  const playheadPct = timeToPct(currentTime);

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl select-none">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-slate-300">Interactive Timeline</span>
          <span className="hidden sm:inline text-slate-400">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Clip: {formatTime(startTime, true)} → {formatTime(endTime, true)} ({(endTime - startTime).toFixed(2)}s)
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span>Drag handles or range bar to adjust</span>
        </div>
      </div>

      {/* Timeline Ruler Strip */}
      <div className="relative h-5 w-full mb-1">
        {renderRulerTicks()}
      </div>

      {/* Main Timeline Scrubber Box */}
      <div
        ref={containerRef}
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleContainerMouseLeave}
        onMouseDown={(e) => handleMouseDown(e, 'seek')}
        className="relative h-20 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair group shadow-inner"
      >
        {/* Waveform Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={80}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Existing Queued Clips Markers (showing previously cut segments) */}
        {queuedClips.map((clip) => {
          const cStart = timeToPct(clip.startTime);
          const cEnd = timeToPct(clip.endTime);
          const isSelectedClip = clip.id === activeClipId;
          return (
            <div
              key={clip.id}
              className={`absolute top-0 bottom-0 pointer-events-none opacity-40 border-t-2 border-b-2 ${
                isSelectedClip ? 'opacity-80' : ''
              }`}
              style={{
                left: `${cStart}%`,
                width: `${Math.max(0.5, cEnd - cStart)}%`,
                borderColor: clip.color,
                backgroundColor: clip.color + '22',
              }}
              title={`Clip: ${clip.title}`}
            />
          );
        })}

        {/* Dimmed Inactive Regions (Before Start & After End) */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-slate-950/70 backdrop-blur-[0.5px] pointer-events-none border-r border-indigo-500/40"
          style={{ width: `${startPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-slate-950/70 backdrop-blur-[0.5px] pointer-events-none border-l border-indigo-500/40"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Active Selected Clip Box (Draggable to slide range) */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'range')}
          className="absolute top-0 bottom-0 border-y-2 border-indigo-500 bg-indigo-500/15 cursor-grab active:cursor-grabbing hover:bg-indigo-500/25 transition-colors flex items-center justify-center group/range"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(0.5, endPct - startPct)}%`,
          }}
          title="Drag to slide clip position"
        >
          {/* Subtle Grip lines */}
          <div className="hidden sm:flex items-center gap-0.5 opacity-40 group-hover/range:opacity-90 transition-opacity">
            <div className="w-0.5 h-6 bg-indigo-300 rounded-full" />
            <div className="w-0.5 h-6 bg-indigo-300 rounded-full" />
            <div className="w-0.5 h-6 bg-indigo-300 rounded-full" />
          </div>
        </div>

        {/* Start Marker Handle (Left Bracket) */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'start')}
          className="absolute top-0 bottom-0 -ml-2.5 w-5 flex items-center justify-center cursor-ew-resize z-20 group/handle"
          style={{ left: `${startPct}%` }}
          aria-label="Start Marker Handle"
        >
          <div className="w-3.5 h-16 rounded-md bg-indigo-600 group-hover/handle:bg-indigo-500 border border-indigo-400 shadow-lg shadow-indigo-600/40 flex items-center justify-center transition-all group-hover/handle:scale-105">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* End Marker Handle (Right Bracket) */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'end')}
          className="absolute top-0 bottom-0 -ml-2.5 w-5 flex items-center justify-center cursor-ew-resize z-20 group/handle"
          style={{ left: `${endPct}%` }}
          aria-label="End Marker Handle"
        >
          <div className="w-3.5 h-16 rounded-md bg-indigo-600 group-hover/handle:bg-indigo-500 border border-indigo-400 shadow-lg shadow-indigo-600/40 flex items-center justify-center transition-all group-hover/handle:scale-105">
            <div className="w-0.5 h-4 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* Current Time Playhead Marker */}
        <div
          className="absolute top-0 bottom-0 -ml-px w-0.5 bg-rose-500 z-30 pointer-events-none shadow-sm shadow-rose-500"
          style={{ left: `${playheadPct}%` }}
        >
          {/* Head badge */}
          <div className="w-3 h-3 bg-rose-500 rotate-45 -translate-x-1/2 -translate-y-1 rounded-xs" />
        </div>

        {/* Hover Time Indicator Tooltip */}
        {hoverTime !== null && hoverX !== null && !isDragging && (
          <div
            className="absolute top-1 pointer-events-none z-30 -translate-x-1/2 bg-slate-900 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 shadow-lg"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime, true)}
          </div>
        )}
      </div>
    </div>
  );
};
