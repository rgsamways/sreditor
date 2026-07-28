import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  findArchivingCommit,
  findDraftCreationCommit,
  getChangedFilesInRange,
  resolveImplementationWindow,
} from '../../src/tools/gitDiff.js';

let dir: string;

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf-8' });
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sreditor-gitdiff-'));
  git(['init', '-q']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);

  writeFileSync(join(dir, 'README.md'), '# test repo\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'initial commit']);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('findArchivingCommit', () => {
  it('finds the commit that added an archive folder', () => {
    mkdirSync(join(dir, 'openspec', 'changes', 'archive', 'my-change'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'changes', 'archive', 'my-change', 'proposal.md'), '## Why\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'archive my-change']);

    const expectedSha = git(['rev-parse', 'HEAD']).trim();
    expect(findArchivingCommit(dir, 'my-change')).toBe(expectedSha);
  });

  it('returns null for a change that was never committed', () => {
    expect(findArchivingCommit(dir, 'nonexistent-change')).toBeNull();
  });
});

describe('findDraftCreationCommit', () => {
  it('finds the commit that first added the draft proposal.md', () => {
    mkdirSync(join(dir, 'openspec', 'changes', 'my-change'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'changes', 'my-change', 'proposal.md'), '## Why\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'propose my-change']);
    const expectedSha = git(['rev-parse', 'HEAD']).trim();

    writeFileSync(join(dir, 'openspec', 'changes', 'my-change', 'tasks.md'), '- [ ] task\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add tasks']);

    expect(findDraftCreationCommit(dir, 'my-change')).toBe(expectedSha);
  });

  it('returns null for a change with no draft commit', () => {
    expect(findDraftCreationCommit(dir, 'nonexistent-change')).toBeNull();
  });
});

describe('getChangedFilesInRange', () => {
  it('lists the files changed across a commit range', () => {
    writeFileSync(join(dir, 'a.ts'), 'export const a = 1;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add a.ts']);
    const startSha = git(['rev-parse', 'HEAD']).trim();

    writeFileSync(join(dir, 'b.ts'), 'export const b = 2;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'add b.ts']);
    const endSha = git(['rev-parse', 'HEAD']).trim();

    expect(getChangedFilesInRange(dir, `${startSha}^`, endSha)).toEqual(['a.ts', 'b.ts']);
  });

  it('returns an empty array for an invalid range', () => {
    expect(getChangedFilesInRange(dir, 'not-a-ref', 'also-not-a-ref')).toEqual([]);
  });
});

describe('resolveImplementationWindow', () => {
  it('spans from the draft commit through the archiving commit when both exist', () => {
    mkdirSync(join(dir, 'openspec', 'changes', 'my-change'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'changes', 'my-change', 'proposal.md'), '## Why\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'propose my-change']);
    const draftSha = git(['rev-parse', 'HEAD']).trim();

    writeFileSync(join(dir, 'src.ts'), 'export const x = 1;\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'implement my-change']);

    mkdirSync(join(dir, 'openspec', 'changes', 'archive'), { recursive: true });
    git(['mv', join('openspec', 'changes', 'my-change'), join('openspec', 'changes', 'archive', 'my-change')]);
    git(['commit', '-q', '-m', 'archive my-change']);
    const archiveSha = git(['rev-parse', 'HEAD']).trim();

    const window = resolveImplementationWindow(dir, 'my-change', archiveSha);
    expect(window).toEqual({ fromRef: `${draftSha}^`, toRef: archiveSha });
    expect(getChangedFilesInRange(dir, window.fromRef, window.toRef)).toContain('src.ts');
  });

  it('falls back to the archiving commit alone when no draft commit is found', () => {
    mkdirSync(join(dir, 'openspec', 'changes', 'archive', 'my-change'), { recursive: true });
    writeFileSync(join(dir, 'openspec', 'changes', 'archive', 'my-change', 'proposal.md'), '## Why\n');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'archive my-change']);
    const archiveSha = git(['rev-parse', 'HEAD']).trim();

    expect(resolveImplementationWindow(dir, 'my-change', archiveSha)).toEqual({
      fromRef: `${archiveSha}^`,
      toRef: archiveSha,
    });
  });
});
