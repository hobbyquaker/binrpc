var binrpc = require('./lib/binrpc.js');

var rpcClient = binrpc.createClient({
    host: '172.16.23.3',
    port: 2000

});


/*rpcClient.methodCall('init', ["xmlrpc_bin://127.0.0.1:2345", ""], function (err, res) {
    console.log('error', err, 'res', res);
});*/

rpcClient.methodCall('system.listMethods', '', function (err, res) {
    console.log('error', err, 'res', res);
});