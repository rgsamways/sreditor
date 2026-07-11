import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export interface Interview {
  ask(question: string): Promise<string>;
  confirm(prompt: string): Promise<boolean>;
  close(): void;
}

export function startInterview(): Interview {
  const rl = createInterface({ input: stdin, output: stdout });
  const lines = rl[Symbol.asyncIterator]();

  async function ask(question: string): Promise<string> {
    stdout.write(`${question}\n> `);
    const { value, done } = await lines.next();
    return done ? '' : value.trim();
  }

  return {
    ask,
    async confirm(prompt: string): Promise<boolean> {
      const answer = await ask(`${prompt} [y/n]`);
      return answer.toLowerCase().startsWith('y');
    },
    close(): void {
      rl.close();
    },
  };
}
