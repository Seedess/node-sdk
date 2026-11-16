export type Playback = {
  format?: 'hls' | 'dash';
  master?: string | null;
  manifest?: string | null;
  playlist?: string | null;
  signaling: string;
  config?: string;
};

export type StreamVariant = {
  variantId: string;
  kind: 'video' | 'audio' | 'subtitles';
  uri: string;
  bandwidth?: number | null;
  resolution?: string | null;
  language?: string | null;
};

export type Stream = {
  id: string;
  title?: string;
  live?: boolean;
  status?: 'active' | 'killed';
  format?: 'hls' | 'dash';
  killSwitch?: boolean;
  targetDuration?: number;
  mediaSequence?: number;
  variants?: StreamVariant[];
  segments?: number;
  updatedAt?: string;
  publicToken?: string;
  playback?: Playback;
  snippet?: string | null;
  controls?: {
    killSwitch: boolean;
    offloadCap: number | null;
    allowedOrigins: string[];
    meteredDefault: boolean;
  };
  [key: string]: unknown;
};

export type Metrics = {
  cdnBytes: number;
  p2pBytes: number;
  offloadPercent: number;
  hashFailures: number;
  fallbacks: number;
  rebuffers: number;
  peakPeers: number;
  sessions: number;
};

export type CreateStreamInput = {
  url: string;
  id?: string;
  title?: string;
  live?: boolean;
};

export type TelemetryInput = {
  sessionId: string;
  streamId: string;
  cdnBytes?: number;
  p2pBytes?: number;
  hashFailures?: number;
  fallbacks?: number;
  rebuffers?: number;
  peakPeers?: number;
};

export class SeedessError extends Error {
  status: number;
  code: string;
  body: unknown;
  constructor(status: number, code: string, message: string, body?: unknown);
}

export type SeedessOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

export class Seedess {
  constructor(apiKey: string, options?: SeedessOptions);
  request<T = unknown>(method: string, path: string, body?: unknown, options?: { auth?: boolean }): Promise<T>;
  createStream(input: CreateStreamInput): Promise<{ ok: true; id: string; publicToken: string; playback: Playback } & Stream>;
  getStream(id: string): Promise<Stream>;
  listStreams(): Promise<{ ok: true; streams: Stream[] }>;
  refreshStream(id: string): Promise<{ ok: true; id: string; addedSegments?: number; skippedSegments?: number }>;
  disablePeers(id: string): Promise<{ ok: true; id: string; killSwitch: boolean }>;
  enablePeers(id: string): Promise<{ ok: true; id: string; killSwitch: boolean }>;
  getMetrics(id: string): Promise<{ ok: true; id: string; metrics: Metrics }>;
  sendTelemetry(input: TelemetryInput): Promise<null>;
}

export default Seedess;
