import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFancyTty, spin } from '../src/cliUi.js';

function fakeStream(isTTY: boolean): NodeJS.WriteStream {
  return { isTTY } as unknown as NodeJS.WriteStream;
}

describe('isFancyTty', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is true for a TTY stream with no NO_COLOR/CI set', () => {
    expect(isFancyTty(fakeStream(true))).toBe(true);
  });

  it('is false when the stream is not a TTY', () => {
    expect(isFancyTty(fakeStream(false))).toBe(false);
  });

  it('is false when NO_COLOR is set', () => {
    vi.stubEnv('NO_COLOR', '1');
    expect(isFancyTty(fakeStream(true))).toBe(false);
  });

  it('is false when CI is set', () => {
    vi.stubEnv('CI', 'true');
    expect(isFancyTty(fakeStream(true))).toBe(false);
  });
});

describe('spin', () => {
  it('calls work exactly once and returns its value in the non-fancy branch', async () => {
    const work = vi.fn().mockResolvedValue('result');
    const result = await spin('label', work, () => false);
    expect(work).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('propagates a thrown error in the non-fancy branch', async () => {
    const work = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(spin('label', work, () => false)).rejects.toThrow('boom');
  });
});
