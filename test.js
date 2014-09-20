var binrpc = require('./lib/binrpc.js');

var rpcClient = binrpc.createClient({
    host: '127.0.0.1',
    port: 2345

});


rpcClient.methodCall('listDevices', [], function (err, res) {
    console.log('error', err, 'res', res);
});

