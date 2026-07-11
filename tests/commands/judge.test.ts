import { describe, expect, it } from 'vitest';
import { selectChangesToJudge } from '../../src/commands/judge.js';
import type { ChangeArtifact } from '../../src/adapters/types.js';

function change(id: string): ChangeArtifact {
  return { id, path: `/tmp/${id}`, files: {} };
}

describe('selectChangesToJudge', () => {
  const changes = [change('a'), change('b'), change('c')];

  it('selects only unjudged changes when no target id is given', () => {
    const result = selectChangesToJudge(changes, new Set(['a']));
    expect(result.map((c) => c.id)).toEqual(['b', 'c']);
  });

  it('returns an empty array when everything is already judged', () => {
    const result = selectChangesToJudge(changes, new Set(['a', 'b', 'c']));
    expect(result).toEqual([]);
  });

  it('re-judges a specific change by id even if already judged', () => {
    const result = selectChangesToJudge(changes, new Set(['a', 'b', 'c']), 'b');
    expect(result.map((c) => c.id)).toEqual(['b']);
  });

  it('throws for an unknown change id', () => {
    expect(() => selectChangesToJudge(changes, new Set(), 'nonexistent')).toThrow(/nonexistent/);
  });
});
