/**
 * AI Query Intelligence - OpenAI-Compatible Provider
 * Supports LM Studio, vLLM, LocalAI, OpenRouter, and remote endpoints.
 */

import { ConnectionTestResult, ProviderConfig } from '../types';
import { BaseProvider, ProviderRequest } from './base';

export class OpenAICompatibleProvider extends BaseProvider {
  public readonly id = 'openai-compatible';
  public readonly name = 'OpenAI-Compatible (LM Studio / vLLM / Remote)';

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await this.fetchWithRetry(
        `${endpoint}/models`,
        { method: 'GET', headers },
        0,
        5000
      );

      if (!response.ok) {
        return {
          ok: false,
          isLocal: this.isLocal,
          message: `Endpoint returned HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as { data?: Array<{ id: string }> };
      const models = data.data ? data.data.map((m) => m.id) : [];
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        isLocal: this.isLocal,
        message: `Connected successfully (${latencyMs}ms). ${models.length} models found.`,
        latencyMs,
        availableModels: models,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          ok: false,
          isLocal: this.isLocal,
          message: `Connection timed out connecting to ${endpoint}.`,
        };
      }
      return {
        ok: false,
        isLocal: this.isLocal,
        message: `Could not connect to endpoint at ${endpoint}. Check server status and network.`,
      };
    }
  }

  public async generateReconstruction(request: ProviderRequest): Promise<string> {
    const endpoint = this.normalizeEndpoint(this.config.endpoint);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const payload = {
      model: this.config.model || 'default',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: false,
    };

    try {
      const response = await this.fetchWithRetry(
        `${endpoint}/chat/completions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: request.signal,
        },
        this.config.retries,
        this.config.timeoutMs
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Provider error (${response.status}): ${errorText || response.statusText}`
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content: string } }>;
      };
      const output = data.choices?.[0]?.message?.content || '';
      return output.trim();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Request timed out after ${this.config.timeoutMs}ms. Check model inference speed or increase timeout.`
        );
      }
      throw err;
    }
  }

  private normalizeEndpoint(ep: string): string {
    let cleaned = ep.replace(/\/+$/, '');
    if (!cleaned.endsWith('/v1') && !cleaned.includes('/v1/')) {
      // Automatically add /v1 if missing
      cleaned = `${cleaned}/v1`;
    }
    return cleaned;
  }
}
