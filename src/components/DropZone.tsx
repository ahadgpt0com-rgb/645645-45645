import React, { useRef, useState } from 'react';
import { Upload, Film, Music, ShieldCheck, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onLoadDemo: (type: 'video' | 'audio') => void;
  isLoading: boolean;
  loadingMessage: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  onLoadDemo,
  isLoading,
  loadingMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|flv)$/i.test(file.name);
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name);

    if (isVideo || isAudio) {
      onFileSelected(file);
    } else {
      alert('Please upload a valid Video (.mp4, .webm, .mkv) or Audio (.mp3, .wav, .m4a) file.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Hero Intro */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Precision Video & Audio Trimmer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Frame-accurate timeline trimming, waveform visualization, and multi-clip extraction.
          Runs entirely in your web browser with zero server uploads.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900/90'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,.mkv,.m4a"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-200">{loadingMessage || 'Analyzing media...'}</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">Generating waveforms and timeline cache</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Drop your media file here, or <span className="text-indigo-400 underline decoration-indigo-400/50 underline-offset-4">browse</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md">
              Supports MP4, WebM, MKV, MOV video formats and MP3, WAV, M4A, AAC, OGG audio formats.
            </p>

            {/* Format support tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video: MP4 · WebM · MKV</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audio: MP3 · WAV · M4A</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Starters & Security Assurance */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No cloud upload. Files remain 100% on your local machine.</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">No media on hand?</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo('video');
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Load Demo Video</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
