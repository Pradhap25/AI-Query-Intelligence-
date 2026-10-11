/**
 * AI Query Intelligence - Ollama Provider
 * Connects to Ollama (http://localhost:11434) for local inference.
 */

import { ConnectionTestResult, ProviderConfig } from '../types';
import { BaseProvider, ProviderRequest } from './base';

export class OllamaProvider extends BaseProvider {
  public readonly id = 'ollama';
  public readonly name = 'Ollama (Local)';

  public get isLocal(): boolean {
    const ep = this.config.endpoint.toLowerCase();
    return (
      ep.includes('localhost') ||
      ep.includes('127.0.0.1') ||
      ep.includes('0.0.0.0') ||
      ep.includes('::1')
    );
  }

  constructor(config: ProviderConfig) {
    super(config);
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const endpoint = this.normalizeEndpoint(this.config.endpoint);

    try {
      const response = await this.fetchWithRetry(
        `${endpoint}/api/tags`,
        { method: 'GET' },
        0, // No retries for test
        5000 // 5s timeout for healthcheck
      );

      if (!response.ok) {
        return {
          ok: false,
          isLocal: this.isLocal,
          message: `Ollama returned HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      const models = data.models ? data.models.map((m) => m.name) : [];
      const latencyMs = Date.now() - startTime;

      const configuredModelExists = models.some(
        (m) =>
          m === this.config.model ||
          m === `${this.config.model}:latest` ||
          m.startsWith(`${this.config.model}:`)
      );

      let message = `Connected to Ollama (${latencyMs}ms). ${models.length} models available.`;
      if (!configuredModelExists && this.config.model) {
        message += ` Note: Model '${this.config.model}' was not found in downloaded models. Run 'ollama pull ${this.config.model}'.`;
      }

      return {
        ok: true,
        isLocal: this.isLocal,
        message,
        latencyMs,
        availableModels: models,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          ok: false,
          isLocal: this.isLocal,
          message: `Connection timed out connecting to Ollama at ${endpoint}.`,
        };
      }
      return {
        ok: false,
        isLocal: this.isLocal,
        message: `Ollama is not running at ${endpoint}. Start Ollama or check the URL.`,
      };
    }
  }

  public async generateReconstruction(request: ProviderRequest): Promise<string> {
    const endpoint = this.normalizeEndpoint(this.config.endpoint);

    const payload = {
      model: this.config.model || 'qwen2.5:14b',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      stream: false,
      options: {
        temperature: this.config.temperature,
        num_predict: this.config.maxTokens,
      },
    };

    try {
      const response = await this.fetchWithRetry(
        `${endpoint}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: request.signal,
        },
        this.config.retries,
        this.config.timeoutMs
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          throw new Error(
            `Model '${this.config.model}' not found in Ollama. Run: ollama pull ${this.config.model}`
          );
        }
        if (errorText.toLowerCase().includes('out of memory') || errorText.toLowerCase().includes('oom')) {
          throw new Error(
            `Ollama out of memory loading '${this.config.model}'. Try a smaller model like qwen2.5:7b or reduce context.`
          );
        }
        throw new Error(`Ollama error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as { message?: { content: string }; response?: string };
      const output = data.message?.content || data.response || '';
      return output.trim();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Ollama request timed out after ${this.config.timeoutMs}ms. You can increase the timeout in Options.`
        );
      }
      throw err;
    }
  }

  private normalizeEndpoint(ep: string): string {
    return ep.replace(/\/+$/, '');
  }
}
