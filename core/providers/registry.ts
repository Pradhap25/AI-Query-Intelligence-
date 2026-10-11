/**
 * AI Query Intelligence - Provider Registry
 */

import { ProviderConfig } from '../types';
import { BaseProvider } from './base';
import { OllamaProvider } from './ollama';
import { OpenAICompatibleProvider } from './openai-compatible';

export class ProviderRegistry {
  public static createProvider(config: ProviderConfig): BaseProvider {
    switch (config.provider) {
      case 'ollama':
        return new OllamaProvider(config);
      case 'openai-compatible':
        return new OpenAICompatibleProvider(config);
      default:
        return new OllamaProvider(config);
    }
  }
}
