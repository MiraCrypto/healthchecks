import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isCheckHealthy } from './checkUtils.js';

describe('isCheckHealthy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true if no lastPing', () => {
    expect(isCheckHealthy({ lastPing: null, intervalSeconds: 60, graceSeconds: 60 })).toBe(true);
  });

  it('should return true if within interval + grace period', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    const lastPing = new Date(now.getTime() - 50 * 1000).toISOString();
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(true);
  });

  it('should return false if outside interval + grace period', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    const lastPing = new Date(now.getTime() - 130 * 1000).toISOString();
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(false);
  });

  it('should return true if exactly at interval boundary', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    const lastPing = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(true);
  });

  it('should return true if within grace period', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    const lastPing = new Date(now.getTime() - 110 * 1000).toISOString(); // > 60s, < 120s
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(true);
  });

  it('should return false if exactly at expiration time', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    // time has to be exactly expirationTime
    // expirationTime = pingTime + 120,000
    // so pingTime = now - 120,000
    const lastPing = new Date(now.getTime() - 120 * 1000).toISOString();
    // now < expirationTime is false since now == expirationTime
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(false);
  });

  it('should return false if way past expiration time', () => {
    const now = new Date('2026-05-27T12:00:00Z');
    vi.setSystemTime(now);

    const lastPing = new Date(now.getTime() - 3600 * 1000).toISOString();
    expect(isCheckHealthy({ lastPing, intervalSeconds: 60, graceSeconds: 60 })).toBe(false);
  });
});
