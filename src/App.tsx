import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MediaFile, Clip, ExportSettings, ExportProgress } from './types/trimmer.ts';
import { Navbar } from './components/Navbar.tsx';
import { DropZone } from './components/DropZone.tsx';
import { MediaPreview } from './components/MediaPreview.tsx';
import { Timeline } from './components/Timeline.tsx';
import { PrecisionControls } from './components/PrecisionControls.tsx';
import { ClipQueue } from './components/ClipQueue.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { ProjectIdxGuideModal } from './components/ProjectIdxGuideModal.tsx';
import { clamp } from './utils/time.ts';
import {
  createClip,
  loadQueueFromStorage,
  saveQueueToStorage,
  getNextClipColor,
} from './utils/clipQueue.ts';
import {
  decodeAudioFromFile,
  generateSyntheticPeaks,
  createDemoVideo,
  createDemoAudio,
} from './utils/waveform.ts';
import {
  trimAudio,
  trimVideo,
  exportAllClipsToZip,
  triggerFileDownload,
} from './utils/exporter.ts';

export default function App() {
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopClip, setIsLoopClip] = useState(false);

  // Clips queue with LocalStorage persistence
  const [clips, setClips] = useState<Clip[]>(() => loadQueueFromStorage());
  const [activeClipId, setActiveClipId] = useState<string | undefined>(undefined);

  // Loading & Modals
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<{ isBatch: boolean; clip?: Clip | null }>({
    isBatch: false,
    clip: null,
  });

  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save clips to LocalStorage whenever updated
  useEffect(() => {
    saveQueueToStorage(clips);
  }, [clips]);

  // Handle Play/Pause
  const handleTogglePlay = useCallback(() => {
    const el = media?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      // If at end or beyond, rewind to start marker
      if (currentTime >= (isLoopClip ? endTime : (media?.duration || 0))) {
        el.currentTime = startTime;
        setCurrentTime(startTime);
      }
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying, media, currentTime, startTime, endTime, isLoopClip]);

  // Handle Seek
  const handleSeek = useCallback(
    (targetTime: number) => {
      const clamped = clamp(targetTime, 0, media?.duration || 0);
      setCurrentTime(clamped);
      const el = media?.type === 'video' ? videoRef.current : audioRef.current;
      if (el) {
        el.currentTime = clamped;
      }
    },
    [media]
  );

  // Time update from media element
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setStartTime(currentTime);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setEndTime(currentTime);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLoopClip((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const delta = e.shiftKey ? -1 : -0.1;
        handleSeek(currentTime + delta);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.shiftKey ? 1 : 0.1;
        handleSeek(currentTime + delta);
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleSeek(startTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSeek, currentTime, startTime]);

  // Load a user-selected File
  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Inspecting file and decoding media...');

    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|webm|mov|avi|flv)$/i.test(file.name);
      const mediaType = isVideo ? 'video' : 'audio';
      const blobUrl = URL.createObjectURL(file);

      // Probe duration
      let duration = 0;
      let width: number | undefined;
      let height: number | undefined;

      if (isVideo) {
        const tempVideo = document.createElement('video');
        tempVideo.src = blobUrl;
        await new Promise<void>((resolve, reject) => {
          tempVideo.onloadedmetadata = () => {
            duration = tempVideo.duration;
            width = tempVideo.videoWidth;
            height = tempVideo.videoHeight;
            resolve();
          };
          tempVideo.onerror = () => reject(new Error('Unable to read video metadata'));
        });
      } else {
        const tempAudio = document.createElement('audio');
        tempAudio.src = blobUrl;
        await new Promise<void>((resolve, reject) => {
          tempAudio.onloadedmetadata = () => {
            duration = tempAudio.duration;
            resolve();
          };
          tempAudio.onerror = () => reject(new Error('Unable to read audio metadata'));
        });
      }

      setLoadingMessage('Extracting waveform peaks...');
      let audioBuffer: AudioBuffer | null = null;
      let waveformPeaks: number[] = [];

      try {
        const decoded = await decodeAudioFromFile(file);
        if (decoded) {
          audioBuffer = decoded.buffer;
          waveformPeaks = decoded.peaks;
        }
      } catch (e) {
        console.warn('Audio decoding skipped or failed, using synthetic envelope', e);
      }

      if (waveformPeaks.length === 0) {
        waveformPeaks = generateSyntheticPeaks(200);
      }

      const mediaObj: MediaFile = {
        id: 'media_' + Date.now(),
        name: file.name,
        type: mediaType,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'audio/mp3'),
        size: file.size,
        duration: isFinite(duration) && duration > 0 ? duration : 10,
        url: blobUrl,
        width,
        height,
        audioBuffer,
        waveformPeaks,
        file,
      };

      setMedia(mediaObj);
      setCurrentTime(0);
      setStartTime(0);
      // Set default clip range (first 10 seconds or whole duration)
      setEndTime(Math.min(mediaObj.duration, 10));
      setIsPlaying(false);
      setIsLoopClip(false);
    } catch (err) {
      console.error(err);
      alert('Error loading file. Please verify it is a supported video or audio format.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Load Built-in Demo Video / Audio
  const handleLoadDemo = async (type: 'video' | 'audio') => {
    setIsLoading(true);
    setLoadingMessage(type === 'video' ? 'Synthesizing 720p demo video & clock...' : 'Composing synthesized demo audio...');

    try {
      if (type === 'video') {
        const { file } = await createDemoVideo();
        await handleFileSelected(file);
      } else {
        const { file } = await createDemoAudio();
        await handleFileSelected(file);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate demo media.');
      setIsLoading(false);
    }
  };

  // Reset current media
  const handleResetMedia = () => {
    if (media?.url) {
      URL.revokeObjectURL(media.url);
    }
    const el = media?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.pause();
    }
    setMedia(null);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
    setIsLoopClip(false);
    setActiveClipId(undefined);
  };

  // Clip Management
  const handleAddClip = (title: string) => {
    if (!media) return;
    const newClip = createClip(
      media.id,
      title,
      startTime,
      endTime,
      media.duration,
      getNextClipColor(clips.length)
    );
    setClips((prev) => [...prev, newClip]);
    setActiveClipId(newClip.id);
  };

  const handlePreviewClip = (clip: Clip) => {
    setStartTime(clip.startTime);
    setEndTime(clip.endTime);
    handleSeek(clip.startTime);
    setIsLoopClip(true);
    setActiveClipId(clip.id);

    // auto-play
    const el = media?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleLoadClipToTimeline = (clip: Clip) => {
    setStartTime(clip.startTime);
    setEndTime(clip.endTime);
    handleSeek(clip.startTime);
    setActiveClipId(clip.id);
  };

  const handleUpdateClipTitle = (id: string, newTitle: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (activeClipId === id) {
      setActiveClipId(undefined);
    }
  };

  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear all clips from the queue?')) {
      setClips([]);
      setActiveClipId(undefined);
    }
  };

  // Export handlers
  const handleOpenExportClip = (clip: Clip) => {
    setExportTarget({ isBatch: false, clip });
    setExportProgress({ status: 'idle', progress: 0, message: '' });
    setExportModalOpen(true);
  };

  const handleOpenExportAll = () => {
    setExportTarget({ isBatch: true, clip: null });
    setExportProgress({ status: 'idle', progress: 0, message: '' });
    setExportModalOpen(true);
  };

  const handleStartExport = async (settings: ExportSettings) => {
    if (!media) return;
    setExportProgress({ status: 'preparing', progress: 5, message: 'Starting export...' });

    try {
      if (exportTarget.isBatch) {
        // Batch export
        setExportProgress({ status: 'processing', progress: 10, message: 'Processing clips batch...' });
        const zipBlob = await exportAllClipsToZip(media, clips, settings, (pct, msg) => {
          setExportProgress((prev) => ({
            ...prev,
            status: 'processing',
            progress: pct,
            message: msg,
          }));
        });

        const filename = `${media.name.replace(/\.[^/.]+$/, '')}_all_clips.zip`;
        triggerFileDownload(zipBlob, filename);

        setExportProgress({
          status: 'completed',
          progress: 100,
          message: 'All clips exported successfully in ZIP archive!',
          downloadUrl: URL.createObjectURL(zipBlob),
          filename,
        });
      } else if (exportTarget.clip) {
        // Single clip export
        const clip = exportTarget.clip;
        setExportProgress({ status: 'processing', progress: 10, message: `Trimming ${clip.title}...` });

        let resultBlob: Blob;
        const ext = media.type === 'audio' ? 'wav' : (settings.format === 'mp4' ? 'mp4' : 'webm');
        const filename = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;

        if (media.type === 'audio') {
          resultBlob = await trimAudio(media, clip, (pct, msg) => {
            setExportProgress((prev) => ({
              ...prev,
              status: 'processing',
              progress: pct,
              message: msg,
            }));
          });
        } else {
          resultBlob = await trimVideo(media, clip, settings, (pct, msg) => {
            setExportProgress((prev) => ({
              ...prev,
              status: 'processing',
              progress: pct,
              message: msg,
            }));
          });
        }

        triggerFileDownload(resultBlob, filename);

        setExportProgress({
          status: 'completed',
          progress: 100,
          message: `Clip "${clip.title}" exported successfully!`,
          downloadUrl: URL.createObjectURL(resultBlob),
          filename,
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setExportProgress({
        status: 'error',
        progress: 0,
        message: 'Export failed.',
        error: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        hasMedia={!!media}
        mediaType={media?.type}
        fileName={media?.name}
        onReset={handleResetMedia}
        onOpenGuide={() => setGuideModalOpen(true)}
        onLoadDemo={handleLoadDemo}
        isGeneratingDemo={isLoading}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {!media ? (
          <DropZone
            onFileSelected={handleFileSelected}
            onLoadDemo={handleLoadDemo}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        ) : (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Top Media Player Preview */}
            <MediaPreview
              media={media}
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              isPlaying={isPlaying}
              isLoopClip={isLoopClip}
              onTimeUpdate={handleTimeUpdate}
              onTogglePlay={handleTogglePlay}
              onToggleLoopClip={() => setIsLoopClip(!isLoopClip)}
              onSeek={handleSeek}
              videoRef={videoRef}
              audioRef={audioRef}
            />

            {/* Precision Interactive Timeline */}
            <Timeline
              media={media}
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              queuedClips={clips}
              activeClipId={activeClipId}
              onSeek={handleSeek}
              onRangeChange={(start, end) => {
                setStartTime(start);
                setEndTime(end);
              }}
            />

            {/* Fine-Tuning & Instant Marker Controls */}
            <PrecisionControls
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              duration={media.duration}
              onSeek={handleSeek}
              onSetStartTime={(time) => setStartTime(time)}
              onSetEndTime={(time) => setEndTime(time)}
              onAddClip={handleAddClip}
              existingClipCount={clips.length}
            />

            {/* Multi-Clip Queue Management & Batch Exporter */}
            <ClipQueue
              media={media}
              clips={clips}
              activeClipId={activeClipId}
              onPreviewClip={handlePreviewClip}
              onLoadClipToTimeline={handleLoadClipToTimeline}
              onUpdateClipTitle={handleUpdateClipTitle}
              onDeleteClip={handleDeleteClip}
              onClearQueue={handleClearQueue}
              onExportClip={handleOpenExportClip}
              onExportAll={handleOpenExportAll}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Precision Video & Audio Trimmer · 100% Client-Side In-Browser Media Processing</span>
          <span>Optimized for Project IDX & Modern Web Browsers</span>
        </div>
      </footer>

      {/* Export Settings & Progress Modal */}
      {media && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          media={media}
          clip={exportTarget.clip}
          allClips={clips}
          isBatch={exportTarget.isBatch}
          onStartExport={handleStartExport}
          progress={exportProgress}
        />
      )}

      {/* Project IDX & Web Run Guide Modal */}
      <ProjectIdxGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  );
}
