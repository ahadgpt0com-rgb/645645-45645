import React, { useState } from 'react';
import {
  X,
  Download,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileAudio,
  Archive,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Clip, MediaFile, ExportSettings, ExportProgress } from '../types/trimmer.ts';
import { formatDurationHuman } from '../utils/time.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaFile;
  clip?: Clip | null;
  allClips?: Clip[];
  isBatch: boolean;
  onStartExport: (settings: ExportSettings) => Promise<void>;
  progress: ExportProgress;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  media,
  clip,
  allClips = [],
  isBatch,
  onStartExport,
  progress,
}) => {
  const [format, setFormat] = useState<'mp4' | 'webm' | 'wav'>(
    media.type === 'audio' ? 'wav' : 'webm'
  );
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p'>('original');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  if (!isOpen) return null;

  const isExporting = progress.status === 'processing' || progress.status === 'preparing';
  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';

  const handleExportClick = async () => {
    await onStartExport({
      format,
      resolution,
      quality,
      speed: 1,
    });
    if (progress.status === 'completed') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const targetTitle = isBatch
    ? `Batch Export: All ${allClips.length} Clips`
    : `Export: ${clip?.title || 'Selected Clip'}`;

  const targetDuration = isBatch
    ? allClips.reduce((acc, c) => acc + c.duration, 0)
    : clip?.duration || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              {isBatch ? (
                <Archive className="w-4 h-4" />
              ) : media.type === 'video' ? (
                <FileVideo className="w-4 h-4" />
              ) : (
                <FileAudio className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs">{targetTitle}</h3>
              <p className="text-[11px] text-slate-400">
                Duration: <span className="text-slate-200 font-mono">{formatDurationHuman(targetDuration)}</span>
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {!isExporting && !isCompleted && !isError && (
            <>
              {/* Format selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Output Format
                </label>
                {media.type === 'audio' ? (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/50 text-indigo-300 text-xs font-medium text-left flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold">WAV</span> (Master 16-bit PCM Audio)
                        <p className="text-[10px] text-slate-400">Lossless broadcast audio quality</p>
                      </div>
                      <span className="text-indigo-400 font-bold">✓</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('webm')}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                        format === 'webm'
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold">WebM Video</span>
                      <p className="text-[10px] text-slate-400">Native browser VP9/VP8 container</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('mp4')}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                        format === 'mp4'
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold">MP4 Video</span>
                      <p className="text-[10px] text-slate-400">AVC1 / H.264 standard container</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Resolution options (Video only) */}
              {media.type === 'video' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Resolution
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['original', '1080p', '720p', '480p'] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setResolution(res)}
                        className={`py-2 px-2 rounded-lg border text-xs font-mono text-center capitalize transition-all ${
                          resolution === res
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality options */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Quality & Bitrate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'high', label: 'High', desc: '8 Mbps' },
                    { id: 'medium', label: 'Medium', desc: '4 Mbps' },
                    { id: 'low', label: 'Low', desc: '1.5 Mbps' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id as 'high' | 'medium' | 'low')}
                      className={`py-2 px-3 rounded-lg border text-xs text-left transition-all ${
                        quality === q.id
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold">{q.label}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <span className="text-slate-300 font-medium">Privacy Guaranteed:</span> Trimming and packaging execute directly in your browser. No files are uploaded to any external server.
              </div>
            </>
          )}

          {/* Export In Progress */}
          {isExporting && (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
              <h4 className="text-base font-bold text-white mb-1">
                {isBatch ? 'Exporting Clip Queue...' : 'Rendering Trimmed Clip...'}
              </h4>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">
                {progress.message || 'Processing in browser...'}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {progress.progress}%
              </span>
            </div>
          )}

          {/* Export Completed */}
          {isCompleted && (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Export Ready!
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Your file has been trimmed and downloaded to your computer.
              </p>

              {progress.downloadUrl && (
                <a
                  href={progress.downloadUrl}
                  download={progress.filename || 'trimmed_media'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Again</span>
                </a>
              )}
            </div>
          )}

          {/* Export Error */}
          {isError && (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Export Failed
              </h4>
              <p className="text-xs text-rose-300 mb-4 max-w-sm">
                {progress.error || 'An unexpected error occurred during rendering.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          {!isExporting && !isCompleted && !isError && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Start Export</span>
              </button>
            </>
          )}

          {(isCompleted || isError) && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
