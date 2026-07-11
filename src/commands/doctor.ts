import { accessSync, constants, existsSync, mkdirSync } from 'node:fs';
import { openSpecAdapter } from '../adapters/openspec.js';
import { sreditorDir } from '../paths.js';
import { isToolAvailable } from '../tools/detect.js';

interface Check {
  label: string;
  ok: boolean;
  detail: string;
  informational?: boolean;
}

const OPTIONAL_TOOLS: { command: string; label: string; installHint: string }[] = [
  { command: 'scc', label: 'scc (optional)', installHint: 'https://github.com/boyter/scc' },
  { command: 'jscpd', label: 'jscpd (optional)', installHint: 'npm install -g jscpd' },
  { command: 'sem', label: 'sem (optional)', installHint: 'https://github.com/ataraxy-labs/sem' },
];

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

  for (const tool of OPTIONAL_TOOLS) {
    const available = isToolAvailable(tool.command);
    checks.push({
      label: tool.label,
      ok: available,
      detail: available ? 'found' : `not found — richer judgment context if installed (${tool.installHint})`,
      informational: true,
    });
  }

  let allOk = true;
  for (const check of checks) {
    const icon = check.ok ? '✓' : check.informational ? '·' : '✗';
    console.log(`${icon} ${check.label}: ${check.detail}`);
    if (!check.ok && !check.informational) allOk = false;
  }

  if (!allOk) {
    process.exitCode = 1;
  }
}
