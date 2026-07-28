import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLAUDE_MD_SECTION, openSpecConfigExists, writeClaudeMdNote } from '../src/scaffold.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-scaffold-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('openSpecConfigExists', () => {
  it('returns false when there is no openspec/config.yaml', () => {
    expect(openSpecConfigExists(dir)).toBe(false);
  });

  it('returns true once openspec/config.yaml exists', () => {
    mkdirSync(join(dir, 'openspec'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'config.yaml'), 'schema: spec-driven\n', 'utf-8');
    expect(openSpecConfigExists(dir)).toBe(true);
  });
});

describe('writeClaudeMdNote', () => {
  it('reports no-claude-md and writes nothing when CLAUDE.md is absent', () => {
    expect(writeClaudeMdNote(dir)).toBe('no-claude-md');
  });

  it('appends the Sreditor section to an existing CLAUDE.md', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), '# Project notes\n', 'utf-8');

    expect(writeClaudeMdNote(dir)).toBe('appended');

    const text = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(text).toContain('# Project notes');
    expect(text).toContain(CLAUDE_MD_SECTION);
  });

  it('does not duplicate the section on a second run', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), '# Project notes\n', 'utf-8');

    writeClaudeMdNote(dir);
    const result = writeClaudeMdNote(dir);

    expect(result).toBe('already-present');
    const text = readFileSync(join(dir, 'CLAUDE.md'), 'utf-8');
    expect(text.match(/## Sreditor/g)?.length).toBe(1);
  });
});
