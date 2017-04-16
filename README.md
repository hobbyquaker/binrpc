binrpc
======

[![npm version](https://badge.fury.io/js/binrpc.svg)](https://badge.fury.io/js/binrpc) 
[![Build Status](https://travis-ci.org/hobbyquaker/binrpc.svg?branch=master)](https://travis-ci.org/hobbyquaker/binrpc)
[![License][mit-badge]][mit-url]


HomeMatic xmlrpc_bin:// protocol server and client

For use with CCU1/2 (rfd, hs485d), Homegear and CUxD

Implements the same interface like https://github.com/hobbyquaker/homematic-xmlrpc


*+Breaking change in v2.0.0:*+ `system.multicall` isn't resolved in single calls anymore. This should be
done by the application itself and was removed to be consistent with 
[homematic-xmlrpc](https://github.com/hobbyquaker/homematic-xmlrpc).

## Examples

```javascript
var rpc = require('binrpc');

var rpcClient = rpc.createClient({host: '192.168.1.100', port: '2001'});

rpcClient.methodCall('setValue', ['LEQ0134153:1', 'STATE', true], function (err, res) {
    console.log('response', err, JSON.stringify(res));
});
```

```javascript
var rpcServer = rpc.createServer({host: '192.168.1.200', port: '2001'});

rpcServer.on('system.listMethods', function (err, params, callback) {
    callback(['system.listMethods', 'system.multicall', 'event', 'listDevices']);
});
```

For a full example on how to subscribe to CCU events see [example.js](example.js)


## Further reading

* [HomeMatic RPC Schnittstellen Dokumentation, eQ-3 (German)](http://www.eq-3.de/Downloads/Software/HM-CCU2-Firmware_Updates/Tutorials/HM_XmlRpc_API.pdf)
* [BIN-RPC reference by Sathya (with Homegear extensions) (English)](https://www.homegear.eu/index.php/Binary_RPC_Reference)
* [BIN-RPC protocol description by leonsio, homematic-forum (German)](http://homematic-forum.de/forum/viewtopic.php?t=8210&p=57493)

## License


The MIT License (MIT)

Copyright (c) 2014-2017 Sebastian 'hobbyquaker' Raff

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE