import { describe, it, expect } from 'vitest';
import { OllamaProvider } from '../../core/providers/ollama';
import { OpenAICompatibleProvider } from '../../core/providers/openai-compatible';
import { ProviderRegistry } from '../../core/providers/registry';
import { DEFAULT_SETTINGS } from '../../core/types';

describe('Provider Abstraction Layer', () => {
  it('correctly identifies local vs remote endpoints for Ollama', () => {
    const localOllama = new OllamaProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      endpoint: 'http://localhost:11434',
    });
    expect(localOllama.isLocal).toBe(true);

    const remoteOllama = new OllamaProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      endpoint: 'https://remote-gpu.mycompany.org:11434',
    });
    expect(remoteOllama.isLocal).toBe(false);
  });

  it('correctly identifies local vs remote for OpenAI-compatible', () => {
    const lmStudio = new OpenAICompatibleProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      provider: 'openai-compatible',
      endpoint: 'http://127.0.0.1:1234/v1',
    });
    expect(lmStudio.isLocal).toBe(true);

    const remoteOpenAI = new OpenAICompatibleProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      provider: 'openai-compatible',
      endpoint: 'https://api.groq.com/openai/v1',
    });
    expect(remoteOpenAI.isLocal).toBe(false);
  });

  it('ProviderRegistry instantiates the requested provider type', () => {
    const p1 = ProviderRegistry.createProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      provider: 'ollama',
    });
    expect(p1.id).toBe('ollama');

    const p2 = ProviderRegistry.createProvider({
      ...DEFAULT_SETTINGS.providerConfig,
      provider: 'openai-compatible',
    });
    expect(p2.id).toBe('openai-compatible');
  });
});
