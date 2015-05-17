var binary =                    require('binary');
var net =                       require('net');
var EventEmitter =              require('events').EventEmitter;
var util =                      require('util');

var binrpc =                    require('./protocol.js');


/**
 * @class Client
 * @param {object} options containing a host and a port attribute
 */
/** @exports client */
var Client = function (options) {

    var that = this;

    this.reconnectTimeout =     options.reconnectTimeout || 2500;
    this.host =                 options.host || '127.0.0.1';
    this.port =                 options.port;

    /**
     * The request queue. Array elements must be objects with the properties buffer and callback
     * @type {Array}
     */
    this.queue =                [];
    /**
     * Maximum queue length. If queue length is greater than this a methodCall will return error 'You are sending too fast'
     * @type {number}
     */
    this.queueMaxLength =       options.queueMaxLength || 15;
    /**
     * Time in milliseconds. How long to wait for retry if a request is pending
     * @type {number}
     */
    this.queueRetryTimeout =    50;
    /**
     * Indicates if there is a request waiting for its response
     * @type {boolean}
     */
    this.pending =              false;

    /**
     * connect
     * @param {boolean} reconnect optional - defaults to false. Set to true if this is a reconnect
     */
    this.connect = function (reconnect) {

        //console.log(reconnect ? 'client reconnecting' : 'client connecting');
        if (that.socket && typeof that.socket.destroy === 'function') that.socket.destroy();
        reconnect ? that.emit('reconnecting') : that.emit('connecting');
        that.socket = net.createConnection(that.port, that.host);

        that.socket.on('error', function (e) {
             //console.log('socket error', e);
            /**
             * re-emits socket errors
             * @event Client#error
             * @param {Error} e
             */
            that.emit('error', e);

        });


        that.socket.on('timeout', function (e) {
            //console.log('socket timeout', e);
        });



        that.socket.on('close', function (e) {
            //console.log('socket close', e);
            /**
             * emitted when the socket is closed
             * @event Client#close
             */
            that.connected = false;
            that.emit('close');
            setTimeout(function () {
                //that.connect(true);
            }, 3000);
        });

        that.socket.on('connect', function () {
            /**
             * emitted when the socket connection is established
             * @event Client#connect
             */
            //console.log('socket connect');
            that.connected = true;

            that.socket.setKeepAlive(true, 10000);


            setTimeout(function () {
                that.emit('connect');
            }, 200);

        });
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
        if (that.queue.length) {
            if (that.pending) {
                setTimeout(that.queueShift, that.queueRetryTimeout);
            } else {
                that.pending = true;


                var response = new Buffer(0);
                var chunk = 0;
                var length;

                var obj = that.queue.shift();

                that.socket.on('data', function (data) {
                    if (chunk == 0) {
                        var vars = binary.parse(data)
                            .buffer('head', 3)
                            .word8('msgType')
                            .word32bu('msgSize')
                            .vars
                            ;
                        length = vars.msgSize + 8;
                        response = data;
                        if (vars.head.toString() !== 'Bin') {
                            that.socket.removeAllListeners('data');
                            that.pending = false;
                            if (typeof obj.callback === 'function') obj.callback('malformed response');


                            return;
                        }
                    } else {
                        response = Buffer.concat([response, data]);
                    }
                    chunk = chunk + 1;
                    if (response.length >= length) {
                        that.socket.removeAllListeners('data');
                        that.pending = false;
                        if (typeof obj.callback === 'function') obj.callback(null, response);
                    }
                });
                that.socket.write(obj.buf);
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

        if (!that.connected) {
            if (typeof callback === 'function') callback(new Error('not connected'));
            return;
        }

        if (this.pending && this.queue.length > this.queueMaxLength) {
            if (typeof callback === 'function') callback(new Error('You are sending too fast'));
        } else {
            this.queuePush(binrpc.encodeRequest(method, params), function (err, res) {
                if (typeof callback === 'function') callback(err, binrpc.decodeResponse(res));
            });
        }

    };

    this.connect();

};

util.inherits(Client, EventEmitter);

module.exports = Client;
