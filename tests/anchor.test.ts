import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendRevision, countRevisions, createAnchor, lastRevisionHeading, readAnchor } from '../src/anchor.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-anchor-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('anchor document', () => {
  it('returns null when no anchor exists', () => {
    expect(readAnchor(dir)).toBeNull();
  });

  it('creates an anchor with a header and first revision', () => {
    createAnchor(dir, 'Offline-first sync for field inspectors', 'Revision 2026-07-11 (original)', '**Goal:** ...');

    const text = readAnchor(dir);
    expect(text).toContain('# Anchor: Offline-first sync for field inspectors');
    expect(text).toContain('## Revision 2026-07-11 (original)');
    expect(countRevisions(text ?? '')).toBe(1);
  });

  it('appends a revision without altering prior content', () => {
    createAnchor(dir, 'Summary', 'Revision 2026-07-11 (original)', '**Goal:** original goal');
    const before = readAnchor(dir);

    appendRevision(dir, 'Revision 2026-08-02', '**What changed:** scope narrowed');

    const after = readAnchor(dir) ?? '';
    expect(after.startsWith(before ?? '')).toBe(true);
    expect(after).toContain('## Revision 2026-08-02');
    expect(countRevisions(after)).toBe(2);
    expect(lastRevisionHeading(after)).toBe('Revision 2026-08-02');
  });
});
