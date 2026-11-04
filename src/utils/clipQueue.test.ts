import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClipRange, createClip } from './clipQueue.ts';

test('validateClipRange adjusts inverted start/end times correctly', () => {
  const mediaDuration = 60;
  // Inverted start/end
  const result = validateClipRange(40, 20, mediaDuration);
  assert.ok(result.startTime < result.endTime);
  assert.ok(result.duration > 0);
});

test('validateClipRange clamps within media bounds', () => {
  const result = validateClipRange(-10, 100, 50);
  assert.equal(result.startTime, 0);
  assert.equal(result.endTime, 50);
  assert.equal(result.duration, 50);
});

test('createClip generates valid clip object with id and duration', () => {
  const clip = createClip('media_1', 'Highlight Reel', 5.5, 15.2, 120);
  assert.equal(clip.mediaId, 'media_1');
  assert.equal(clip.title, 'Highlight Reel');
  assert.equal(clip.startTime, 5.5);
  assert.equal(clip.endTime, 15.2);
  assert.equal(clip.duration, 9.7);
  assert.ok(clip.id.startsWith('clip_'));
  assert.ok(clip.color);
});
