/* eslint capitalized-comments: 0 */

var Client =        require('./client.js');
var Server =        require('./server.js');

/** @exports binrpc */
var Binrpc = {

    /**
     * RPC client factory
     * @param {object} options containing a host and a port attribute
     * @returns {Client}
     */
    createClient: function (options) {
        return new Client(options);
    },

    /**
     * RPC server factory
     * @param {object} options containing a host and a port attribute
     * @returns {Server}
     */
    createServer: function (options) {
        return new Server(options);
    }
};

module.exports = Binrpc;
