import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { sreditorDir } from './paths.js';

export function anchorPath(cwd: string): string {
  return join(sreditorDir(cwd), 'anchor.md');
}

export function readAnchor(cwd: string): string | null {
  const filePath = anchorPath(cwd);
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf-8');
}

export function createAnchor(cwd: string, summary: string, heading: string, body: string): void {
  const filePath = anchorPath(cwd);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const section = `## ${heading}\n\n${body.trim()}\n`;
  writeFileSync(filePath, `# Anchor: ${summary}\n\n${section}`, 'utf-8');
}

export function appendRevision(cwd: string, heading: string, body: string): void {
  const filePath = anchorPath(cwd);
  const section = `## ${heading}\n\n${body.trim()}\n`;
  appendFileSync(filePath, `\n${section}`, 'utf-8');
}

export function countRevisions(anchorText: string): number {
  return (anchorText.match(/^## /gm) ?? []).length;
}

export function lastRevisionHeading(anchorText: string): string | null {
  const matches = [...anchorText.matchAll(/^## (.+)$/gm)];
  const last = matches.at(-1);
  return last?.[1] ? last[1].trim() : null;
}
