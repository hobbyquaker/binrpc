var rpc = require('./../lib/binrpc.js');

require('should');

describe('client server connection', function () {
    var rpcServer;
    var rpcClient;
    it('should open a server without throwing an error', function () {
        rpcServer = rpc.createServer({host: '127.0.0.1', port: '2031'});
    });
    it('should create a client and connect to the server', function (done) {
        rpcClient = rpc.createClient({host: 'localhost', port: '2031'});
        rpcClient.on('connect', done);
    });
    it('should send a call to the server and receive empty string', function (done) {
        rpcServer.on('test1', function (err, params, callback) {
            callback(null, '');
        });
        rpcClient.methodCall('test1', [''], function (err, res) {
            if (err ) {
                done(err);
            } else if (res !== '') {
                done(new Error('received wrong response ' + res));
            } else {
                done();
            }
        });
    });
    it('should send a call with some params to the server and receive some params', function (done) {
        rpcServer.on('test2', function (err, params, callback) {
            params.should.deepEqual([1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}]);
            callback(null, [2, 2.2, 'string2', true, [3, 4, 5], {c: 'c', d: 'd'}]);
        });
        rpcClient.methodCall('test2', [1, 1.1, 'string', true, [1, 2, 3], {a: 'a', b: 'b'}], function (err, res) {
            if (err ) {
                done(err);
            } else {
                res.should.deepEqual([2, 2.2, 'string2', true, [3, 4, 5], {c: 'c', d: 'd'}]);
                done();
            }
        });
    });
});
