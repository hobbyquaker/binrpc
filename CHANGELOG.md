# Changelog

## 4.2.0 / 2026-09-01

- Fragmented TCP frames are reassembled correctly: a response or request header split across
  chunks previously made the client report `malformed response` and the server hang on the
  request forever. Both now buffer until the 8-byte header is complete.
- `decodeData` guards truncated nested payloads instead of letting the per-type decoders throw
  from inside socket data handlers.
- Server: new `listening` and `error` events (re-emitted from the underlying net server, e.g.
  `EADDRINUSE`), and `close([callback])` which returns a promise and destroys open keep-alive
  connections so it settles. Unknown methods and undecodable requests are answered with an
  encoded empty string — previously nothing was written and the caller ran into its response
  timeout.
- TypeScript declarations (`index.d.ts`) with a compile-time test (`npm run test:types`).
- New edge-case test suite (empty containers, truncated frames for every cut position, oversized
  declared lengths, fragmentation, server close/listening/NotFound behavior) — 126 tests, ~99%
  line coverage on `lib/`; CI runs the coverage report on Node 24.

## 4.1.0 / 2026-09-01

- Zero runtime dependencies: the unmaintained `binary` and `put` packages are replaced with plain
  `Buffer` reads/writes. The wire format is unchanged — verified byte-identical against 4.0.0
  with 20000 fuzzed requests/responses on top of the pinned hex fixtures in the protocol tests.
- More robust decoding of malformed/truncated frames: where the old parser could throw (and take
  the process down from a socket data handler), the decoder now bails out cleanly. Well-formed
  data decodes exactly as before.
- `npm audit`: 0 vulnerabilities.

## 4.0.0 / 2026-09-01

- **Breaking:** requires Node.js >= 20. The library itself is unchanged and stays CommonJS —
  drop-in for 3.x on a supported Node.js.
- Tests run on the built-in `node --test` runner (mocha, nyc, should and coveralls removed).
- Lint/format with eslint 9 (flat config) and prettier; xo removed.
- Docs are generated with `jsdoc-to-markdown` directly (`npm run docs`); grunt removed.
- `files` field added — the npm package now ships only `lib/`.

## 3.3.2 / 2026-09-01

- Fix crash due to missing error listener on the socket: after a request finished, a short window
  without any `error` listener could crash the process when the CCU was unreachable (#10, thanks
  Thomas Wendt).
- Fix double invocation of the `methodCall` callback when a connection attempt fails: the socket
  `error` event and the failed write callback could both fire for the same request.
- `npm test` runs mocha directly (no more xo/nyc/coveralls in the test script).
- CI on GitHub Actions; release workflow with npm trusted publishing (OIDC) and GitHub releases
  generated from this changelog.
