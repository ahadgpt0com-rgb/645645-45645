import React from 'react';
import { X, Terminal, Cpu, Shield, Keyboard, ExternalLink, CheckCircle } from 'lucide-react';

interface ProjectIdxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectIdxGuideModal: React.FC<ProjectIdxGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project IDX & Web Run Guide</h3>
              <p className="text-xs text-slate-400">Architecture, deployment, and keyboard shortcuts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Running in Project IDX */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Running in Google Project IDX / Workstations</span>
            </h4>
            <p className="text-slate-400 mb-3 leading-relaxed">
              This application is configured for Node.js, Vite, and React 19. It runs smoothly inside Project IDX's integrated Cloud Workstation environment without requiring external binaries or cloud server egress.
            </p>

            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-slate-200 space-y-2">
              <div>
                <span className="text-slate-500"># 1. Install dependencies</span>
                <p className="text-indigo-300">npm install</p>
              </div>
              <div>
                <span className="text-slate-500"># 2. Launch Vite dev server</span>
                <p className="text-indigo-300">npm run dev</p>
              </div>
              <div>
                <span className="text-slate-500"># 3. Production build</span>
                <p className="text-indigo-300">npm run build</p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              <span>Keyboard Shortcuts for Precision Editing</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Set In Point (Start)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">I</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Set Out Point (End)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">O</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Step 1s Left / Right</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">← / →</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Jump to Clip Start</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">Home</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Toggle Clip Loop</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">L</kbd>
              </div>
            </div>
          </div>

          {/* Local Browser Processing & Architecture */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero-Server Privacy & High Performance</span>
            </h4>
            <div className="space-y-2 text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">HTML5 Media & Web Audio API:</strong> Audio is decoded into 32-bit floating point buffers for accurate sample-level cutting and lossless 16-bit PCM WAV rendering.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Hardware-Accelerated Canvas:</strong> Video frames are scrubbed and rendered through HTML5 Canvas and captured via MediaRecorder at native or configurable resolutions (1080p, 720p, 480p).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">LocalStorage Queue Persistence:</strong> Your clip queue is preserved in your browser's local storage so you never lose your cuts if the page reloads.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
