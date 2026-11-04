import React, { useState } from 'react';
import {
  Layers,
  Play,
  Download,
  Trash2,
  Edit2,
  Check,
  Package,
  Sparkles,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { Clip, MediaFile } from '../types/trimmer.ts';
import { formatTime } from '../utils/time.ts';

interface ClipQueueProps {
  media: MediaFile;
  clips: Clip[];
  activeClipId?: string;
  onPreviewClip: (clip: Clip) => void;
  onLoadClipToTimeline: (clip: Clip) => void;
  onUpdateClipTitle: (id: string, newTitle: string) => void;
  onDeleteClip: (id: string) => void;
  onClearQueue: () => void;
  onExportClip: (clip: Clip) => void;
  onExportAll: () => void;
}

export const ClipQueue: React.FC<ClipQueueProps> = ({
  media,
  clips,
  activeClipId,
  onPreviewClip,
  onLoadClipToTimeline,
  onUpdateClipTitle,
  onDeleteClip,
  onClearQueue,
  onExportClip,
  onExportAll,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (clip: Clip) => {
    setEditingId(clip.id);
    setEditTitle(clip.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdateClipTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Queue Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Saved Clips Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-mono">
                {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Total cut duration: <span className="text-slate-200 font-mono">{totalDuration.toFixed(2)}s</span>
            </p>
          </div>
        </div>

        {clips.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearQueue}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
            >
              Clear Queue
            </button>
            <button
              type="button"
              onClick={onExportAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Export All Clips (ZIP)</span>
            </button>
          </div>
        )}
      </div>

      {/* Clip List or Empty State */}
      {clips.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300 mb-1">
            No clips marked yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Position the start and end markers on the timeline above and click "Add to Queue" to isolate multiple segments from this file.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {clips.map((clip, index) => {
            const isActive = clip.id === activeClipId;
            const isEditing = clip.id === editingId;

            return (
              <div
                key={clip.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Left info: Badge, Title, Time range */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Color Accent Pill */}
                  <div
                    className="w-2.5 h-9 rounded-full shrink-0"
                    style={{ backgroundColor: clip.color }}
                  />

                  <div className="min-w-0">
                    {/* Title or Edit Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(clip.id)}
                          autoFocus
                          className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(clip.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {clip.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(clip)}
                          title="Rename clip"
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Timecode details */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{formatTime(clip.startTime, true)}</span>
                      <span>→</span>
                      <span>{formatTime(clip.endTime, true)}</span>
                      <span className="text-indigo-400 font-semibold bg-indigo-950/40 px-1.5 py-0.2 rounded border border-indigo-900/50">
                        {clip.duration.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onPreviewClip(clip)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                    title="Preview this clip"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadClipToTimeline(clip)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                    title="Load markers to timeline"
                  >
                    <Sliders className="w-3 h-3" />
                    <span className="hidden md:inline">Edit Markers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onExportClip(clip)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
                    title="Export this clip"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteClip(clip.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                    title="Remove clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
