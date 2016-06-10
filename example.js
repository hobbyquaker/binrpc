/**
 *
 *  Simple example:
 *  Connect to the interface process rfd on port 2001, open a rpc server and print incoming events
 *
 */

var rpc = require('./lib/binrpc.js');

// Config
var thisHost = '172.16.23.134';
var ccuHost = '172.16.23.3';


var rpcServer = rpc.createServer({host: thisHost, port: '2001'});    // Host running rpc server
var rpcClient = rpc.createClient({host: ccuHost, port: '2001'});      // CCU

rpcServer.on('system.listMethods', function (err, params, callback) {
    console.log(' <  system.listMethods');
    callback(['system.listMethods', 'system.multicall', 'event', 'listDevices']);
});

rpcServer.on('listDevices', function (err, params, callback) {
    callback([]);
});

rpcServer.on('event', function (err, params, callback) {
    console.log(' < event', params);
    callback(['']);
});


rpcClient.on('connect', function () {
    console.log('client connected');
    subscribe();
});

/**
 * Tell the CCU that we want to receive events
 */
function subscribe() {
    console.log(' > ', 'init', ['xmlrpc_bin://' + thisHost + ':2001', 'test123']);
    rpcClient.methodCall('init', ['xmlrpc_bin://' + thisHost + ':2001', 'test123'], function (err, res) {

    });
}

process.on('SIGINT', function () {
    unscribe();
});


/**
 * Tell the CCU that we no longer want to receive events
 */
function unscribe() {
    console.log(' > ', 'init', ['xmlrpc_bin://' + thisHost + ':2001', '']);
    rpcClient.methodCall('init', ['xmlrpc_bin://' + thisHost + ':2001', ''], function (err, res) {
        process.exit(0);
    });
}