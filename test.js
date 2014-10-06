var rpc = require('./lib/binrpc.js');

var rpcClient = rpc.createClient({host: '172.16.23.3', port: '2001'});

rpcClient.methodCall('setValue', ['EEQ0000230:1', 'LEVEL', {explicitDouble: 0.3}], function (err, res) {
    console.log('resposnse', err, res);
});