/**
 * Waveform generation and audio extraction helpers
 */

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Extracts normalized peak data (between 0.05 and 1.0) from an AudioBuffer for drawing waveforms
 */
export function extractPeaksFromAudioBuffer(buffer: AudioBuffer, numPeaks = 200): number[] {
  const channelData = buffer.getChannelData(0); // primary channel
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / numPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);
    let max = 0;
    for (let j = start; j < end; j += 4) { // step by 4 for high performance
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    // ensure min height for visual balance
    peaks.push(Math.max(0.08, Math.min(1.0, max)));
  }

  return peaks;
}

/**
 * Decodes audio data from an ArrayBuffer or File
 */
export async function decodeAudioFromFile(file: File | Blob): Promise<{ buffer: AudioBuffer; peaks: number[] } | null> {
  try {
    const ctx = getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    // decodeAudioData consumes buffer, use slice
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const peaks = extractPeaksFromAudioBuffer(audioBuffer);
    return { buffer: audioBuffer, peaks };
  } catch (err) {
    console.warn('Could not decode audio directly from file (file may be video with specific codec or silent):', err);
    return null;
  }
}

/**
 * Generates synthetic waveform peaks if audio decoding fails or video lacks standard audio track
 */
export function generateSyntheticPeaks(length = 200, seed = 42): number[] {
  const peaks: number[] = [];
  let current = 0.5;
  for (let i = 0; i < length; i++) {
    const noise = Math.sin(i * 0.15 + seed) * 0.3 + Math.cos(i * 0.4) * 0.2;
    current = Math.max(0.12, Math.min(0.95, 0.45 + noise + (Math.sin(i * 0.05) * 0.15)));
    peaks.push(Number(current.toFixed(3)));
  }
  return peaks;
}

/**
 * Generates a realistic synthetic test video (with animation, moving playhead, timer, and synthesized audio track)
 * for instant 1-click preview and testing in environments like Project IDX without requiring sample uploads.
 */
export async function createDemoVideo(): Promise<{ file: File; duration: number }> {
  const durationSec = 8;
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const fps = 24;
  const totalFrames = durationSec * fps;
  const stream = canvas.captureStream(fps);

  // Synthesize audio context
  const audioCtx = getAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const audioDest = audioCtx.createMediaStreamDestination();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);

  osc.connect(gain);
  gain.connect(audioDest);

  // Combine video and audio tracks
  const combinedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstart = () => {
      try {
        osc.start();
      } catch {}
    };

    recorder.onstop = () => {
      try {
        osc.stop();
      } catch {}
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'demo_timelapse_preview.webm', { type: 'video/webm' });
      resolve({ file, duration: durationSec });
    };

    recorder.start(100);

    let frame = 0;
    const renderFrame = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const progress = frame / totalFrames;
      const currentSec = (frame / fps).toFixed(2);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#090D16');
      grad.addColorStop(0.5, '#131B2E');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle dynamic grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Animated glowing rings & wave
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const ringRadius = 140 + Math.sin(frame * 0.1) * 20;

      ctx.beginPath();
      ctx.arc(centerX, centerY - 40, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY - 40, ringRadius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Title & Frame counter
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('SAMPLE TIMELAPSE FOOTAGE', centerX, centerY - 100);

      ctx.font = '20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`DURATION: 00:00:${durationSec}.000 | 30 FPS`, centerX, centerY - 65);

      // Large Digital Timecode display
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(centerX - 180, centerY + 30, 360, 70);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(centerX - 180, centerY + 30, 360, 70);

      ctx.font = 'bold 38px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(`00:00:${currentSec.padStart(5, '0')}`, centerX, centerY + 78);

      // Progress bar at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(100, canvas.height - 80, canvas.width - 200, 12);

      ctx.fillStyle = '#6366F1';
      ctx.fillRect(100, canvas.height - 80, (canvas.width - 200) * progress, 12);

      frame++;
      setTimeout(renderFrame, 15);
    };

    renderFrame();
  });
}

/**
 * Creates a synthetic demo audio file (harmonic chords + arpeggio)
 */
export async function createDemoAudio(): Promise<{ file: File; duration: number }> {
  const durationSec = 10;
  const audioCtx = getAudioContext();
  const sampleRate = 44100;
  const numSamples = durationSec * sampleRate;
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Generate pleasant harmonic chord sequence
  const chords = [
    [261.63, 329.63, 392.00], // C major
    [220.00, 261.63, 329.63], // A minor
    [174.61, 220.00, 261.63], // F major
    [196.00, 246.94, 293.66], // G major
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t / (durationSec / chords.length)) % chords.length);
    const chord = chords[chordIndex];

    let val = 0;
    chord.forEach((freq, idx) => {
      const envelope = Math.sin((t % 2.5) * Math.PI / 2.5);
      val += Math.sin(2 * Math.PI * freq * t + idx) * 0.15 * envelope;
    });

    leftChannel[i] = val;
    rightChannel[i] = val * 0.95;
  }

  // Convert buffer to WAV Blob
  const wavBlob = audioBufferToWavBlob(buffer);
  const file = new File([wavBlob], 'demo_lofi_melody.wav', { type: 'audio/wav' });
  return { file, duration: durationSec };
}

/**
 * Encodes an AudioBuffer to standard uncompressed 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}
