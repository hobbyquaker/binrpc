# Changelog

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
