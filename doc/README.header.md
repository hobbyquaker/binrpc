binrpc
======

[![npm version](https://img.shields.io/npm/v/binrpc.svg)](https://www.npmjs.com/package/binrpc)
[![CI](https://github.com/hobbyquaker/binrpc/actions/workflows/ci.yml/badge.svg)](https://github.com/hobbyquaker/binrpc/actions/workflows/ci.yml)
[![License][mit-badge]][mit-url]

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE

> HomeMatic xmlrpc_bin:// protocol server and client

For use with CCU1/2 (rfd, hs485d, Rega), Homegear and CUxD

Implements the same interface as [homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc), these 2 libs
should be a 1:1 drop-in-replacement for each other.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for recent releases.

**Breaking Change in v4.0.0:** Requires Node.js >= 20. The library itself is unchanged and stays
CommonJS; tooling was modernized (GitHub Actions CI/release, eslint + prettier, `node --test`).

**Breaking Change in v3.0.0:** To be consistent with [homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc)
the RPC client isn't an event emitter anymore. All errors have to be handled through the methodCall callback.

**Change in v2.1.0** To be consistent with [homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc) you don't
have to wait for the client connect event before using methodCall.

**Breaking change in v2.0.0:** `system.multicall` isn't resolved in single calls anymore. This should be
done by the application itself and was removed to be consistent with
[homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc).

## Examples

Switch on the Channel `LEQ0134153:1`

```javascript
var rpc = require('binrpc');

var rpcClient = rpc.createClient({host: '192.168.1.100', port: '2001'});

rpcClient.methodCall('setValue', ['LEQ0134153:1', 'STATE', true], function (err, res) {
  console.log('response', err, JSON.stringify(res));
});
```

For a full example on how to subscribe to CCU events see [example.js](example.js)

## Further reading

- [HomeMatic RPC Schnittstellen Dokumentation, eQ-3 (German)](http://www.eq-3.de/Downloads/eq3/download%20bereich/hm_web_ui_doku/HM_XmlRpc_API.pdf)
- [BIN-RPC reference by Sathya (with Homegear extensions) (English)](https://www.homegear.eu/index.php/Binary_RPC_Reference)
- [BIN-RPC protocol description by leonsio, homematic-forum (German)](http://homematic-forum.de/forum/viewtopic.php?t=8210&p=57493)

## API Documentation
