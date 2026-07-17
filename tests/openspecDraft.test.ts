import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  appendProbeSection,
  findDraftChange,
  hasExistingProbeSection,
  readDraftProposal,
} from '../src/openspecDraft.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-openspec-draft-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function makeDraftChange(cwd: string, changeId: string, proposalText: string): void {
  const changeDir = join(cwd, 'openspec', 'changes', changeId);
  mkdirSync(changeDir, { recursive: true });
  writeFileSync(join(changeDir, 'proposal.md'), proposalText, 'utf-8');
}

describe('findDraftChange', () => {
  it('returns the proposal path when the draft change exists', () => {
    makeDraftChange(dir, 'add-thing', '## Why\n\nBecause.\n');

    expect(findDraftChange(dir, 'add-thing')).toBe(
      join(dir, 'openspec', 'changes', 'add-thing', 'proposal.md'),
    );
  });

  it('returns null when the change directory does not exist', () => {
    expect(findDraftChange(dir, 'nonexistent')).toBeNull();
  });

  it('returns null when the change has already been archived (no draft dir left)', () => {
    const archiveChangeDir = join(dir, 'openspec', 'changes', 'archive', 'add-thing');
    mkdirSync(archiveChangeDir, { recursive: true });
    writeFileSync(join(archiveChangeDir, 'proposal.md'), '## Why\n\nBecause.\n', 'utf-8');

    expect(findDraftChange(dir, 'add-thing')).toBeNull();
  });
});

describe('readDraftProposal', () => {
  it('reads the draft proposal text', () => {
    makeDraftChange(dir, 'add-thing', '## Why\n\nBecause.\n');

    expect(readDraftProposal(dir, 'add-thing')).toBe('## Why\n\nBecause.\n');
  });

  it('returns null when the draft does not exist', () => {
    expect(readDraftProposal(dir, 'nonexistent')).toBeNull();
  });
});

describe('appendProbeSection', () => {
  it('appends a labeled probe section without altering prior content', () => {
    makeDraftChange(dir, 'add-thing', '## Why\n\nBecause.\n');

    appendProbeSection(dir, 'add-thing', '**Uncertainty:** none found');

    const text = readDraftProposal(dir, 'add-thing') ?? '';
    expect(text.startsWith('## Why\n\nBecause.\n')).toBe(true);
    expect(text).toContain('## Articulated Uncertainty (probe)');
    expect(text).toContain('**Uncertainty:** none found');
  });

  it('throws when the draft change does not exist', () => {
    expect(() => appendProbeSection(dir, 'nonexistent', 'text')).toThrow();
  });
});

describe('hasExistingProbeSection', () => {
  it('returns false when there is no probe section', () => {
    expect(hasExistingProbeSection('## Why\n\nBecause.\n')).toBe(false);
  });

  it('returns true when a probe section is already present', () => {
    const text = '## Why\n\nBecause.\n\n## Articulated Uncertainty (probe)\n\n**Uncertainty:** none found\n';
    expect(hasExistingProbeSection(text)).toBe(true);
  });
});
