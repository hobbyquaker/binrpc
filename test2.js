var binrpc = require('./lib/binrpc.js');

var rpcServer = binrpc.createServer({host: '0.0.0.0', port: 2345});

rpcServer.on('listDevices', function (err, params, cb) {
    console.log('listDevices');
    cb([]);
});

rpcServer.on('NotFound', function (method, params) {
    console.log('method ' + method + ' not found');
    console.log(params);
});


var rpcClient = binrpc.createClient({
    host: '172.16.23.3',
    port: 2000

});

console.log('init', ['xmlrpc_bin://172.16.23.134:2345', 'test2']);
rpcClient.methodCall('init', ['xmlrpc_bin://172.16.23.134:2345', 'test2'], function (err, res) {
    console.log('error', err, 'res', res);
});

