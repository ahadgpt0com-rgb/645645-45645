import JSZip from 'jszip';
import { Clip, MediaFile, ExportSettings } from '../types/trimmer.ts';
import { audioBufferToWavBlob, getAudioContext } from './waveform.ts';

export interface ExportProgressCallback {
  (progress: number, message: string): void;
}

/**
 * Trims an audio file locally using Web Audio API OfflineAudioContext
 */
export async function trimAudio(
  media: MediaFile,
  clip: Clip,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  onProgress?.(10, 'Decoding source audio...');

  let audioBuffer = media.audioBuffer;
  if (!audioBuffer && media.file) {
    const ctx = getAudioContext();
    const arrayBuffer = await media.file.arrayBuffer();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  }

  if (!audioBuffer) {
    throw new Error('Unable to access audio data for trimming.');
  }

  onProgress?.(35, 'Extracting slice...');

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(clip.startTime * sampleRate);
  const endSample = Math.min(Math.floor(clip.endTime * sampleRate), audioBuffer.length);
  const clipLength = Math.max(1, endSample - startSample);

  onProgress?.(60, 'Rendering trimmed audio...');

  // Use OfflineAudioContext for rendering
  const offlineCtx = new OfflineAudioContext(numChannels, clipLength, sampleRate);
  const trimmedBuffer = offlineCtx.createBuffer(numChannels, clipLength, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const srcData = audioBuffer.getChannelData(c);
    const destData = trimmedBuffer.getChannelData(c);
    // Copy the slice
    for (let i = 0; i < clipLength; i++) {
      destData[i] = srcData[startSample + i] || 0;
    }
  }

  onProgress?.(85, 'Packaging WAV file...');
  const wavBlob = audioBufferToWavBlob(trimmedBuffer);
  onProgress?.(100, 'Audio export complete');

  return wavBlob;
}

/**
 * Trims a video file locally using HTML5 Canvas & MediaRecorder
 */
export async function trimVideo(
  media: MediaFile,
  clip: Clip,
  settings: ExportSettings,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  onProgress?.(5, 'Initializing video renderer...');

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = media.url;
  video.muted = false; // keep audio track for capture
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video element.'));
  });

  const duration = clip.endTime - clip.startTime;
  if (duration <= 0) {
    throw new Error('Invalid clip duration.');
  }

  // Determine output resolution
  let outWidth = video.videoWidth || 1280;
  let outHeight = video.videoHeight || 720;

  if (settings.resolution === '720p' && outHeight > 720) {
    outWidth = Math.round((outWidth * 720) / outHeight);
    outHeight = 720;
  } else if (settings.resolution === '480p' && outHeight > 480) {
    outWidth = Math.round((outWidth * 480) / outHeight);
    outHeight = 480;
  } else if (settings.resolution === '1080p' && outHeight > 1080) {
    outWidth = Math.round((outWidth * 1080) / outHeight);
    outHeight = 1080;
  }

  // Ensure even dimensions
  outWidth = Math.floor(outWidth / 2) * 2;
  outHeight = Math.floor(outHeight / 2) * 2;

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  // Seek to start position
  onProgress?.(15, `Seeking to ${clip.startTime.toFixed(2)}s...`);
  await seekVideoTo(video, clip.startTime);

  const canvasStream = canvas.captureStream(30);

  // Capture audio track if supported
  let finalStream = canvasStream;
  let audioContext: AudioContext | null = null;
  let mediaElementSource: MediaElementAudioSourceNode | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioCtx();
    const dest = audioContext.createMediaStreamDestination();
    mediaElementSource = audioContext.createMediaElementSource(video);
    mediaElementSource.connect(dest);
    // Also connect to destination if not muted, or keep silent to avoid double audio
    finalStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);
  } catch {
    // If audio element capture is restricted or unsupported, video stream proceeds
  }

  // Pick suitable mimeType
  let mimeType = 'video/webm;codecs=vp8,opus';
  if (settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    mimeType = 'video/webm;codecs=vp9,opus';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    mimeType = 'video/webm';
  }

  // Bitrates based on quality
  let videoBitsPerSecond = 4_000_000; // default 4 Mbps
  if (settings.quality === 'high') videoBitsPerSecond = 8_000_000;
  if (settings.quality === 'low') videoBitsPerSecond = 1_500_000;

  const recorder = new MediaRecorder(finalStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    let animationFrameId: number;
    let isFinished = false;

    recorder.onstop = () => {
      cancelAnimationFrame(animationFrameId);
      video.pause();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      const outputBlob = new Blob(chunks, { type: mimeType.split(';')[0] });
      onProgress?.(100, 'Video export complete!');
      resolve(outputBlob);
    };

    recorder.onerror = (e) => {
      cancelAnimationFrame(animationFrameId);
      video.pause();
      reject(new Error('MediaRecorder error: ' + String(e)));
    };

    const drawFrame = () => {
      if (isFinished) return;

      if (video.currentTime >= clip.endTime || video.ended) {
        isFinished = true;
        onProgress?.(95, 'Finalizing video file...');
        recorder.stop();
        return;
      }

      ctx.drawImage(video, 0, 0, outWidth, outHeight);

      const elapsed = Math.max(0, video.currentTime - clip.startTime);
      const pct = Math.min(95, Math.floor(15 + (elapsed / duration) * 80));
      onProgress?.(pct, `Rendering frames: ${elapsed.toFixed(1)}s / ${duration.toFixed(1)}s`);

      animationFrameId = requestAnimationFrame(drawFrame);
    };

    recorder.start(100);
    video.playbackRate = 1.0;
    video.play().then(() => {
      animationFrameId = requestAnimationFrame(drawFrame);
    }).catch(err => {
      recorder.stop();
      reject(err);
    });
  });
}

function seekVideoTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      resolve();
    };
    video.addEventListener('seeked', handleSeeked);
    video.currentTime = time;
  });
}

/**
 * Downloads a single Blob with a given filename
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

/**
 * Exports multiple clips sequentially and packages them into a ZIP archive
 */
export async function exportAllClipsToZip(
  media: MediaFile,
  clips: Clip[],
  settings: ExportSettings,
  onProgress?: (overallProgress: number, message: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const total = clips.length;

  for (let i = 0; i < total; i++) {
    const clip = clips[i];
    const clipBaseProgress = (i / total) * 90;
    const clipWeight = 90 / total;

    const clipProgressReporter: ExportProgressCallback = (clipPct, msg) => {
      const overall = Math.floor(clipBaseProgress + (clipPct / 100) * clipWeight);
      onProgress?.(overall, `[${i + 1}/${total}] ${clip.title}: ${msg}`);
    };

    let clipBlob: Blob;
    const ext = media.type === 'audio' ? 'wav' : (settings.format === 'mp4' ? 'mp4' : 'webm');
    const safeTitle = clip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${String(i + 1).padStart(2, '0')}_${safeTitle}.${ext}`;

    if (media.type === 'audio') {
      clipBlob = await trimAudio(media, clip, clipProgressReporter);
    } else {
      clipBlob = await trimVideo(media, clip, settings, clipProgressReporter);
    }

    zip.file(filename, clipBlob);
  }

  onProgress?.(95, 'Compressing clips into ZIP archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(95 + Math.floor(metadata.percent * 0.05), `Generating zip (${Math.round(metadata.percent)}%)...`);
  });

  onProgress?.(100, 'Batch export complete!');
  return zipBlob;
}
