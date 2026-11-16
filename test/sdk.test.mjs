import test from 'node:test';
import assert from 'node:assert/strict';

import { Seedess, SeedessError } from '../src/index.js';

function fakeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(new URL(String(url)), init);
  };
  return { calls, fetchImpl };
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

test('createStream posts the body with a bearer key', async () => {
  const { calls, fetchImpl } = fakeFetch(() =>
    json({ ok: true, id: 'demo', publicToken: 'pk_1', playback: { signaling: '/s' } }, 201),
  );
  const client = new Seedess('key_test', { fetch: fetchImpl });

  const stream = await client.createStream({ url: 'https://origin/master.m3u8', id: 'demo' });

  assert.equal(stream.id, 'demo');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://seedess.com/api/v1/streams');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.authorization, 'Bearer key_test');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    url: 'https://origin/master.m3u8',
    id: 'demo',
  });
});

test('path ids are encoded', async () => {
  const { calls, fetchImpl } = fakeFetch(() => json({ ok: true, id: 'a/b' }));
  const client = new Seedess('key_test', { fetch: fetchImpl });
  await client.getStream('a/b');
  assert.equal(calls[0].url, 'https://seedess.com/api/v1/streams/a%2Fb');
});

test('disablePeers and enablePeers map to kill and revive', async () => {
  const { calls, fetchImpl } = fakeFetch(() => json({ ok: true }));
  const client = new Seedess('key_test', { fetch: fetchImpl });
  await client.disablePeers('demo');
  await client.enablePeers('demo');
  assert.equal(calls[0].url, 'https://seedess.com/api/v1/streams/demo/kill');
  assert.equal(calls[1].url, 'https://seedess.com/api/v1/streams/demo/revive');
});

test('sendTelemetry does not send the API key', async () => {
  const { calls, fetchImpl } = fakeFetch(() => new Response(null, { status: 204 }));
  const client = new Seedess('key_test', { fetch: fetchImpl });
  await client.sendTelemetry({ sessionId: 's', streamId: 'demo' });
  assert.equal(calls[0].url, 'https://seedess.com/api/v1/telemetry');
  assert.equal(calls[0].init.headers.authorization, undefined);
});

test('error envelopes become SeedessError', async () => {
  const { fetchImpl } = fakeFetch(() =>
    json({ ok: false, error: { code: 'QUOTA_EXCEEDED', message: 'Limit reached' } }, 429),
  );
  const client = new Seedess('key_test', { fetch: fetchImpl });
  await assert.rejects(
    () => client.createStream({ url: 'https://origin/master.m3u8' }),
    (error) => {
      assert.ok(error instanceof SeedessError);
      assert.equal(error.status, 429);
      assert.equal(error.code, 'QUOTA_EXCEEDED');
      assert.equal(error.message, 'Limit reached');
      return true;
    },
  );
});

test('rejects a public token in the server SDK', () => {
  assert.throws(() => new Seedess('pk_stream'), /key_/);
});
