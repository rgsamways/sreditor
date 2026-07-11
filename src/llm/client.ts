import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-sonnet-5';

// Standard (non-introductory) per-MTok pricing, used for cost estimates so they
// don't quietly go stale when temporary intro pricing expires.
export const MODEL_INPUT_PRICE_PER_MTOK = 3;
export const MODEL_OUTPUT_PRICE_PER_MTOK = 15;

export function createClient(): Anthropic {
  return new Anthropic();
}
