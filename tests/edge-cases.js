const {describe, it} = require('node:test');
const assert = require('node:assert');
const net = require('node:net');

const rpc = require('./../lib/binrpc.js');
const binrpc = require('./../lib/protocol.js');

describe('empty containers', () => {
    it('should round-trip an empty array', () => {
        const res = binrpc.decodeData(binrpc.encodeData([]));
        assert.deepStrictEqual(res.content, []);
    });

    it('should round-trip an empty struct', () => {
        const res = binrpc.decodeData(binrpc.encodeData({}));
        assert.deepStrictEqual(res.content, {});
    });

    it('should round-trip nested empty containers', () => {
        const value = [{a: [], b: {}}, [], {}];
        const res = binrpc.decodeData(binrpc.encodeData(value));
        assert.deepStrictEqual(res.content, value);
    });

    it('should round-trip an empty-string response', () => {
        assert.strictEqual(binrpc.decodeResponse(binrpc.encodeResponse('')), '');
    });
});

describe('truncated frames', () => {
    const request = binrpc.encodeRequest('system.multicall', [
        [{methodName: 'event', params: ['ID', 'LEVEL', 1.5]}],
        'str',
        true,
        {nested: [1, 2, 3]},
    ]);
    const response = binrpc.encodeResponse([1, 2.5, 'three', {four: true}]);

    it('decodeRequest should not throw for any truncation', () => {
        for (let cut = 0; cut <= request.length; cut++) {
            binrpc.decodeRequest(request.subarray(0, cut));
        }
    });

    it('decodeResponse should not throw for any truncation', () => {
        for (let cut = 0; cut <= response.length; cut++) {
            binrpc.decodeResponse(response.subarray(0, cut));
        }
    });

    it('decodeData should not throw for any truncation of its payload', () => {
        const data = binrpc.encodeData([{key: 1.5}, 'str', true, [1]]);
        for (let cut = 0; cut <= data.length; cut++) {
            binrpc.decodeData(data.subarray(0, cut));
        }
    });

    it('decodeRequest should decode the full frame after surviving truncations', () => {
        const decoded = binrpc.decodeRequest(request);
        assert.strictEqual(decoded.method, 'system.multicall');
        assert.deepStrictEqual(decoded.params[0], [{methodName: 'event', params: ['ID', 'LEVEL', 1.5]}]);
    });
});

describe('malformed data', () => {
    it('decodeData should return undefined on an unknown data type', () => {
        const buf = Buffer.concat([Buffer.from([0, 0, 0, 0x42]), Buffer.alloc(8)]);
        assert.strictEqual(binrpc.decodeData(buf), undefined);
    });

    it('decodeData should return undefined on a truncated double', () => {
        const buf = Buffer.concat([Buffer.from([0, 0, 0, 4]), Buffer.alloc(4)]);
        assert.strictEqual(binrpc.decodeData(buf), undefined);
    });

    it('decodeString should clamp an oversized declared string length', () => {
        // declares 1000 bytes but only 3 follow
        const buf = Buffer.concat([Buffer.from([0, 0, 3, 0xe8]), Buffer.from('abc')]);
        const res = binrpc.decodeString(buf);
        assert.strictEqual(res.content, 'abc');
        assert.strictEqual(res.rest.length, 0);
    });

    it('decodeArray should stop cleanly when the declared count exceeds the data', () => {
        // declares 5 elements, contains 1 integer
        const buf = Buffer.concat([Buffer.from([0, 0, 0, 5]), binrpc.encodeData(42)]);
        binrpc.decodeArray(buf);
    });

    it('decodeStruct should stop cleanly when the declared count exceeds the data', () => {
        const buf = Buffer.concat([Buffer.from([0, 0, 0, 5]), binrpc.encodeStructKey('key'), binrpc.encodeData(42)]);
        const res = binrpc.decodeStruct(buf);
        assert.deepStrictEqual(res.content, {key: 42});
    });
});

describe('fragmented transport', () => {
    it('client should reassemble a response split into single bytes', {timeout: 30000}, (_t, done) => {
        const response = binrpc.encodeResponse('fragmented-ok');
        const server = net.createServer((socket) => {
            socket.on('data', () => {
                let i = 0;
                const interval = setInterval(() => {
                    socket.write(response.subarray(i, i + 1));
                    i++;
                    if (i >= response.length) {
                        clearInterval(interval);
                    }
                }, 2);
            });
        });
        server.listen(2043, '127.0.0.1', () => {
            const client = rpc.createClient({host: '127.0.0.1', port: 2043});
            client.methodCall('test', [''], (err, res) => {
                server.close();
                if (err) {
                    done(err);
                } else {
                    assert.strictEqual(res, 'fragmented-ok');
                    done();
                }
            });
        });
    });

    it('server should reassemble a request split into small chunks', {timeout: 30000}, (_t, done) => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2044});
        rpcServer.on('chunked', (err, params, callback) => {
            assert.deepStrictEqual(params, ['abc', 123]);
            callback(null, 'ok');
        });
        const request = binrpc.encodeRequest('chunked', ['abc', 123]);
        const socket = net.createConnection(2044, '127.0.0.1', () => {
            let i = 0;
            const interval = setInterval(() => {
                socket.write(request.subarray(i, i + 3));
                i += 3;
                if (i >= request.length) {
                    clearInterval(interval);
                }
            }, 2);
        });
        socket.on('data', (data) => {
            assert.strictEqual(binrpc.decodeResponse(data), 'ok');
            socket.destroy();
            rpcServer.close(done);
        });
    });

    it('client should error with response timeout on an oversized declared length', {timeout: 30000}, (_t, done) => {
        // msgSize declares more bytes than the peer ever sends
        const response = binrpc.encodeResponse('x');
        response.writeUInt32BE(9999, 4);
        const server = net.createServer((socket) => {
            socket.on('data', () => {
                socket.write(response);
            });
        });
        server.listen(2045, '127.0.0.1', () => {
            const client = rpc.createClient({host: '127.0.0.1', port: 2045, responseTimeout: 500});
            client.methodCall('test', [''], (err) => {
                server.close();
                assert.strictEqual(String(err), 'Error: response timeout');
                done();
            });
        });
    });
});

describe('server behavior', () => {
    it('should emit listening', {timeout: 10000}, (_t, done) => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2046});
        rpcServer.on('listening', () => {
            rpcServer.close(done);
        });
    });

    it('close() should return a promise and destroy open connections', {timeout: 10000}, async () => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2047});
        rpcServer.on('ping', (err, params, callback) => {
            callback(null, 'pong');
        });
        await new Promise((resolve) => rpcServer.on('listening', resolve));
        const client = rpc.createClient({host: '127.0.0.1', port: 2047, reconnectTimeout: 0});
        await new Promise((resolve, reject) => {
            client.methodCall('ping', [], (err) => (err ? reject(err) : resolve()));
        });
        await rpcServer.close();
        assert.strictEqual(rpcServer.server.listening, false);
    });

    it(
        'should answer an unknown method with an empty string instead of staying silent',
        {timeout: 10000},
        (_t, done) => {
            const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2048});
            const client = rpc.createClient({host: '127.0.0.1', port: 2048});
            client.methodCall('no.such.method', ['x'], (err, res) => {
                assert.ifError(err);
                assert.strictEqual(res, '');
                rpcServer.close(done);
            });
        },
    );

    it('should answer an undecodable request with an empty response', {timeout: 10000}, (_t, done) => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2049});
        // valid length word so the server considers the frame complete, but no Bin magic
        const garbage = Buffer.concat([
            Buffer.from('Xin', 'ascii'),
            Buffer.from([0]),
            Buffer.from([0, 0, 0, 4]),
            Buffer.alloc(4),
        ]);
        const socket = net.createConnection(2049, '127.0.0.1', () => {
            socket.write(garbage);
        });
        socket.on('data', (data) => {
            assert.strictEqual(binrpc.decodeResponse(data), '');
            socket.destroy();
            rpcServer.close(done);
        });
    });
});
