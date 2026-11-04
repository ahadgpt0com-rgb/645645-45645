/**
 * Precision timecode utilities for video & audio editing
 */

export function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a duration in seconds to HH:MM:SS.mmm or MM:SS.mmm
 */
export function formatTime(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) {
    return includeMs ? '00:00:00.000' : '00:00:00';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);

  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');

  const timeString = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return includeMs ? `${timeString}.${pad(ms, 3)}` : timeString;
}

/**
 * Formats duration into a human-friendly string like "1m 14.5s" or "32.4s"
 */
export function formatDurationHuman(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(1);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Parses user input strings such as:
 * - "01:23:45.678" -> 5025.678
 * - "12:34.56" -> 754.56
 * - "45.5" -> 45.5
 * - "90" -> 90
 * Returns seconds, or NaN if completely unparseable.
 */
export function parseTime(timeStr: string): number {
  if (!timeStr) return NaN;
  const cleanStr = timeStr.trim();
  if (!cleanStr) return NaN;

  // If pure number:
  if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    const val = parseFloat(cleanStr);
    return isNaN(val) ? NaN : Math.max(0, val);
  }

  const parts = cleanStr.split(':');
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    if (isNaN(h) || isNaN(m) || isNaN(s)) return NaN;
    return Math.max(0, h * 3600 + m * 60 + s);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    if (isNaN(m) || isNaN(s)) return NaN;
    return Math.max(0, m * 60 + s);
  }

  return NaN;
}

/**
 * Formats byte size into human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
