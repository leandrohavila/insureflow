import { Injectable, Logger } from '@nestjs/common';

export class EvolutionHttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'EvolutionHttpError';
  }
}

export type EvolutionRequest = {
  apiUrl: string;
  apiKey: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
};

@Injectable()
export class EvolutionHttpClient {
  private readonly logger = new Logger(EvolutionHttpClient.name);

  async request<T = Record<string, unknown>>(
    input: EvolutionRequest,
  ): Promise<T> {
    const url = `${input.apiUrl.replace(/\/+$/, '')}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;
    const response = await fetch(url, {
      method: input.method ?? (input.body ? 'POST' : 'GET'),
      headers: {
        apikey: input.apiKey,
        'Content-Type': 'application/json',
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { message: text };
      }
    }

    if (!response.ok) {
      const message =
        readErrorMessage(parsed) ||
        `Evolution API ${response.status} em ${input.path}`;
      this.logger.warn(`${input.method ?? 'GET'} ${url} → ${response.status}`);
      throw new EvolutionHttpError(response.status, message, parsed);
    }

    return (parsed ?? {}) as T;
  }
}

function readErrorMessage(body: unknown) {
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  const response = record.response;
  if (typeof record.message === 'string') return record.message;
  if (typeof record.error === 'string') return record.error;
  if (response && typeof response === 'object') {
    const nested = response as Record<string, unknown>;
    if (typeof nested.message === 'string') return nested.message;
  }
  return '';
}
