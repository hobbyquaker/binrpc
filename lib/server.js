var util = require('util');
var net = require('net');
var EventEmitter = require('events').EventEmitter;

var binrpc = require('./protocol.js');

/**
 * @class Server
 * @param {object} options
 * @param {string} options.host ip address on which the server should listen
 * @param {number} options.port port on which the server should listen
 * @param {function} onListening function to be invoked in the server's `listening` callback
 */
/** @exports server */
var Server = function (options, onListening) {
    var that = this;
    this.host = options.host;
    this.port = options.port;

    var connections = new Set();

    this.server = net.createServer(function (client) {
        var receiver = Buffer.alloc(0);
        var chunk = 0;
        var length;

        connections.add(client);

        client.on('error', function () {
            // console.log('error  ' + JSON.stringify(e));
        });

        client.on('close', function () {
            connections.delete(client);
        });

        client.on('end', function () {
            // console.log('<--  disconnected');
        });

        client.on('data', function (data) {
            receiver = chunk === 0 ? data : Buffer.concat([receiver, data]);
            chunk += 1;

            if (length === undefined) {
                if (receiver.length < 8) {
                    // wait for the complete header
                    return;
                }
                length = receiver.readUInt32BE(4);
            }

            if (receiver.length >= length + 8) {
                // request complete
                var request = binrpc.decodeRequest(receiver);

                receiver = Buffer.alloc(0);
                chunk = 0;
                length = undefined;

                that.handleCall(request, client);
            }
        });
    });

    /**
     * Re-emitted from the underlying net server (e.g. EADDRINUSE).
     * Without an error listener this throws, as usual for EventEmitters.
     *
     * @event Server#error
     * @param {Error} error
     */
    this.server.on('error', function (err) {
        that.emit('error', err);
    });

    this.server.listen(this.port, this.host, function () {
        /**
         * Fires when the server is listening
         *
         * @event Server#listening
         */
        that.emit('listening');
        if (typeof onListening === 'function') {
            onListening();
        }
    });

    /**
     * Close the server. Stops accepting new connections and destroys open
     * connections so the returned promise settles.
     * @param {function} [callback] optional - invoked with (error) when closed
     * @returns {Promise}
     */
    this.close = function (callback) {
        var promise = new Promise(function (resolve, reject) {
            that.server.close(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            connections.forEach(function (client) {
                client.destroy();
            });
        });
        if (typeof callback === 'function') {
            promise.then(function () {
                callback(null);
            }, callback);
        }
        return promise;
    };

    this.handleCall = function (request, client) {
        if (!request || typeof request.method !== 'string') {
            // undecodable request - answered like an unknown method
            that.emit('NotFound', undefined, undefined);
            client.write(binrpc.encodeResponse(''));
            return;
        }
        var method = request.method;
        var params = request.params;

        /**
         * Fires when RPC method call is received
         *
         * @event Server#[method]
         * @param {*} error
         * @param {array} params
         * @param {function} callback callback awaits params err and response
         */
        var res = that.emit(method, null, params, function (err, response) {
            var buf = response ? binrpc.encodeResponse(response) : binrpc.encodeResponse('');
            client.write(buf);
        });

        if (!res) {
            /**
             * Fires if a RPC method call has no event handler.
             * RPC response is always an empty string.
             *
             * @event Server#NotFound
             * @param {string} method
             * @param {array} params
             */
            that.emit('NotFound', method, params);
            client.write(binrpc.encodeResponse(''));
        }
    };
};

util.inherits(Server, EventEmitter);

module.exports = Server;
