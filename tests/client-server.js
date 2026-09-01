const {describe, it} = require('node:test');
const assert = require('node:assert');

const rpc = require('./../lib/binrpc.js');

describe('client server connection', () => {
    let rpcServer;
    let rpcClient;

    it('should raise an error if no connection can be established', {timeout: 60000}, (_t, done) => {
        const rpcClientNC = rpc.createClient({host: 'localhost', port: '2032'});
        rpcClientNC.methodCall('testNC', [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}], (err) => {
            if (err) {
                done();
            } else {
                done(new Error('no Error was thrown'));
            }
        });
    });

    it('should open a server without throwing an error', () => {
        rpcServer = rpc.createServer({host: '127.0.0.1', port: '2037'});
    });

    it('should create a client without error', () => {
        rpcClient = rpc.createClient({host: '127.0.0.1', port: '2037'});
    });

    it('should do nothing when shifting an empty queue', () => {
        rpcClient.queueShift();
    });

    it('should send a call to the server and receive empty string', {timeout: 30000}, (_t, done) => {
        rpcServer.on('test1', (err, params, callback) => {
            callback(null, '');
        });
        rpcClient.methodCall('test1', [''], (err, res) => {
            if (err) {
                done(err);
            } else if (res !== '') {
                done(new Error('received wrong response ' + res));
            } else {
                done();
            }
        });
    });

    it('should send a call with some params to the server and receive some params', {timeout: 30000}, (_t, done) => {
        rpcServer.on('test2', (err, params, callback) => {
            assert.deepStrictEqual(params, [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}]);
            callback(null, [2, 2.2, 'string2', true, [3, 4, 5], {c: 'c', d: 'd'}]);
        });
        rpcClient.methodCall('test2', [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}], (err, res) => {
            if (err) {
                done(err);
            } else {
                assert.deepStrictEqual(res, [2, 2.2, 'string2', true, [3, 4, 5], {c: 'c', d: 'd'}]);
                done();
            }
        });
    });

    it(
        'should send a unknown call with some params to the server and trigger a NotFound event',
        {timeout: 30000},
        (_t, done) => {
            rpcServer.on('NotFound', (method, params) => {
                assert.strictEqual(method, 'test3');
                assert.deepStrictEqual(params, [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}]);
                done();
            });
            rpcClient.methodCall('test3', [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}], (err) => {
                if (err) {
                    done(err);
                }
            });
        },
    );

    it('should fill up the queue', {timeout: 60000}, (_t, done) => {
        rpcServer.on('slow', (err, params, callback) => {
            setTimeout(() => {
                callback(null, '');
            }, 2000);
        });
        for (let i = 0; i < 110; i++) {
            rpcClient.methodCall('slow', [''], () => {});
        }
        rpcClient.methodCall('slow', [''], (err) => {
            assert.strictEqual(err.toString(), 'Error: You are sending too fast');
            done(err ? undefined : new Error('no Error was thrown'));
        });
    });

    it('should create a client twice without error', () => {
        let rpcClientTwice = rpc.createClient({host: 'localhost', port: '2033'});
        rpcClientTwice = rpc.createClient({host: 'localhost', port: '2033'});
        rpcClientTwice.queueShift();
    });
});
