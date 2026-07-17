import Anthropic from '@anthropic-ai/sdk';

// This is Sreditor's own infra cost, paid centrally against this service's
// own ANTHROPIC_API_KEY -- unlike judge/probe/rollup in the main CLI package,
// which run BYOK against the developer's own key. See design.md's "Context"
// section for why that distinction matters here.
export const DEFAULT_MODEL = 'claude-sonnet-5';

export function createClient(): Anthropic {
  return new Anthropic();
}
