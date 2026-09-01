# Roadmap — binrpc

`binrpc` speaks the HomeMatic BIN-RPC protocol (`xmlrpc_bin://`) and is the binary sibling of
[homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc). The two libraries implement
the same interface and are meant to stay a 1:1 drop-in replacement for each other — that parity
is a hard constraint for everything below: `createClient`/`createServer` options,
`methodCall(method, params, callback)`, per-method server events plus `NotFound`, and
`system.multicall` passed through unresolved are the public API.

Versioning is [semver](https://semver.org). Wire-format behavior (the exact bytes produced for a
given call) is part of the contract; the protocol tests pin it with hex fixtures.

---

## 4.0.0 — tooling modernization (done)

No library changes, stays CommonJS, drop-in for 3.x on Node.js >= 20. See
[CHANGELOG.md](CHANGELOG.md).

- eslint 9 (flat config) + prettier, tests on `node:test`, docs via `jsdoc-to-markdown`; xo,
  grunt, mocha/nyc/should and coveralls removed.
- GitHub Actions: CI on Node 20/22/24, release workflow with npm trusted publishing (OIDC,
  provenance) and GitHub releases generated from the CHANGELOG.
- npm package ships only `lib/`.

## 4.1.0 — drop the ancient runtime dependencies (done)

Additive only, same wire bytes (the hex fixtures in `tests/protocol.js` must not change).

- [x] Replace `binary` (unmaintained since 2013, pulls in `chainsaw`/`traverse`) and `put`
      (0.0.6) with plain `Buffer` reads/writes (`readUInt32BE`, `writeUInt32BE`, …). Zero runtime
      dependencies afterwards. Verified byte-identical against 4.0.0 with 20000 fuzzed
      requests/responses; malformed/truncated frames now bail out cleanly instead of throwing
      from a socket data handler.
- [x] `npm audit` clean.

## 4.2.0 — hardening and coverage (done)

- [x] Protocol edge-case tests: truncated frames, responses fragmented across TCP chunks,
      oversized declared lengths, empty arrays/structs (the old commented-out TODO for
      `decodeArray` of a length-0 array included). The fragmentation tests uncovered and fixed
      real bugs: a header split across TCP chunks broke both client and server.
- [x] Coverage in CI via `node --test --experimental-test-coverage` (~99% lines on `lib/`).
- [x] TypeScript type declarations (`index.d.ts` plus a `types-test/` compile check, as in
      [cul](https://github.com/hobbyquaker/cul)).
- [x] Server quality-of-life to match homematic-xmlrpc 2.0.0 where it is additive: `listening`
      and `error` events, a `close()` that returns a promise, unknown/undecodable calls answered
      with an encoded empty response instead of leaving the caller to time out.

## 5.0.0 — breaking, in lockstep with homematic-xmlrpc 3.0.0

Do **not** ship this until the matching homematic-xmlrpc major is ready — the two must be
designed together and released together so they remain drop-in replacements for each other.
Model: the homematic-rega 2.0.0 rewrite.

- [ ] Agree on the shared API first (one written spec for both repos): constructor options,
      promise-based `methodCall` (decide together whether callbacks stay as a compatibility
      layer), error shapes, timeout/reconnect semantics, server events.
- [ ] ES module. Keep `require()` consumers working via `require(esm)` — engines
      `^20.19 || ^22.12 || >=24` (the cul 1.0.0 pattern).
- [ ] A shared interface-conformance test suite that runs against **both** libraries (client and
      server cross-wired: binrpc client against binrpc server, xmlrpc client against xmlrpc
      server, and the shared surface asserted identical), so drop-in parity is tested instead of
      promised.
- [ ] Identical TypeScript types for the shared surface.
- [ ] Consumers to migrate/verify afterwards: hm2mqtt.js, node-red-contrib-ccu, RedMatic.
