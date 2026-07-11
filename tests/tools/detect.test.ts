import { describe, expect, it } from 'vitest';
import { isToolAvailable } from '../../src/tools/detect.js';

describe('isToolAvailable', () => {
  it('returns true for a command that is definitely on PATH', () => {
    expect(isToolAvailable('node')).toBe(true);
  });

  it('returns false for a command that does not exist', () => {
    expect(isToolAvailable('definitely-not-a-real-command-xyz123')).toBe(false);
  });
});
