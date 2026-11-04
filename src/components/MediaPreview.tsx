import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Repeat,
  Gauge,
  Film,
  Music,
} from 'lucide-react';
import { MediaFile } from '../types/trimmer.ts';
import { formatTime } from '../utils/time.ts';

interface MediaPreviewProps {
  media: MediaFile;
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  isLoopClip: boolean;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onToggleLoopClip: () => void;
  onSeek: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  currentTime,
  startTime,
  endTime,
  isPlaying,
  isLoopClip,
  onTimeUpdate,
  onTogglePlay,
  onToggleLoopClip,
  onSeek,
  videoRef,
  audioRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const isVideo = media.type === 'video';

  // Sync volume & playback rate to active media element
  useEffect(() => {
    const el = isVideo ? videoRef.current : audioRef.current;
    if (el) {
      el.volume = isMuted ? 0 : volume;
      el.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate, isVideo, videoRef, audioRef]);

  // Handle Loop active clip boundaries
  useEffect(() => {
    if (isLoopClip) {
      if (currentTime >= endTime || currentTime < startTime) {
        onSeek(startTime);
      }
    }
  }, [currentTime, isLoopClip, startTime, endTime, onSeek]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col"
    >
      {/* Media Display Viewport */}
      <div className="relative w-full bg-slate-950 flex items-center justify-center min-h-[260px] sm:min-h-[380px] max-h-[500px] overflow-hidden select-none">
        {isVideo ? (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full max-h-[500px] object-contain cursor-pointer"
            onClick={onTogglePlay}
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            playsInline
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center py-12 px-6">
            <audio
              ref={audioRef}
              src={media.url}
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            />
            <div className="w-24 h-24 rounded-3xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/50">
              <Music className={`w-12 h-12 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1 max-w-md truncate text-center">
              {media.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Stereo Audio Track</span>
              <span>·</span>
              <span>{formatTime(media.duration, false)}</span>
            </div>
          </div>
        )}

        {/* Floating Quick Play/Pause Overlay indicator when clicking */}
        <div
          onClick={onTogglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors cursor-pointer group"
        >
          <div
            className={`w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all ${
              isPlaying ? 'opacity-0 group-hover:opacity-100 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Clip Loop Active Badge */}
        {isLoopClip && (
          <div className="absolute top-3 left-3 bg-indigo-900/80 backdrop-blur-md border border-indigo-500/40 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] font-medium text-indigo-200 shadow-md">
            <Repeat className="w-3 h-3 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Looping Clip Range</span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playback toggles & Timecode */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeek(startTime)}
            title="Jump to Start Marker (I)"
            aria-label="Jump to Start Marker"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Timecode Readout */}
          <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800">
            <span className="text-white font-semibold">
              {formatTime(currentTime, true)}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">
              {formatTime(media.duration, true)}
            </span>
          </div>
        </div>

        {/* Right: Loop clip, Speed, Volume, Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Loop Clip Toggle */}
          <button
            type="button"
            onClick={onToggleLoopClip}
            title={isLoopClip ? 'Disable Loop Clip' : 'Loop active clip range continuously'}
            aria-label={isLoopClip ? 'Disable Clip Loop' : 'Enable Clip Loop'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isLoopClip
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Loop Clip</span>
          </button>

          {/* Playback Speed selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              aria-label="Playback speed"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-30 min-w-[90px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs font-mono transition-colors flex items-center justify-between ${
                      playbackRate === rate
                        ? 'text-indigo-400 bg-indigo-950/40 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{rate}x</span>
                    {playbackRate === rate && <span className="text-indigo-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Slider */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume slider"
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Fullscreen (video only) */}
          {isVideo && (
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen"
              aria-label="Toggle Fullscreen"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
