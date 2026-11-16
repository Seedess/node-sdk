/**
 * Official Seedess SDK for Node.js.
 *
 * Control plane only. Uses a secret API key (`key_…`). Never import this in a
 * browser; use `@seedess/hls-p2p` or `@seedess/p2p` there with a public token.
 */

export class SeedessError extends Error {
  constructor(status, code, message, body = null) {
    super(message);
    this.name = 'SeedessError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

const DEFAULT_BASE_URL = 'https://seedess.com';

function encode(value) {
  return encodeURIComponent(String(value));
}

export class Seedess {
  #apiKey;
  #baseUrl;
  #fetch;

  constructor(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('key_')) {
      throw new TypeError('Seedess: apiKey must be a server API key (key_…)');
    }
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new TypeError('Seedess: fetch is not available; pass options.fetch');
    }
    this.#apiKey = apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.#fetch = fetchImpl;
  }

  /** Raw JSON request. `path` is appended to the base URL. */
  async request(method, path, body, options = {}) {
    const url = `${this.#baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (options.auth !== false) headers.authorization = `Bearer ${this.#apiKey}`;

    const response = await this.#fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: { code: 'invalid_json', message: text.slice(0, 200) } };
      }
    }

    if (!response.ok) {
      const error = payload?.error ?? {};
      throw new SeedessError(
        response.status,
        error.code ?? 'http_error',
        error.message ?? `HTTP ${response.status}`,
        payload,
      );
    }
    return payload;
  }

  /** Create and ingest a stream. */
  createStream(input) {
    return this.request('POST', '/api/v1/streams', input);
  }

  /** One stream by id. */
  getStream(id) {
    return this.request('GET', `/api/v1/streams/${encode(id)}`);
  }

  /** Every stream in the key's tenant. */
  listStreams() {
    return this.request('GET', '/api/v1/streams');
  }

  /** Pull new segments for a live stream. */
  refreshStream(id) {
    return this.request('POST', `/api/v1/streams/${encode(id)}/refresh`);
  }

  /** Force the CDN only; playback continues. */
  disablePeers(id) {
    return this.request('POST', `/api/v1/streams/${encode(id)}/kill`);
  }

  /** Re-enable peer delivery. */
  enablePeers(id) {
    return this.request('POST', `/api/v1/streams/${encode(id)}/revive`);
  }

  /** Offload, CDN/P2P bytes, failures, peers and sessions. */
  getMetrics(id) {
    return this.request('GET', `/api/v1/streams/${encode(id)}/metrics`);
  }

  /** Send one session batch. Telemetry is public and rate limited. */
  sendTelemetry(input) {
    return this.request('POST', '/api/v1/telemetry', input, { auth: false });
  }
}

export default Seedess;
