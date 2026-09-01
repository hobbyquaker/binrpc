const {describe, it} = require('node:test');
const assert = require('node:assert');

const rpc = require('./../lib/binrpc.js');

describe('client server disconnect', () => {
    it('should open a server and invoke callback when listening', (_t, done) => {
        let myServer;
        const options = {host: '127.0.0.1', port: '2034'};
        function onListening() {
            const server = myServer.server;
            assert.strictEqual(server.listening, true);
            server.close(done);
        }
        myServer = rpc.createServer(options, onListening);
    });

    it('should time out', {timeout: 60000}, (_t, done) => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2039});
        const rpcClient = rpc.createClient({host: '127.0.0.1', port: 2039});
        rpcServer.on('veryslow', (err, params, callback) => {
            setTimeout(() => {
                callback(null, '');
            }, 10000);
        });
        rpcClient.methodCall('veryslow', [''], (err) => {
            assert.strictEqual(err.toString(), 'Error: response timeout');
            done(err ? undefined : new Error('no Error was thrown'));
        });
    });

    it('should do nothing when filling up the queue without callback', {timeout: 60000}, () => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2040});
        const rpcClient = rpc.createClient({host: '127.0.0.1', port: 2040});
        rpcServer.on('slow', (err, params, callback) => {
            setTimeout(() => {
                callback(null, '');
            }, 2000);
        });
        for (let i = 0; i < 110; i++) {
            rpcClient.methodCall('slow', ['']);
        }
    });

    it('should reconnect when the server is back', {timeout: 30000}, (_t, done) => {
        let rpcServer2 = rpc.createServer({host: '127.0.0.1', port: 2038});
        const rpcClient2 = rpc.createClient({host: '127.0.0.1', port: 2038});

        setTimeout(() => {
            rpcClient2.socket.end();
            rpcClient2.socket.destroy();
            rpcServer2.server.close();
            rpcServer2.server.unref();

            setTimeout(() => {
                rpcServer2 = rpc.createServer({host: '127.0.0.1', port: 2038});
                rpcServer2.on('back', (err, params, callback) => {
                    callback(null, 'isBack');
                });
                setTimeout(() => {
                    rpcClient2.methodCall('back', [''], (err, res) => {
                        if (err) {
                            done(err);
                        } else if (res === 'isBack') {
                            done();
                        } else {
                            done(new Error('unexpected response ' + res));
                        }
                    });
                }, 2750);
            }, 5000);
        }, 5000);
    });

    it('should handle socket errors after a writeEnd', {timeout: 60000}, (_t, done) => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2041});
        const rpcClient = rpc.createClient({host: '127.0.0.1', port: 2041});
        rpcServer.on('ok', (err, params, callback) => {
            callback(null, '');
        });
        rpcClient.methodCall('ok', [''], () => {
            rpcClient.socket.emit('error');
            done();
        });
    });
});
