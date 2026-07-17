import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getOrCreateInstallId, readStatsConfig, setStatsOptIn } from '../src/statsConfig.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-stats-config-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('readStatsConfig', () => {
  it('defaults to opted-out with no install id when no config file exists', () => {
    expect(readStatsConfig(dir)).toEqual({ statsOptIn: false, installId: null });
  });
});

describe('setStatsOptIn', () => {
  it('persists opt-in and generates an install id', () => {
    const config = setStatsOptIn(dir, true);
    expect(config.statsOptIn).toBe(true);
    expect(config.installId).toMatch(/^[0-9a-f-]{36}$/);
    expect(readStatsConfig(dir)).toEqual(config);
  });

  it('reuses the same install id across repeated opt-ins', () => {
    const first = setStatsOptIn(dir, true);
    setStatsOptIn(dir, false);
    const second = setStatsOptIn(dir, true);
    expect(second.installId).toBe(first.installId);
  });

  it('opting out flips the flag without deleting the install id', () => {
    const opted = setStatsOptIn(dir, true);
    const optedOut = setStatsOptIn(dir, false);
    expect(optedOut.statsOptIn).toBe(false);
    expect(optedOut.installId).toBe(opted.installId);
  });
});

describe('getOrCreateInstallId', () => {
  it('creates an id on first call and reuses it on subsequent calls', () => {
    const first = getOrCreateInstallId(dir);
    const second = getOrCreateInstallId(dir);
    expect(first).toBe(second);
  });
});
