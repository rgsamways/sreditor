import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = resolve(__dirname, '..', '..', 'src');
const ENTRY = join(SRC_ROOT, 'commands', 'explore.ts');

const FORBIDDEN = [
  join(SRC_ROOT, 'paths.ts'),
  join(SRC_ROOT, 'persistence', 'jsonl.ts'),
  join(SRC_ROOT, 'rollup.ts'),
  join(SRC_ROOT, 'anchor.ts'),
];

const RELATIVE_IMPORT_RE = /(?:import|export)\s+(?:[^'"]*\sfrom\s+)?['"](\.[^'"]+)['"]/g;

function resolveModulePath(fromFile: string, spec: string): string {
  const withoutExt = spec.endsWith('.js') ? spec.slice(0, -3) : spec;
  return resolve(dirname(fromFile), `${withoutExt}.ts`);
}

// Real static traversal of explore.ts's relative-import graph, not a
// documented rule someone could forget to follow -- see spec.md's "Inspecting
// explore's dependencies" scenario and design.md's "Structural separation
// enforced by module boundary" decision.
function collectImportGraph(entry: string, visited = new Set<string>()): Set<string> {
  if (visited.has(entry)) {
    return visited;
  }
  visited.add(entry);

  const contents = readFileSync(entry, 'utf-8');
  for (const match of contents.matchAll(RELATIVE_IMPORT_RE)) {
    const spec = match[1];
    if (!spec) continue;
    const importPath = resolveModulePath(entry, spec);
    collectImportGraph(importPath, visited);
  }
  return visited;
}

describe('explore.ts import isolation', () => {
  it('never imports the judgment pipeline\'s read/write helpers', () => {
    const graph = collectImportGraph(ENTRY);

    for (const forbidden of FORBIDDEN) {
      expect(graph.has(forbidden)).toBe(false);
    }
  });

  it('sanity check: the traversal actually finds a real forbidden import when planted', () => {
    // Guards against the regex/resolution logic silently matching nothing --
    // without this, the test above would pass even if `collectImportGraph`
    // were broken and returned an empty graph for everything.
    const graph = collectImportGraph(join(SRC_ROOT, 'commands', 'judge.ts'));
    expect(graph.has(join(SRC_ROOT, 'paths.ts'))).toBe(true);
  });
});
