export type MediaType = 'video' | 'audio';

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  mimeType: string;
  size: number;
  duration: number;
  url: string;
  width?: number;
  height?: number;
  audioBuffer?: AudioBuffer | null;
  waveformPeaks?: number[];
  thumbnails?: string[];
  file?: File;
}

export interface Clip {
  id: string;
  mediaId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  createdAt: number;
  color: string;
  notes?: string;
}

export type ExportFormat = 'mp4' | 'webm' | 'wav';
export type ExportResolution = 'original' | '1080p' | '720p' | '480p';
export type ExportQuality = 'high' | 'medium' | 'low';

export interface ExportSettings {
  format: ExportFormat;
  resolution: ExportResolution;
  quality: ExportQuality;
  speed: number;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'processing' | 'completed' | 'error';
  clipId?: string;
  clipTitle?: string;
  currentClipIndex?: number;
  totalClips?: number;
  progress: number; // 0 to 100
  message: string;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}
