import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { sreditorDir } from './paths.js';

export interface StatsConfig {
  statsOptIn: boolean;
  installId: string | null;
}

const DEFAULT_CONFIG: StatsConfig = { statsOptIn: false, installId: null };

export function statsConfigFile(cwd: string): string {
  return join(sreditorDir(cwd), 'config.json');
}

export function readStatsConfig(cwd: string): StatsConfig {
  const filePath = statsConfigFile(cwd);
  if (!existsSync(filePath)) {
    return { ...DEFAULT_CONFIG };
  }
  const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<StatsConfig>;
  return {
    statsOptIn: parsed.statsOptIn ?? DEFAULT_CONFIG.statsOptIn,
    installId: parsed.installId ?? DEFAULT_CONFIG.installId,
  };
}

export function writeStatsConfig(cwd: string, config: StatsConfig): void {
  const filePath = statsConfigFile(cwd);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function getOrCreateInstallId(cwd: string): string {
  const config = readStatsConfig(cwd);
  if (config.installId) {
    return config.installId;
  }
  const installId = randomUUID();
  writeStatsConfig(cwd, { ...config, installId });
  return installId;
}

export function setStatsOptIn(cwd: string, statsOptIn: boolean): StatsConfig {
  const config = readStatsConfig(cwd);
  const installId = statsOptIn ? getOrCreateInstallId(cwd) : config.installId;
  const next: StatsConfig = { statsOptIn, installId };
  writeStatsConfig(cwd, next);
  return next;
}
