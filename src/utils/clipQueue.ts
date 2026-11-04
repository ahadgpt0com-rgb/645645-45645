import { Clip } from '../types/trimmer.ts';
import { clamp } from './time.ts';

const CLIP_COLORS = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#14B8A6', // Teal
];

const STORAGE_KEY = 'precision_trimmer_clips_v1';

export function getNextClipColor(index: number): string {
  return CLIP_COLORS[index % CLIP_COLORS.length];
}

export function validateClipRange(
  start: number,
  end: number,
  mediaDuration: number,
  minDuration = 0.05
): { startTime: number; endTime: number; duration: number } {
  let s = clamp(start, 0, mediaDuration);
  let e = clamp(end, 0, mediaDuration);

  if (s >= e) {
    if (s + minDuration <= mediaDuration) {
      e = s + minDuration;
    } else {
      s = Math.max(0, e - minDuration);
    }
  }

  // Ensure minimum duration
  if (e - s < minDuration) {
    e = Math.min(mediaDuration, s + minDuration);
  }

  const duration = Number((e - s).toFixed(3));
  return {
    startTime: Number(s.toFixed(3)),
    endTime: Number(e.toFixed(3)),
    duration,
  };
}

export function createClip(
  mediaId: string,
  title: string,
  start: number,
  end: number,
  mediaDuration: number,
  color?: string
): Clip {
  const range = validateClipRange(start, end, mediaDuration);
  return {
    id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    mediaId,
    title: title.trim() || 'Untitled Clip',
    startTime: range.startTime,
    endTime: range.endTime,
    duration: range.duration,
    createdAt: Date.now(),
    color: color || getNextClipColor(Math.floor(Math.random() * 10)),
  };
}

export function saveQueueToStorage(clips: Clip[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
    }
  } catch (e) {
    console.warn('Failed to save clip queue to localStorage', e);
  }
}

export function loadQueueFromStorage(): Clip[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load clip queue from localStorage', e);
  }
  return [];
}
