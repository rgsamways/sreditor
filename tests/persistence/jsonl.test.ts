import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendJsonl, readJsonl } from '../../src/persistence/jsonl.js';

interface Record_ {
  id: string;
  value: number;
}

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-jsonl-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('jsonl persistence', () => {
  it('returns an empty array when the file does not exist', () => {
    expect(readJsonl(join(dir, 'missing.jsonl'))).toEqual([]);
  });

  it('creates the parent directory and appends records', () => {
    const filePath = join(dir, 'nested', 'judgments.jsonl');

    appendJsonl<Record_>(filePath, { id: 'a', value: 1 });
    appendJsonl<Record_>(filePath, { id: 'b', value: 2 });

    expect(readJsonl<Record_>(filePath)).toEqual([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ]);
  });

  it('ignores trailing blank lines', () => {
    const filePath = join(dir, 'judgments.jsonl');
    appendJsonl<Record_>(filePath, { id: 'a', value: 1 });

    expect(readJsonl<Record_>(filePath)).toHaveLength(1);
  });
});
