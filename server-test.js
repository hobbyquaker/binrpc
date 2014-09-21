var binrpc = require('./lib/binrpc.js');

var rpcServer = binrpc.createServer({host: '0.0.0.0', port: 2345});

rpcServer.on('listDevices', function (err, params, cb) {
    console.log(params);
    cb([{bla:'blub'}, {muh:'kuh'}]);
});

rpcServer.on('NotFound', function (method) {
    console.log('method ' + method + ' not found');
});