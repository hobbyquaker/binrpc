/**
 *      HomeMatic BIN-RPC
 *
 *      Copyright (c) 2014 https://github.com/hobbyquaker
 *
 *
 */

var util =          require('util');
var EventEmitter =  require('events').EventEmitter;
var net =           require('net');

var Put =           require('put');
var binary =        require('binary');

var rpcClient =     function (options) {
    this.host =     options.host;
    this.port =     options.port;
};


rpcClient.prototype.methodCall = function (method, params, callback) {
    //console.log('host ' + this.host + '  port ' + this.port);
    //console.log('methodCall', method, params);
    Binrpc.request(this.host, this.port, method, params, function (err, res) {
        callback(err, res);
    });
};


var rpcServer = function (options) {
    var that = this;
    this.host = options.host;
    this.port = options.port;
    //console.log('createServer');
    this.server = net.createServer(function (c) {
        var receiver = new Buffer(0);
        var chunk = 0;
        var length;
        //var name = c.remoteAddress + ":" + c.remotePort;
        //console.log('<-- ' + name + ' connected');

        c.on('error', function (e) {
            //console.log('error ' + name + ' ' + JSON.stringify(e));
        });

        c.on('end', function () {
            //console.log('<-- ' + name + ' disconnected');
        });

        c.on('data', function (data) {
            //console.log("server receiving");
            //console.log(data);

            if (chunk == 0) {
                var vars = binary.parse(data)
                    .buffer("head", 3)
                    .word8("msgType")
                    .word32bu("msgSize")
                    .vars;
                length = vars.msgSize;
                receiver = data;
            } else {
                receiver = Buffer.concat([receiver, data]);

            }
            //console.log("receive chunk=" + chunk + " receiver.length=" + receiver.length);

            chunk = chunk + 1;

            if (receiver.length >= (length + 8)) {
                //console.log('received', receiver.length, receiver);
                var request = Binrpc.parseRequest(receiver);
                var res = that.emit(request.method, null, request.params, function (err, response) {
                    //console.log(request.method, request.params);
                    //console.log(response);
                    var buf = response ? Binrpc.buildResponse(response) : Binrpc.buildResponse('');
                    //console.log('sending response', buf.length, buf);
                    c.write(buf);
                    receiver = new Buffer(0);
                    chunk = 0;

                });
                if (!res) {
                    that.emit('NotFound', request.method, request.params);
                    c.write(Binrpc.buildResponse(''));
                    receiver = new Buffer(0);
                    chunk = 0;
                }


            }

        });

    });
    this.server.listen(this.port, this.host, function () {
        //console.log('listening on ' + that.port);
    });

};

util.inherits(rpcServer, EventEmitter);


var Binrpc = {
    createClient: function (options) {
        return new rpcClient(options);
    },
    createServer: function (options) {
        return new rpcServer(options);
    },
    request: function (host, port, method, data, callback) {
        //console.log("--> "+ host +":"+port+" request " + method + " " + JSON.stringify(data));
        this.sendRequest(host, port, this.buildRequest(method, data), callback);
    },
    buildRequest: function (method, data) {
        //console.log('buildRequest', method, data);

        if (!data) {
            data = [];
        }
    
        var content = new Buffer(0);
    
        for (var i = 0; i < data.length; i++) {
            content = Buffer.concat([content, this.buildData(data[i])]);
        }

        var header = Put()
                .put(new Buffer('Bin', 'ascii'))
                .word8(0)
                .word32be(8 + method.length + content.length) // Msg Size
                .word32be(method.length)
                .put(new Buffer(method, 'ascii'))
                .word32be(data.length)
                .buffer()
            ;

        var buf = Buffer.concat([header, content]);
        //console.log('buildRequest done buf.length content.length', buf.length, content.length, buf);
        return buf;
    },
    buildResponse: function (data) {
        var data = this.buildData(data);
        var buf = Put()
                .put(new Buffer('Bin', 'ascii'))
                .word8(0x01)
                .word32be(data.length) // Msg Size
                .buffer()
            ;

        buf = Buffer.concat([buf,data]);
        //console.log('buildResponse', buf.length, buf)

        return buf;
    
    },
    buildData: function (obj) {
        //console.log('buildData', obj, typeof object);
        var buf, objType = typeof obj;
        switch (objType) {
            case "number":
                if (obj % 1 === 0) {
                    buf = this.buildInteger(obj);
                } else {
                    buf = this.buildDouble(obj);
                }
                break;
    
            case "string":
                buf = this.buildString(obj);
                break;
    
            case "boolean":
                buf = this.buildBool(obj);
                break;
            case "object":
                if (Object.prototype.toString.call(obj) === '[object Array]') {
                    buf = this.buildArray(obj);
                } else {
                    if (typeof obj.explicitDouble === 'number') {
                        buf = this.buildDouble(obj.explicitDouble);
                    } else {
                        buf = this.buildStruct(obj);
                    }
                }
                break;
    
    
            default:
                //console.log('error');
    
        }
        return buf;
    
    },
    buildStruct: function (obj) {
        //console.log('buildStruct', obj);
        var i = 0;
        var content = new Buffer(0);

        for (var key in obj) {
            content = Buffer.concat([content, this.buildStructKey(key), this.buildData(obj[key])]);
            i += 1;
        }

        var header = Put()
            .word32be(0x101)
            .word32be(i)
            .buffer();

        var buf = Buffer.concat([header, content]);
        //console.log('buildStruct done', buf);
        return buf;

    },
    buildStructKey: function (str) {
        //console.log('buildStructKey', str);
        return Put()
            .word32be(str.length)
            .put(new Buffer(str, 'ascii'))
            .buffer();
    },
    buildArray: function (arr) {
        //console.log('buildArray', arr);
        var buf,
            arrLength = arr.length;
    
        buf = Put()
            .word32be(0x100)
            .word32be(arrLength)
            .buffer();
    
        for (var i = 0; i < arrLength; i++) {
            buf = Buffer.concat([buf, this.buildData(arr[i])]);
        }
        return buf;
    
    },
    buildString: function (str) {
        //console.log('buildString', str);
        return Put()
            .word32be(0x0003)
            .word32be(str.length)
            .put(new Buffer(str, 'ascii'))
            .buffer();
    },
    buildBool: function (b) {
        //console.log('buildBool', b);
        return Put()
            .word32be(0x02)
            .word8be(b ? 1 : 0)
            .buffer();
    },
    buildInteger: function (i) {
        //console.log('buildInteger', i);
        return Put()
            .word32be(0x01)
            .word32be(i)
            .buffer();
    },
    buildDouble: function (d) {

        var exp = Math.ceil(Math.log(Math.abs(d)) / Math.LN2) + 1;
        var man = Math.floor((d * Math.pow(2, -exp)) * (1 << 30));

        /*
        var v = Math.abs(d);
        var tmp = v;
        var exp = 0;
        while (tmp >= 2) {
            tmp = Math.abs(v / Math.pow(2, exp++));
        }
        // Note that this limits the range of the inbound double
        var man = Math.abs(v / Math.pow(2, exp)) * 0x40000000;
        */

        var buf = Put()
            .word32be(0x04)
            .word32be(man)
            .word32be(exp)
            .buffer();
        console.log('buildDouble', d);
        console.log('exp = ' + exp.toString(16) + ' man = ' + man.toString(16));
        console.log(buf);
        return buf;
    },
    parseDouble: function (elem) {
        var flt = binary.parse(elem)
            .word32bs("mantissa")
            .word32bs("exponent")
            .buffer("rest", elem.length - 8)
            .vars;
        flt.content = parseFloat(((Math.pow(2, flt.exponent)) * (flt.mantissa / (1 << 30))).toFixed(6));
        //console.log("float exponent=" + flt.exponent + " mantissa=" + flt.mantissa + " value="+flt.content);
        return flt;
    },
    parseString: function (elem) {
        var str = binary.parse(elem)
            .word32bu("strLength")
            .buffer("strContent", "strLength")
            .buffer("rest", elem.length - 4) // Fixme - strLength should be substracted
            .vars;
        str.content = str.strContent.toString();
        return str;
    },
    parseBool: function (elem) {
        var int = binary.parse(elem)
            .word8("value")
            .buffer("rest", elem.length - 1)
            .vars;
        int.content = (int.value == 1 ? true : false);
        //console.log("bool " + int.content);
        return (int);
    },
    parseInt: function (elem) {
        var int = binary.parse(elem)
            .word32bu("value")
            .buffer("rest", elem.length - 4)
            .vars;
        if (int.value & 2147483648) { int.value = int.value - 4294967296; }
        int.content = int.value;
        //console.log("integer " + int.content);
        return int;
    },
    parseArray: function (elem) {
        var arr = binary.parse(elem)
            .word32bu("elementCount")
            .buffer("elements", elem.length - 4)
            .vars;
        //console.log("array.length", arr.elementCount);

        var elements = arr.elements;
        var result = [];

        for (var i = 0; i < arr.elementCount; i++) {
            //console.log('array elements', elements);
            if (!elements) {
                return {content: "", rest: undefined};
            }
            var res = this.parseData(elements);
            result.push(res.content);
            elements = res.rest;

        }


        return {content: result, rest: elements};
    },
    parseStruct: function (elem) {
        var struct = binary.parse(elem)
            .word32bu("elementCount")
            .buffer("elements", elem.length - 4)
            .vars;
        //console.log("struct.length "+struct.elementCount);

        var elements = struct.elements;
        var result = {};
        for (var i = 0; i < struct.elementCount; i++) {
            //console.log("struct["+i+"]");
            var key = binary.parse(elements)
                .word32bu("keylength")
                .buffer("key", "keylength")
                .buffer("rest", elements.length - 4) // Fixme - what to substract?
                .vars;
            //console.log(key.key.toString());
            elements = key.rest;
            var elem = (this.parseData(elements));
            elements = elem.rest;
            result[key.key.toString()] = elem.content;

        }
        //console.log(elem.content);
        return {content: result, rest: elements};
    },
    parseData: function (data) {
        //console.log("parseData data.length="+data.length);
        //console.log(data);
        if (!data) { return };
        var res = binary.parse(data)
            .word32bu("dataType")
            .buffer("elements", data.length)
            .vars;
    
    
        switch (res.dataType) {
            case 0x101:
                return this.parseStruct(res.elements);
                break;
            case 0x100:
                return this.parseArray(res.elements);
                break;
            case 0x04:
                return this.parseDouble(res.elements);
                break;
            case 0x03:
                return this.parseString(res.elements);
                break;
            case 0x02:
                return this.parseBool(res.elements);
                break;
            case 0x01:
                return this.parseInt(res.elements);
                break;
            case 0x42696E00:
                //console.log("<-- next request?!");
                //this.parseRequest(data);
                return;
                break;
            default:
                //console.log("<-- error: unknow data type " + res.dataType + " :(");
                return;
    
        }
    },
    parseResponse: function (data) {

        //console.log(data);
        var vars = binary.parse(data)
                .buffer("head", 3)
                .word8("msgType")
                .word32bu("msgSize")
                .buffer("body", "msgSize")
                .vars
            ;
        //console.log("parseResponse data.length="+data.length+" msgSize="+vars.msgSize, data);
        if (vars.head.toString() != "Bin") {
            logger.error("<-- malformed header " + vars.head.toString() );
            //return false;
        }
    
        vars.head = vars.head.toString();
    
        switch (vars.msgType) {
            case 1:
                var res = this.parseData(vars.body);
                //console.log("<-- "+name+" response " + JSON.stringify(res.content));
                //console.log(res.content);
                break;
            default:
                //console.log("<-- wrong msgType in response", vars.msgType);
                //console.log(this.parseData(vars.body));

        }
        if (!res) {
            return;
        }
    
        if (res.rest.length > 0) {
            //console.log("rest..... ", res.rest.toString());
            //console.log(res.rest);
        }
        return res.content;
    
    },
    parseStrangeRequest: function (data) {
        var that = this;
        var arr = [];
        var rec = function (data) {
            if (data) {
                var tmp = that.parseData(data);
                if (tmp) {
                    arr.push(tmp.content);
                    if (tmp.rest && tmp.rest.length > 0) {
                        rec(tmp.rest);
                    }
                }
            }
        };
        rec(data);
        return arr;
    },
    parseRequest: function (data, name) {
        //console.log('parseRequest length=' + data.length);
        var response;
        var vars = binary.parse(data)
                .buffer("head", 3)
                .word8("msgType")
                .word32bu("msgSize")
                .buffer("body", data.length)
                .vars
            ;
    
        if (vars.head.toString() != "Bin") {
            logger.error("<-- malformed request header received");
            return false;
        }
    
        vars.head = vars.head.toString();
    
        var req = binary.parse(vars.body)
            .word32bu("strSize")
            .buffer("method", "strSize")
            .word32bu("elementcount")
            .buffer("body", data.length)
            .vars;
    
        switch (vars.msgType) {
            case 0:
                var res = this.parseStrangeRequest(req.body);
                var method = req.method.toString();

                //console.log("<-- "+name+" request " + method + " " + JSON.stringify(res));
                        
                
                return {method: method, params: res};
    
                break;
            default:
                logger.error("<-- wrong msgType in request");
        }
    
        return response;
    },
    sendRequest: function (host, port, buf, callback) {
        var that = this;
        var response = new Buffer(0);
        var chunk = 0;
        var length;
    
        var client = net.createConnection(port, host,
            function() { //'connect' listener
                //console.log('sending', buf.length, buf);
                //console.log(buf);
                client.write(buf.toString());

            });
    
        client.on('error', function (e) {
            //console.log("error: sendRequest", port, buf);
            //console.log(e);
            client.end();
            if (typeof callback === 'function') callback(e);
        });
    
        client.on('data', function(data) {
            //console.log("--> receiving chunk "+chunk+" data.length="+data.length);
    
            if (chunk == 0) {
                var vars = binary.parse(data)
                    .buffer("head", 3)
                    .word8("msgType")
                    .word32bu("msgSize")
                    .vars;
                length = vars.msgSize;
                response = data;
            } else {
                response = Buffer.concat([response, data]);
    
            }
            chunk = chunk + 1;
    
            //console.log("receive response chunk=" + chunk + " response.length="+response.length+ " length=" + length);
    
            if (response.length >= (length)) {
                //console.log('received response', response.length, response);
                var name = client.remoteAddress+":"+client.remotePort;
                client.end();
                var res = that.parseResponse(response, name);
                //console.log('--> '+name+ " closing connection");
                if (typeof callback === 'function') callback(null, res);
                response = new Buffer(0);
                chunk = 0;
            }

        });

        client.on('close', function() {
            //console.log('client close');

        });
        client.on('end', function() {

            //console.log('client end');

        });
        client.on('timeout', function() {
            //console.log('client timeout');

        });

    }

};

module.exports = Binrpc;
