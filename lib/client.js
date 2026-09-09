var net = require('net');

var binrpc = require('./protocol.js');

/**
 * @class Client
 * @param {object} options
 * @param {string} options.host the hostname or ip address to connect to
 * @param {number} options.port the port to connect to
 * @param {number} [options.reconnectTimeout=2500] wait milliseconds until trying to reconnect after the socket was closed; 0 disables reconnecting
 * @param {number} [options.reconnectTimeoutMax=30000] upper bound of the reconnect delay: every failed attempt doubles the delay until this value, a successful connect resets it
 * @param {number} [options.responseTimeout=5000] wait milliseconds for method call response
 * @param {number} [options.queueMaxLength=15] maximum number of methodCalls that are allowed in the queue
 */
/** @exports client */
var Client = function (options) {
    var that = this;

    this.reconnectTimeout = options.reconnectTimeout === undefined ? 2500 : options.reconnectTimeout;
    this.reconnectTimeoutMax = options.reconnectTimeoutMax || 30000;
    this.host = options.host;
    this.port = options.port;

    /**
     * The pending reconnect timer, if any. There is never more than one: a
     * refused connect emits `error` and `close`, a dropped connection `end`
     * and `close`, and every one of those used to arm its own timer, so the
     * number of connection attempts doubled with each round (a client whose
     * peer was gone for a while drove the process to 100 % CPU).
     * @type {object|null}
     */
    this.reconnectTimer = null;
    /**
     * Consecutive failed attempts since the last successful connect; drives the backoff.
     * @type {number}
     */
    this.reconnectAttempts = 0;
    /**
     * Set by close(): no further connection attempts.
     * @type {boolean}
     */
    this.closed = false;

    /**
     * The request queue. Array elements must be objects with the properties buffer and callback
     * @type {Array}
     */
    this.queue = [];
    /**
     * Maximum queue length. If queue length is greater than this a methodCall will return error 'You are sending too fast'
     * @type {number}
     */
    this.queueMaxLength = options.queueMaxLength || 100;
    /**
     * Time in milliseconds. How long to wait for retry if a request is pending
     * @type {number}
     */
    this.queueRetryTimeout = 50;
    /**
     * Indicates if there is a request waiting for its response
     * @type {boolean}
     */
    this.pending = false;

    /**
     * Time in milliseconds. How long to wait for a method call response
     * @type {number}
     */
    this.responseTimeout = options.responseTimeout || 5000;

    /**
     * Arm the single reconnect timer unless one is pending, reconnecting is
     * disabled or the client was closed. The delay starts at
     * reconnectTimeout and doubles per failed attempt up to reconnectTimeoutMax.
     */
    this.scheduleReconnect = function () {
        if (that.closed || !that.reconnectTimeout || that.reconnectTimer) {
            return;
        }
        var max = Math.max(that.reconnectTimeoutMax, that.reconnectTimeout);
        var delay = Math.min(that.reconnectTimeout * Math.pow(2, that.reconnectAttempts), max);
        that.reconnectAttempts += 1;
        that.reconnectTimer = setTimeout(function () {
            that.reconnectTimer = null;
            if (!that.closed) {
                that.connect();
            }
        }, delay);
    };

    /**
     * connect - also called for every reconnect; re-opens a closed client
     */
    this.connect = function () {
        that.closed = false;
        if (that.reconnectTimer) {
            clearTimeout(that.reconnectTimer);
            that.reconnectTimer = null;
        }
        if (that.socket && typeof that.socket.destroy === 'function') {
            that.socket.removeAllListeners('close');
            that.socket.destroy();
        }
        that.socket = net.createConnection(that.port, that.host);

        that.socket.on('error', function () {
            that.connected = false;
            that.scheduleReconnect();
        });

        that.socket.on('end', function () {
            that.connected = false;
            that.scheduleReconnect();
        });

        that.socket.on('close', function () {
            that.connected = false;
            that.scheduleReconnect();
        });

        that.socket.on('connect', function () {
            that.socket.removeAllListeners('error');
            that.socket.on('error', function () {});
            that.connected = true;
            that.reconnectAttempts = 0;
            that.socket.setKeepAlive(true, 10000);
        });
    };

    /**
     * close - destroy the socket and stop reconnecting. A pending method call
     * gets an error, queued ones fail on their write. connect() re-opens the client.
     */
    this.close = function () {
        that.closed = true;
        that.connected = false;
        if (that.reconnectTimer) {
            clearTimeout(that.reconnectTimer);
            that.reconnectTimer = null;
        }
        if (that.socket && typeof that.socket.destroy === 'function') {
            that.socket.destroy(new Error('client closed'));
        }
    };

    /**
     * Push request to the queue
     * @param {buffer} buf
     * @param {function} cb
     */
    this.queuePush = function (buf, cb) {
        this.queue.push({buf: buf, callback: cb});
        this.queueShift();
    };

    /**
     *  Shift request from the queue and write it to the socket.
     */
    this.queueShift = function () {
        var timeout;
        var writeEnd = function (onError) {
            that.pending = false;
            clearTimeout(timeout);
            that.socket.removeAllListeners('data');
            that.socket.removeAllListeners('timeout');
            that.socket.removeListener('error', onError);
        };

        if (that.queue.length > 0) {
            if (that.pending) {
                setTimeout(that.queueShift, that.queueRetryTimeout);
            } else {
                that.pending = true;

                var response = Buffer.alloc(0);
                var chunk = 0;
                var length;

                var obj = that.queue.shift();
                var finished = false;
                var finish = function (err, res) {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    writeEnd(onError);
                    if (typeof obj.callback === 'function') {
                        obj.callback(err, res);
                    }
                };
                var onError = function (err) {
                    finish(err);
                };

                that.socket.on('data', function (data) {
                    response = chunk === 0 ? data : Buffer.concat([response, data]);
                    chunk += 1;
                    if (length === undefined) {
                        if (response.length < 8) {
                            // wait for the complete header
                            return;
                        }
                        if (response.subarray(0, 3).toString() !== 'Bin') {
                            finish(new Error('malformed response'));
                            return;
                        }
                        length = response.readUInt32BE(4) + 8;
                    }
                    if (response.length >= length) {
                        finish(null, response);
                    }
                });

                that.socket.on('error', onError);
                that.socket.on('timeout', function () {
                    finish(new Error('socket timeout'));
                });
                timeout = setTimeout(function () {
                    finish(new Error('response timeout'));
                }, that.responseTimeout);
                that.socket.write(obj.buf, function (err) {
                    if (err) {
                        finish(err);
                    }
                });
            }
        }
    };

    /**
     * methodCall
     * @param {string} method
     * @param {Array} params
     * @param {function} callback optional - if omitted an empty string will be send as response
     */
    this.methodCall = function (method, params, callback) {
        if (this.pending && this.queue.length > this.queueMaxLength) {
            if (typeof callback === 'function') {
                callback(new Error('You are sending too fast'));
            }
        } else {
            this.queuePush(binrpc.encodeRequest(method, params), function (err, res) {
                if (typeof callback === 'function') {
                    if (!err && res) {
                        callback(null, binrpc.decodeResponse(res));
                    } else {
                        callback(err);
                    }
                }
            });
        }
    };

    this.connect();
};

module.exports = Client;
