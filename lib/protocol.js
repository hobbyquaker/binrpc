/**
 * @class Protocol
 */
/** @exports protocol */

// The wire format stores every 32 bit word as big-endian two's complement,
// signed values (double mantissa/exponent, negative integers) included, so
// encoding goes through ToUint32 (>>> 0) — byte-identical to the output of
// the removed `put` dependency.
function encodeWord32(value) {
    var buf = Buffer.alloc(4);
    buf.writeUInt32BE(value >>> 0, 0);
    return buf;
}

var Protocol = {
    /**
     * encode requests
     * @param {string} method - throws error if not type string or if string is empty
     * @param {*} data optional - defaults to an empty array
     * @returns {Buffer}
     */
    encodeRequest: function (method, data) {
        if (typeof method !== 'string') {
            throw new TypeError("argument 'method' must be type string");
        }
        if (method === '') {
            throw new Error("argument 'method' is not allowed to be empty");
        }
        if (typeof data === 'undefined') {
            data = [];
        }
        var content = Buffer.alloc(0);
        for (var i = 0; i < data.length; i++) {
            content = Buffer.concat([content, this.encodeData(data[i])]);
        }
        var header = Buffer.concat([
            Buffer.from('Bin', 'ascii'),
            Buffer.from([0]),
            encodeWord32(8 + method.length + content.length), // Msg Size
            encodeWord32(method.length),
            Buffer.from(method, 'ascii'),
            encodeWord32(data.length),
        ]);
        return Buffer.concat([header, content]);
    },

    /**
     * encode response
     * @param {*} data optional - defaults to empty string
     * @returns {Buffer}
     */
    encodeResponse: function (data) {
        if (typeof data === 'undefined') {
            data = '';
        }
        var body = this.encodeData(data);
        var buf = Buffer.concat([Buffer.from('Bin', 'ascii'), Buffer.from([0x01]), encodeWord32(body.length)]);
        return Buffer.concat([buf, body]);
    },
    /**
     * encode data
     * @param {*} obj throws TypeError if obj is undefined or null
     * @returns {Buffer}
     */
    encodeData: function (obj) {
        var buf;
        var objType = typeof obj;
        if (objType === 'undefined' || obj === null) {
            throw new TypeError("argument 'obj' must be type number, string, boolean or object");
        }
        switch (objType) {
            case 'number':
                if (obj % 1 === 0) {
                    buf = this.encodeInteger(obj);
                } else {
                    buf = this.encodeDouble(obj);
                }
                break;

            case 'string':
                buf = this.encodeString(obj);
                break;

            case 'boolean':
                buf = this.encodeBool(obj);
                break;

            case 'object':
                if (Object.prototype.toString.call(obj) === '[object Array]') {
                    buf = this.encodeArray(obj);
                } else if (typeof obj.explicitDouble === 'number') {
                    buf = this.encodeDouble(obj.explicitDouble);
                } else {
                    buf = this.encodeStruct(obj);
                }
                break;
            default:
            // console.log('error');
        }
        return buf;
    },
    /**
     * encode struct
     * @param {object} obj throws error if not of type object
     * @returns {Buffer}
     */
    encodeStruct: function (obj) {
        if (typeof obj !== 'object') {
            throw new TypeError("argument 'd' must be an object");
        }
        var i = 0;
        var content = Buffer.alloc(0);
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                content = Buffer.concat([content, this.encodeStructKey(key), this.encodeData(obj[key])]);
                i += 1;
            }
        }
        var header = Buffer.concat([encodeWord32(0x101), encodeWord32(i)]);
        return Buffer.concat([header, content]);
    },
    /**
     * encode struct key
     * @param {string} str throws error if not of type string
     * @returns {Buffer}
     */
    encodeStructKey: function (str) {
        if (typeof str !== 'string') {
            throw new TypeError("argument 'd' must be a string");
        }
        return Buffer.concat([encodeWord32(str.length), Buffer.from(str, 'ascii')]);
    },
    /**
     * encode array
     * @param {array} arr throws error if not instance of Array
     * @returns {Buffer}
     */
    encodeArray: function (arr) {
        if (Object.prototype.toString.call(arr) !== '[object Array]') {
            throw new TypeError("argument 'd' must be an array");
        }
        var arrLength = arr.length;

        var buf = Buffer.concat([encodeWord32(0x100), encodeWord32(arrLength)]);
        for (var i = 0; i < arrLength; i++) {
            buf = Buffer.concat([buf, this.encodeData(arr[i])]);
        }
        return buf;
    },
    /**
     * encode string
     * @param {string} str throws error if not of type string
     * @returns {Buffer}
     */
    encodeString: function (str) {
        if (typeof str !== 'string') {
            throw new TypeError("argument 'str' must be a string");
        }
        return Buffer.concat([encodeWord32(0x0003), encodeWord32(str.length), Buffer.from(str, 'ascii')]);
    },
    /**
     * encode bool
     * @param {*} b any type
     * @returns {Buffer}
     */
    encodeBool: function (b) {
        return Buffer.concat([encodeWord32(0x02), Buffer.from([b ? 1 : 0])]);
    },
    /**
     * encode integer
     * @param {number} i throws error if not a number or if out of range (min=-2147483648 max=2147483647)
     * @returns {Buffer}
     */
    encodeInteger: function (i) {
        if (typeof i !== 'number') {
            throw new TypeError("argument 'i' must be a number");
        }
        if (i < -2147483648 || i > 2147483647) {
            throw new RangeError("argument 'i' must be between -2147483648 and 2147483647");
        }
        return Buffer.concat([encodeWord32(0x01), encodeWord32(i)]);
    },
    /**
     * encode double
     * @param {number} d throws error if not a number
     * @returns {Buffer}
     */
    encodeDouble: function (d) {
        if (typeof d !== 'number') {
            throw new TypeError("argument 'd' must be a number");
        }
        var exp = Math.floor(Math.log(Math.abs(d)) / Math.LN2) + 1;
        var man = Math.floor(d * Math.pow(2, -exp) * (1 << 30));
        return Buffer.concat([encodeWord32(0x04), encodeWord32(man), encodeWord32(exp)]);
    },
    /**
     * decode double
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <8
     * @returns {object} properties content and rest
     */
    decodeDouble: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length < 8) {
            throw new Error("argument 'elem' length must be >= 8");
        }
        var flt = {
            mantissa: elem.readInt32BE(0),
            exponent: elem.readInt32BE(4),
            rest: elem.subarray(8),
        };
        flt.content = parseFloat((Math.pow(2, flt.exponent) * (flt.mantissa / (1 << 30))).toFixed(6));
        return flt;
    },
    /**
     * decode string
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <4
     * @returns {object} properties content and rest
     */
    decodeString: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length < 4) {
            throw new Error("argument 'elem' length must be >= 4");
        }
        var strLength = elem.readUInt32BE(0);
        var strContent = elem.subarray(4, 4 + strLength);
        var str = {
            strLength: strLength,
            strContent: strContent,
            rest: elem.subarray(4 + strContent.length),
        };
        str.content = str.strContent.toString();
        return str;
    },
    /**
     * decode bool
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <1
     * @returns {object} properties content and rest
     */
    decodeBool: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length === 0) {
            throw new Error("argument 'elem' length must be >= 4");
        }
        var res = {
            value: elem.readUInt8(0),
            rest: elem.subarray(1),
        };
        res.content = res.value === 1;
        return res;
    },
    /**
     * decode integer
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <4
     * @returns {object} properties content and rest
     */
    decodeInteger: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length < 4) {
            throw new Error("argument 'elem' length must be >= 4");
        }
        var int = {
            value: elem.readInt32BE(0),
            rest: elem.subarray(4),
        };
        int.content = int.value;
        return int;
    },
    /**
     * decode array
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <4
     * @returns {object} properties content and rest
     */
    decodeArray: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length < 4) {
            throw new Error("argument 'elem' length must be >= 4");
        }
        var elementCount = elem.readUInt32BE(0);
        var elements = elem.subarray(4);
        var result = [];

        for (var i = 0; i < elementCount; i++) {
            if (!elements || elements.length === 0) {
                return {content: '', rest: undefined};
            }
            var res = this.decodeData(elements);
            result.push(res.content);
            elements = res.rest;
        }
        return {content: result, rest: elements};
    },
    /**
     * decode struct
     * @param {Buffer} elem throws error if not an instance of Buffer or if length <4
     * @returns {object} properties content and rest
     */
    decodeStruct: function (elem) {
        if (!(elem instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (elem.length < 4) {
            throw new Error("argument 'elem' length must be >= 4");
        }
        var elementCount = elem.readUInt32BE(0);
        var elements = elem.subarray(4);
        var result = {};
        for (var i = 0; i < elementCount; i++) {
            if (!elements || elements.length < 4) {
                break;
            }
            var keyLength = elements.readUInt32BE(0);
            var key = elements.subarray(4, 4 + keyLength);
            elements = elements.subarray(4 + key.length);
            var tmp = this.decodeData(elements);
            if (!tmp) {
                break;
            }
            elements = tmp.rest;
            result[key.toString()] = tmp.content;
        }
        return {content: result, rest: elements};
    },
    /**
     * decodes binary data
     * @param {Buffer} data
     * @returns {*}
     *
     */
    decodeData: function (data) {
        if (!(data instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        if (data.length === 0) {
            return;
        }

        var dataType = data.length >= 4 ? data.readUInt32BE(0) : undefined;
        if (!dataType) {
            console.log('<-- binrpc error: unknown response ' + JSON.stringify({dataType: dataType}) + ' :(');
            return;
        }
        var elements = data.subarray(4);

        switch (dataType) {
            case 0x101:
                return this.decodeStruct(elements);
            case 0x100:
                return this.decodeArray(elements);
            case 0x04:
                return this.decodeDouble(elements);
            case 0x03:
                return this.decodeString(elements);
            case 0x02:
                return this.decodeBool(elements);
            case 0x01:
                return this.decodeInteger(elements);
            default:
                console.log('<-- binrpc error: unknown data type ' + dataType.toString(16) + ' :(');
        }
    },
    /**
     * decode response
     * @param {Buffer} data throws TypeError if data is no instance of Buffer
     * @returns {*}
     */
    decodeResponse: function (data) {
        if (!(data instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        var head = data.subarray(0, 3);
        if (head.toString() !== 'Bin') {
            // console.log('<-- error: malformed header ' + head.toString() );
            return false;
        }
        var msgType = data.length > 3 ? data.readUInt8(3) : undefined;
        var msgSize = data.length >= 8 ? data.readUInt32BE(4) : 0;
        var body = data.subarray(8, 8 + msgSize);

        var res;

        switch (msgType) {
            case 0x01:
                res = this.decodeData(body);
                break;
            case 0xff:
                res = this.decodeData(body);
                break;
            default:
                // console.log("<-- error: wrong msgType in response", msgType);
                return false;
        }
        if (!res) {
            return;
        }

        return res.content;
    },
    /**
     * decode "strange" request
     * @param {Buffer} data throws TypeError if data is no instance of Buffer
     * @returns {Array}
     */
    decodeStrangeRequest: function (data) {
        if (!(data instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        var that = this;
        var arr = [];
        var rec = function (data) {
            if (data) {
                var tmp = that.decodeData(data);
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
    /**
     * decode request
     * @param {Buffer} data throws TypeError if not instance of Buffer
     * @returns {*}
     */
    decodeRequest: function (data) {
        if (!(data instanceof Buffer)) {
            throw new TypeError("argument 'elem' must be an instance of Buffer");
        }
        var head = data.subarray(0, 3);
        if (head.toString() !== 'Bin') {
            // console.log('<-- error: malformed sendRequest header received');
            return false;
        }
        var msgType = data.length > 3 ? data.readUInt8(3) : undefined;
        var body = data.subarray(8);

        if (msgType === 0) {
            var strSize = body.length >= 4 ? body.readUInt32BE(0) : 0;
            var method = body.subarray(4, 4 + strSize);
            // the element count word is skipped; decodeStrangeRequest reads
            // params until the buffer is exhausted
            var params = body.subarray(4 + method.length + 4);
            var res = this.decodeStrangeRequest(params);
            return {method: method.toString(), params: res};
        }
        // console.log('<-- error: wrong msgType in sendRequest');
        return false;
    },
};

module.exports = Protocol;
