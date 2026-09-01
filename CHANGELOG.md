# Changelog

## 3.3.2 / 2026-09-01

- Fix crash due to missing error listener on the socket: after a request finished, a short window
  without any `error` listener could crash the process when the CCU was unreachable (#10, thanks
  Thomas Wendt).
- Fix double invocation of the `methodCall` callback when a connection attempt fails: the socket
  `error` event and the failed write callback could both fire for the same request.
- `npm test` runs mocha directly (no more xo/nyc/coveralls in the test script).
- CI on GitHub Actions; release workflow with npm trusted publishing (OIDC) and GitHub releases
  generated from this changelog.
