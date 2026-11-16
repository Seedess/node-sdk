#!/usr/bin/env node
/**
 * Full working Seedess example for Node.js.
 *
 *   SEEDESS_API_KEY=key_… node examples/server.mjs
 *   open http://localhost:8787
 *
 * The server creates one stream on first request, then serves the browser page and
 * the playback handoff. The page uses hls.js + https://seedess.com/p2p.js.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Seedess, SeedessError } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8787);
const origin = 'https://seedess.com';
const apiKey = process.env.SEEDESS_API_KEY;

if (!apiKey) {
  console.error('Set SEEDESS_API_KEY (a server key, key_…) before running this example.');
  process.exit(1);
}

const seedess = new Seedess(apiKey, { baseUrl: process.env.SEEDESS_API_BASE ?? 'https://seedess.com' });
let cached = null;

async function handoff() {
  if (cached) return cached;

  const stream = await seedess.createStream({
    url: process.env.SEEDESS_STREAM_URL ?? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    id: process.env.SEEDESS_STREAM_ID ?? 'sdk-example',
    title: 'Seedess Node SDK example',
  });

  const token = stream.publicToken;
  const playback = stream.playback ?? {};
  cached = {
    ok: true,
    stream: stream.id,
    token,
    playback: {
      master: `${origin}${playback.master}`,
      signaling: `${origin}${playback.signaling}`,
      config: `${origin}/signaling/config?token=${encodeURIComponent(token)}`,
    },
  };
  return cached;
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/api/seedess') {
      const payload = await handoff();
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(payload));
      return;
    }

    if (request.url === '/' || request.url === '/index.html') {
      const html = await readFile(path.join(here, 'public', 'index.html'));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html);
      return;
    }

    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: false, error: 'Not found' }));
  } catch (error) {
    const message = error instanceof SeedessError
      ? `${error.status} ${error.code}: ${error.message}`
      : error.message;
    response.writeHead(500, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: false, error: message }));
  }
});

server.listen(port, () => {
  console.log(`Seedess example on http://localhost:${port}`);
  console.log('The first /api/seedess request creates the stream.');
});
