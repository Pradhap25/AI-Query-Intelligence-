/**
 * AI Query Intelligence - Base Provider Abstraction
 */

import { ConnectionTestResult, ProviderConfig, ProviderType } from '../types';

export interface ProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  signal?: AbortSignal;
}

export abstract class BaseProvider {
  public abstract readonly id: ProviderType;
  public abstract readonly name: string;
  public abstract readonly isLocal: boolean;

  constructor(protected config: ProviderConfig) {}

  public updateConfig(newConfig: ProviderConfig): void {
    this.config = { ...newConfig };
  }

  public abstract testConnection(): Promise<ConnectionTestResult>;

  public abstract generateReconstruction(request: ProviderRequest): Promise<string>;

  /**
   * Helper to perform fetch with timeout and retries
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.config.retries,
    timeoutMs = this.config.timeoutMs
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const mergedSignal = options.signal
      ? this.composeAbortSignals(options.signal, controller.signal)
      : controller.signal;

    try {
      const response = await fetch(url, {
        ...options,
        signal: mergedSignal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (retries > 0 && !options.signal?.aborted) {
        return this.fetchWithRetry(url, options, retries - 1, timeoutMs);
      }
      throw err;
    }
  }

  private composeAbortSignals(sig1: AbortSignal, sig2: AbortSignal): AbortSignal {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    sig1.addEventListener('abort', onAbort);
    sig2.addEventListener('abort', onAbort);
    return controller.signal;
  }
}
