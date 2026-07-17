import { describe, expect, it } from 'vitest';
import { isRateLimited } from '../src/rateLimit.js';

describe('isRateLimited', () => {
  it('allows requests under the limit', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 30; i += 1) {
      expect(isRateLimited(ip)).toBe(false);
    }
  });

  it('blocks a request once the same IP exceeds the limit within the window', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 30; i += 1) {
      isRateLimited(ip);
    }
    expect(isRateLimited(ip)).toBe(true);
  });

  it('tracks different IPs independently', () => {
    const busyIp = '10.0.0.3';
    for (let i = 0; i < 31; i += 1) {
      isRateLimited(busyIp);
    }
    expect(isRateLimited('10.0.0.4')).toBe(false);
  });
});
