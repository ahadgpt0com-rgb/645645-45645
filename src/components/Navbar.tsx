import React from 'react';
import { Scissors, Film, Music, HelpCircle, RefreshCw, Sparkles } from 'lucide-react';
import { MediaType } from '../types/trimmer.ts';

interface NavbarProps {
  hasMedia: boolean;
  mediaType?: MediaType;
  fileName?: string;
  onReset: () => void;
  onOpenGuide: () => void;
  onLoadDemo: (type: 'video' | 'audio') => void;
  isGeneratingDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasMedia,
  mediaType,
  fileName,
  onReset,
  onOpenGuide,
  onLoadDemo,
  isGeneratingDemo,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Brand Zone - 1 line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
              Precision Trimmer
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
              Web Media Studio
            </span>
          </div>
        </div>

        {/* Center Media Status or Nav Links */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
          {hasMedia && fileName ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 max-w-md">
              {mediaType === 'video' ? (
                <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              ) : (
                <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              )}
              <span className="truncate text-slate-200 font-mono text-[11px]" title={fileName}>
                {fileName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <span className="text-slate-400">Zero Uploads · 100% Client-Side In Browser</span>
            </div>
          )}
        </div>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!hasMedia && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onLoadDemo('video')}
                disabled={isGeneratingDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Demo Video</span>
              </button>
              <button
                type="button"
                onClick={() => onLoadDemo('audio')}
                disabled={isGeneratingDemo}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo Audio</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer"
            title="Project IDX & Web Run Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Project IDX Guide</span>
          </button>

          {hasMedia && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/40 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New File</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
