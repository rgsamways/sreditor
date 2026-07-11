import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openSpecAdapter } from '../../src/adapters/openspec.js';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));
const emptyDir = fileURLToPath(new URL('..', import.meta.url));

describe('openSpecAdapter', () => {
  it('reports available when openspec/changes/archive exists', () => {
    expect(openSpecAdapter.isAvailable(fixturesDir)).toBe(true);
  });

  it('reports unavailable when there is no openspec archive', () => {
    expect(openSpecAdapter.isAvailable(emptyDir)).toBe(false);
  });

  it('lists archived changes with their artifact files loaded', () => {
    const changes = openSpecAdapter.listChanges(fixturesDir);

    expect(changes).toHaveLength(1);
    expect(changes[0]?.id).toBe('example-change');
    expect(changes[0]?.path).toBe(
      join(fixturesDir, 'openspec', 'changes', 'archive', 'example-change'),
    );
    expect(Object.keys(changes[0]?.files ?? {})).toEqual(['proposal.md', 'tasks.md']);
    expect(changes[0]?.files['proposal.md']).toContain('Technical Uncertainty');
  });

  it('returns an empty list when the archive directory does not exist', () => {
    expect(openSpecAdapter.listChanges(emptyDir)).toEqual([]);
  });
});
