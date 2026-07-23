import * as clack from '@clack/prompts';

export interface Interview {
  ask(question: string): Promise<string>;
  confirm(prompt: string): Promise<boolean>;
  close(): void;
}

function handleCancel<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }
  return value;
}

export function startInterview(): Interview {
  return {
    async ask(question: string): Promise<string> {
      const answer = await clack.text({ message: question });
      return handleCancel(answer);
    },
    async confirm(prompt: string): Promise<boolean> {
      const answer = await clack.confirm({ message: prompt });
      return handleCancel(answer);
    },
    close(): void {},
  };
}
