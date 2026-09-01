const {describe, it} = require('node:test');
const assert = require('node:assert');
const net = require('node:net');

const rpc = require('./../lib/binrpc.js');

describe('malformed response', () => {
    it('should return an error', (_t, done) => {
        const server = net.createServer((socket) => {
            socket.on('data', () => {
                socket.write('Echo server\r\n');
            });
        });
        server.listen(2042, '127.0.0.1');

        const rpcClient = rpc.createClient({host: '127.0.0.1', port: 2042});
        rpcClient.methodCall('test', [''], (err) => {
            assert.strictEqual(err.toString(), 'Error: malformed response');
            done(err ? undefined : new Error('no Error was thrown'));
        });
    });
});
