# @seedess/node-sdk

Official Seedess SDK for Node.js.

**Server-side only.** The SDK uses a secret API key (`key_…`) to create and control streams.
Never ship it in a browser or a mobile app. Playback uses the separate `@seedess/*-p2p`
packages and a per-stream public token (`pk_…`).

## Install

```bash
npm install @seedess/node-sdk
```

Node 18+.

## Use

```js
import { Seedess } from '@seedess/node-sdk';

const seedess = new Seedess(process.env.SEEDESS_API_KEY);

const stream = await seedess.createStream({
  url: 'https://origin.example/master.m3u8',
  id: 'demo',
  live: true,
});

console.log(stream.publicToken);
console.log(stream.playback.master);
```

Pass only the public token and stream id to the page:

```js
res.json({ stream: stream.id, token: stream.publicToken });
```

## Methods

| Method | HTTP | Purpose |
| --- | --- | --- |
| `createStream(input)` | `POST /api/v1/streams` | Ingest a manifest, mint the public token. |
| `getStream(id)` | `GET /api/v1/streams/:id` | Status, variants, segment count. |
| `listStreams()` | `GET /api/v1/streams` | All streams in the tenant. |
| `refreshStream(id)` | `POST /api/v1/streams/:id/refresh` | Pull new live segments. |
| `disablePeers(id)` | `POST /api/v1/streams/:id/kill` | CDN only; playback continues. |
| `enablePeers(id)` | `POST /api/v1/streams/:id/revive` | Re-enable peer delivery. |
| `getMetrics(id)` | `GET /api/v1/streams/:id/metrics` | Offload and delivery counters. |
| `sendTelemetry(input)` | `POST /api/v1/telemetry` | One session batch (public, rate limited). |

`request(method, path, body)` is available for routes without a helper.

## Errors

```js
import { SeedessError } from '@seedess/node-sdk';

try {
  await seedess.createStream({ url });
} catch (error) {
  if (error instanceof SeedessError) {
    console.error(error.status, error.code, error.message);
  }
}
```

## Options

```js
new Seedess(apiKey, {
  baseUrl: 'https://seedess.com',
  fetch: customFetch, // tests or a proxy
});
```

## Links

- Docs: https://seedess.com/docs/
- API: https://seedess.com/docs/api/
- Libraries: https://seedess.com/docs/libraries/

## License

MIT.
