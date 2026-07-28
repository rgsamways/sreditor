import * as clack from '@clack/prompts';
import pc from 'picocolors';

export function isFancyTty(stream: NodeJS.WriteStream = process.stdout): boolean {
  return stream.isTTY === true && process.env.NO_COLOR === undefined && process.env.CI === undefined;
}

// picocolors force-enables color on win32 regardless of TTY (a deliberate legacy-cmd.exe
// workaround upstream), so it can't be trusted to no-op for piped/non-TTY output on Windows —
// gate it through our own isFancyTty() check instead of the library's default detection.
const picocolors = pc.createColors(isFancyTty());

export const c = {
  green: picocolors.green,
  red: picocolors.red,
  yellow: picocolors.yellow,
  gray: picocolors.gray,
  cyan: picocolors.cyan,
  bold: picocolors.bold,
  dim: picocolors.dim,
};

export const icons = {
  ok: '✓',
  fail: '✗',
  info: '·',
  warn: '⚠',
};

export async function spin<T>(
  label: string,
  work: () => Promise<T>,
  fancy: () => boolean = isFancyTty,
): Promise<T> {
  if (!fancy()) {
    console.log(label);
    return work();
  }

  const s = clack.spinner();
  s.start(label);
  try {
    const result = await work();
    s.stop(label);
    return result;
  } catch (error) {
    s.error(label);
    throw error;
  }
}

export interface ProgressBar {
  /** Advance the bar by `step` units (0 to just update the message) and optionally update its label. */
  advance(step: number, msg?: string): void;
  stop(msg?: string): void;
}

export function createProgress(label: string, max: number, fancy: () => boolean = isFancyTty): ProgressBar {
  let done = 0;
  const pct = () => (max > 0 ? Math.round((done / max) * 100) : 100);

  if (!fancy() || max <= 0) {
    console.log(label);
    return {
      advance(step, msg) {
        done += step;
        if (step > 0) {
          console.log(c.dim(`  [${done}/${max}] ${pct()}%${msg ? ` — ${msg}` : ''}`));
        }
      },
      stop(msg) {
        if (msg) console.log(msg);
      },
    };
  }

  const bar = clack.progress({ style: 'heavy', max });
  bar.start(label);
  return {
    advance(step, msg) {
      done += step;
      bar.advance(step, msg ? `${msg} (${pct()}%)` : `${pct()}%`);
    },
    stop(msg) {
      bar.stop(msg);
    },
  };
}

export function heading(message: string): void {
  console.log(c.bold(message));
}

export function note(message: string): void {
  console.log(c.dim(message));
}
