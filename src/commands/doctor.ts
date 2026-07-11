import { accessSync, constants, existsSync, mkdirSync } from 'node:fs';
import { openSpecAdapter } from '../adapters/openspec.js';
import { sreditorDir } from '../paths.js';

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export function doctor(cwd: string): void {
  const checks: Check[] = [];

  const [major] = process.versions.node.split('.').map(Number);
  checks.push({
    label: 'Node.js version',
    ok: (major ?? 0) >= 18,
    detail: `v${process.versions.node} (need >= 18)`,
  });

  const adapterAvailable = openSpecAdapter.isAvailable(cwd);
  checks.push({
    label: 'OpenSpec source detected',
    ok: adapterAvailable,
    detail: adapterAvailable
      ? 'openspec/changes/archive/ found'
      : 'openspec/changes/archive/ not found',
  });

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  checks.push({
    label: 'ANTHROPIC_API_KEY set',
    ok: hasApiKey,
    detail: hasApiKey ? 'present' : 'not set (required before running judge)',
  });

  const dir = sreditorDir(cwd);
  let writable = true;
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    accessSync(dir, constants.W_OK);
  } catch {
    writable = false;
  }
  checks.push({
    label: '.sreditor/ writable',
    ok: writable,
    detail: writable ? dir : `cannot write to ${dir}`,
  });

  let allOk = true;
  for (const check of checks) {
    const icon = check.ok ? '✓' : '✗';
    console.log(`${icon} ${check.label}: ${check.detail}`);
    if (!check.ok) allOk = false;
  }

  if (!allOk) {
    process.exitCode = 1;
  }
}
