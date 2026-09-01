// compile-only check for index.d.ts (tsc --noEmit via npm run test:types)
import rpc = require('..');

const client = rpc.createClient({host: '127.0.0.1', port: 2001, responseTimeout: 1000});
client.methodCall('setValue', ['LEQ0134153:1', 'STATE', true], (err, res) => {
    if (err) {
        console.error(err.message);
    } else if (typeof res === 'string') {
        console.log(res);
    }
});
client.methodCall('init', ['xmlrpc_bin://127.0.0.1:2002', 'test']);
client.methodCall('level', [{explicitDouble: 1}]);

const server = rpc.createServer({host: '127.0.0.1', port: 2002}, () => console.log('listening'));
server.on('listening', () => console.log('listening event'));
server.on('error', (error) => console.error(error.message));
server.on('NotFound', (method, params) => console.log(method, params));
server.on('system.multicall', (error, params, callback) => {
    console.log(error, params);
    callback(null, '');
});
const closed: Promise<void> = server.close();
closed.then(() => server.close((err) => console.log(err)));

// @ts-expect-error host is required
rpc.createClient({port: 2001});
// @ts-expect-error params must be an array
client.methodCall('setValue', 'nope');
