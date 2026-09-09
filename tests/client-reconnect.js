const {describe, it} = require('node:test');
const assert = require('node:assert');
const net = require('net');

const rpc = require('./../lib/binrpc.js');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// a server that accepts and drops every connection at once: the client sees
// `end`/`error` and `close` for each attempt, the pattern that used to arm two
// reconnect timers per attempt
function dropper() {
    return new Promise((resolve) => {
        let accepted = 0;
        const server = net.createServer((socket) => {
            accepted += 1;
            socket.destroy();
        });
        server.listen(0, '127.0.0.1', () => resolve({server, port: server.address().port, accepted: () => accepted}));
    });
}

// whether this host refuses a connect to a closed port promptly (WSL2 with
// mirrored networking lets it hang instead; the refused-port test is skipped there)
function refusesPromptly() {
    return new Promise((resolve) => {
        const socket = net.createConnection(1, '127.0.0.1');
        const timer = setTimeout(() => {
            socket.destroy();
            resolve(false);
        }, 500);
        socket.on('error', () => {
            clearTimeout(timer);
            resolve(true);
        });
    });
}

function countConnects(client) {
    let attempts = 1; // the constructor's own connect
    const connect = client.connect;
    client.connect = function () {
        attempts += 1;
        return connect.apply(client, arguments);
    };
    return () => attempts;
}

describe('client reconnect', () => {
    it(
        'should reconnect to a peer that drops every connection once per reconnectTimeout',
        {timeout: 10000},
        async () => {
            const box = await dropper();
            const client = rpc.createClient({host: '127.0.0.1', port: box.port, reconnectTimeout: 50});
            const attempts = countConnects(client);
            await sleep(1000);
            client.close();
            box.server.close();
            // every attempt connects (which resets the backoff) before it is dropped, so
            // the rate is one per reconnectTimeout - about twenty in a second, never the
            // hundreds the doubled timers produced
            assert.ok(attempts() >= 3, 'expected a few attempts, got ' + attempts());
            assert.ok(attempts() <= 25, 'too many attempts: ' + attempts());
            assert.ok(box.accepted() <= 25, 'too many connections: ' + box.accepted());
            assert.strictEqual(client.reconnectTimer, null);
        },
    );

    it('should never hold more than one reconnect timer against a refused port', {timeout: 10000}, async (t) => {
        if (!(await refusesPromptly())) {
            t.skip('this host does not refuse connects to a closed port');
            return;
        }
        const client = rpc.createClient({host: '127.0.0.1', port: 1, reconnectTimeout: 20, reconnectTimeoutMax: 100});
        const attempts = countConnects(client);
        await sleep(600);
        client.close();
        // 20, 40, 80, 100, 100, 100, 100 ...: at most about nine attempts
        assert.ok(attempts() >= 3, 'expected a few attempts, got ' + attempts());
        assert.ok(attempts() <= 12, 'too many attempts: ' + attempts());
        assert.ok(client.reconnectAttempts >= 3);
    });

    it('should stop reconnecting after close() and reject a pending call', {timeout: 10000}, async () => {
        const box = await dropper();
        const client = rpc.createClient({host: '127.0.0.1', port: box.port, reconnectTimeout: 30});
        const attempts = countConnects(client);
        await sleep(200);
        const error = await new Promise((resolve) => {
            client.methodCall('ping', [], (err) => resolve(err));
            client.close();
        });
        assert.ok(error instanceof Error);
        const seen = attempts();
        await sleep(200);
        assert.strictEqual(attempts(), seen, 'reconnected after close()');
        assert.strictEqual(client.connected, false);
        box.server.close();
    });

    it('should not reconnect at all with reconnectTimeout 0', {timeout: 10000}, async () => {
        const box = await dropper();
        const client = rpc.createClient({host: '127.0.0.1', port: box.port, reconnectTimeout: 0});
        const attempts = countConnects(client);
        await sleep(300);
        assert.strictEqual(attempts(), 1);
        assert.strictEqual(client.reconnectTimer, null);
        box.server.close();
    });

    it('should reset the backoff after a successful connect and reopen after close()', {timeout: 10000}, async () => {
        const rpcServer = rpc.createServer({host: '127.0.0.1', port: 2042});
        rpcServer.on('ok', (err, params, callback) => callback(null, 'fine'));
        await new Promise((resolve) => rpcServer.on('listening', resolve));
        const client = rpc.createClient({host: '127.0.0.1', port: 2042, reconnectTimeout: 30});
        client.reconnectAttempts = 5; // as if it had failed before
        await sleep(200);
        assert.strictEqual(client.connected, true);
        assert.strictEqual(client.reconnectAttempts, 0);

        client.close();
        await sleep(50);
        client.connect();
        await sleep(200);
        assert.strictEqual(client.connected, true);
        const res = await new Promise((resolve, reject) =>
            client.methodCall('ok', [], (err, r) => (err ? reject(err) : resolve(r))),
        );
        assert.strictEqual(res, 'fine');
        client.close();
        await rpcServer.close();
    });
});
