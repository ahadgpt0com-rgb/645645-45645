import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Plus,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { formatTime, parseTime, clamp } from '../utils/time.ts';

interface PrecisionControlsProps {
  currentTime: number;
  startTime: number;
  endTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onSetStartTime: (time: number) => void;
  onSetEndTime: (time: number) => void;
  onAddClip: (title: string) => void;
  existingClipCount: number;
}

export const PrecisionControls: React.FC<PrecisionControlsProps> = ({
  currentTime,
  startTime,
  endTime,
  duration,
  onSeek,
  onSetStartTime,
  onSetEndTime,
  onAddClip,
  existingClipCount,
}) => {
  const [startInput, setStartInput] = useState(formatTime(startTime, true));
  const [endInput, setEndInput] = useState(formatTime(endTime, true));
  const [clipTitle, setClipTitle] = useState(`Clip ${existingClipCount + 1}`);

  // Sync external changes into inputs
  useEffect(() => {
    setStartInput(formatTime(startTime, true));
  }, [startTime]);

  useEffect(() => {
    setEndInput(formatTime(endTime, true));
  }, [endTime]);

  useEffect(() => {
    setClipTitle(`Clip ${existingClipCount + 1}`);
  }, [existingClipCount]);

  // Frame step handler
  const stepTime = (delta: number) => {
    const nextTime = clamp(currentTime + delta, 0, duration);
    onSeek(nextTime);
  };

  // Input blur/commit handlers
  const handleStartCommit = () => {
    const parsed = parseTime(startInput);
    if (!isNaN(parsed)) {
      const validStart = clamp(parsed, 0, endTime - 0.05);
      onSetStartTime(validStart);
      setStartInput(formatTime(validStart, true));
    } else {
      setStartInput(formatTime(startTime, true));
    }
  };

  const handleEndCommit = () => {
    const parsed = parseTime(endInput);
    if (!isNaN(parsed)) {
      const validEnd = clamp(parsed, startTime + 0.05, duration);
      onSetEndTime(validEnd);
      setEndInput(formatTime(validEnd, true));
    } else {
      setEndInput(formatTime(endTime, true));
    }
  };

  const handleAddClipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClip(clipTitle);
  };

  const clipDuration = Math.max(0, endTime - startTime);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Precision Frame-by-Frame & Instant In/Out Buttons (8 cols on lg) */}
      <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">
              Frame-by-Frame Precision Scrubbing
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Current: {formatTime(currentTime, true)}
            </span>
          </div>

          {/* Stepping Buttons */}
          <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => stepTime(-1)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step backward 1 second"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span>-1.0s</span>
            </button>

            <button
              type="button"
              onClick={() => stepTime(-0.1)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step backward 0.1 second"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>-0.1s</span>
            </button>

            <button
              type="button"
              onClick={() => stepTime(-0.033)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step backward 1 frame (~30fps)"
            >
              <span>-1 frame</span>
            </button>

            <button
              type="button"
              onClick={() => stepTime(0.033)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step forward 1 frame (~30fps)"
            >
              <span>+1 frame</span>
            </button>

            <button
              type="button"
              onClick={() => stepTime(0.1)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step forward 0.1 second"
            >
              <span>+0.1s</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => stepTime(1)}
              className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
              title="Step forward 1 second"
            >
              <span>+1.0s</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Set Start / Set End Instant Markers */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onSetStartTime(currentTime)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-indigo-950/50 hover:text-indigo-200 hover:border-indigo-500/50 text-slate-200 border border-slate-700/80 transition-all font-medium text-xs cursor-pointer group"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Set Start at Playhead [I]</span>
          </button>

          <button
            type="button"
            onClick={() => onSetEndTime(currentTime)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-indigo-950/50 hover:text-indigo-200 hover:border-indigo-500/50 text-slate-200 border border-slate-700/80 transition-all font-medium text-xs cursor-pointer group"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Set End at Playhead [O]</span>
          </button>
        </div>
      </div>

      {/* Precision Timestamp Inputs & Add-To-Queue (5 cols on lg) */}
      <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">
              Precise Timestamp Markers
            </span>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono font-medium">
              <span>Duration:</span>
              <span className="bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                {clipDuration.toFixed(3)}s
              </span>
            </div>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Start Timestamp (HH:MM:SS.ms)
              </label>
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={handleStartCommit}
                onKeyDown={(e) => e.key === 'Enter' && handleStartCommit()}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="00:00:00.000"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                End Timestamp (HH:MM:SS.ms)
              </label>
              <input
                type="text"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={handleEndCommit}
                onKeyDown={(e) => e.key === 'Enter' && handleEndCommit()}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="00:00:00.000"
              />
            </div>
          </div>
        </div>

        {/* Add To Queue form */}
        <form onSubmit={handleAddClipSubmit} className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <input
            type="text"
            value={clipTitle}
            onChange={(e) => setClipTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Clip Title (e.g., Intro Hook)"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Queue</span>
          </button>
        </form>
      </div>
    </div>
  );
};
