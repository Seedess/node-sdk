# Node SDK example

A complete server + browser sample:

- `server.mjs` — creates a stream with `@seedess/node-sdk`, then serves the page and
  `/api/seedess`.
- `public/index.html` — loads hls.js and `https://seedess.com/p2p.js`, then plays the stream
  with the P2P adapter.

## Run

```bash
cd sdks/node-sdk
SEEDESS_API_KEY=key_… node examples/server.mjs
open http://localhost:8787
```

Optional:

```bash
SEEDESS_STREAM_URL=https://origin.example/master.m3u8 \
SEEDESS_STREAM_ID=my-demo \
PORT=8787 \
node examples/server.mjs
```

The first request to `/api/seedess` creates the stream. The response is:

```json
{
  "ok": true,
  "stream": "sdk-example",
  "token": "pk_…",
  "playback": {
    "master": "https://seedess.com/play/sdk-example/master.m3u8?token=pk_…",
    "signaling": "https://seedess.com/signaling/room/sdk-example?token=pk_…",
    "config": "https://seedess.com/signaling/config?token=pk_…"
  }
}
```

The API key stays in the server process. The browser only sees `token` and the playback URLs.
