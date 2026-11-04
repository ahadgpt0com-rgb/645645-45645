import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, parseTime, clamp, formatDurationHuman } from './time.ts';

test('formatTime produces correct HH:MM:SS.mmm format', () => {
  assert.equal(formatTime(0), '00:00:00.000');
  assert.equal(formatTime(65.123), '00:01:05.123');
  assert.equal(formatTime(3661.005), '01:01:01.005');
  assert.equal(formatTime(3661.005, false), '01:01:01');
});

test('parseTime handles full HH:MM:SS.mmm and MM:SS.mmm strings', () => {
  assert.equal(parseTime('00:00:00.000'), 0);
  assert.equal(parseTime('00:01:05.500'), 65.5);
  assert.equal(parseTime('01:00.5'), 60.5);
  assert.equal(parseTime('45.2'), 45.2);
  assert.equal(parseTime('01:01:01'), 3661);
  assert.ok(isNaN(parseTime('invalid-string')));
});

test('clamp restricts numbers within boundaries', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test('formatDurationHuman displays readable strings', () => {
  assert.equal(formatDurationHuman(15.2), '15.2s');
  assert.equal(formatDurationHuman(90), '1m 30.0s');
  assert.equal(formatDurationHuman(3665), '1h 1m 5.0s');
});
