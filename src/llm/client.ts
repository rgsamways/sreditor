import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-sonnet-5';

export function createClient(): Anthropic {
  return new Anthropic();
}
