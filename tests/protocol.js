const {describe, it} = require('node:test');
const assert = require('node:assert');

const binrpc = require('./../lib/protocol.js');

const hex = (s) => s.replace(/ /g, '');

describe('binrpc.encodeRequest', () => {
    it('should return buffer (system.listMethods)', () => {
        const cmd = binrpc.encodeRequest('system.listMethods').toString('hex');
        assert.strictEqual(
            cmd,
            hex(
                '42 69 6e 00 00 00 00 1a 00 00 00 12 73 79 73 74 65 6d 2e 6c 69 73 74 4d 65 74 68 6f 64 73 00 00 00 00',
            ),
        );
    });

    it('should return buffer (init)', () => {
        const cmd = binrpc.encodeRequest('init', ['xmlrpc_bin://172.16.23.180:2004', 'test']).toString('hex');
        assert.strictEqual(
            cmd,
            hex(
                '42 69 6e 00 00 00 00 3f 00 00 00 04 69 6e 69 74 00 00 00 02 00 00 00 03 00 00 00 1f 78 6d 6c 72 70 63 5f 62 69 6e 3a 2f 2f 31 37 32 2e 31 36 2e 32 33 2e 31 38 30 3a 32 30 30 34 00 00 00 03 00 00 00 04 74 65 73 74',
            ),
        );
    });

    it('should throw an error if argument is not type string', () => {
        assert.throws(() => {
            binrpc.encodeRequest(false);
        });
    });

    it('should throw an error if argument is an empty string', () => {
        assert.throws(() => {
            binrpc.encodeRequest('');
        });
    });
});

describe('binrpc.decodeRequest', () => {
    it('should decode a request with a struct param', () => {
        const obj = binrpc.decodeRequest(binrpc.encodeRequest('test', [{bla: 'blubb'}]));
        assert.strictEqual(obj.method, 'test');
        assert.deepStrictEqual(obj.params, [{bla: 'blubb'}]);
    });

    it('should decode an init request', () => {
        const obj = binrpc.decodeRequest(binrpc.encodeRequest('init', ['xmlrpc_bin://172.16.23.180:2004', 'test']));
        assert.strictEqual(obj.method, 'init');
        assert.deepStrictEqual(obj.params, ['xmlrpc_bin://172.16.23.180:2004', 'test']);
    });

    it('should decode a system.multicall request', () => {
        const params = [
            [
                {methodName: 'event', params: ['ID', 'LEVEL', 1]},
                {methodName: 'event', params: ['ID', 'STATE', true]},
            ],
        ];
        const obj = binrpc.decodeRequest(binrpc.encodeRequest('system.multicall', params));
        assert.strictEqual(obj.method, 'system.multicall');
        assert.deepStrictEqual(obj.params, params);
    });

    it('should decode a setValue request', () => {
        const obj = binrpc.decodeRequest(binrpc.encodeRequest('setValue', ['EEQ123456:1', 'STATE', true]));
        assert.strictEqual(obj.method, 'setValue');
        assert.deepStrictEqual(obj.params, ['EEQ123456:1', 'STATE', true]);
    });

    it('should throw an error if elem is not instanceof Buffer', () => {
        assert.throws(() => {
            binrpc.decodeRequest('string');
        });
    });

    it("should return false if Buffer doesn't start with Bin", () => {
        assert.strictEqual(binrpc.decodeRequest(Buffer.from('abc')), false);
    });
});

describe('binrpc.encodeInteger', () => {
    it('should return buffer', () => {
        const buf = binrpc.encodeInteger(41);
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 01 00 00 00 29'));
    });

    it('should throw an error if out of range (min)', () => {
        assert.throws(() => {
            binrpc.encodeInteger(-2147483649);
        });
    });

    it('should throw an error if out of range (max)', () => {
        assert.throws(() => {
            binrpc.encodeInteger(2147483648);
        });
    });

    it('should throw an error if argument is not type number (string)', () => {
        assert.throws(() => {
            binrpc.encodeInteger('string');
        });
    });

    it('should throw an error if argument is not type number (boolean)', () => {
        assert.throws(() => {
            binrpc.encodeInteger(false);
        });
    });
});

describe('binrpc.encodeBool', () => {
    it('should return buffer', () => {
        const buf = binrpc.encodeBool(true);
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 02 01'));
    });
});

describe('binrpc.encodeString', () => {
    it('should return buffer', () => {
        const buf = binrpc.encodeString('BidCoS-RF');
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 03 00 00 00 09 42 69 64 43 6f 53 2d 52 46'));
    });

    it('should throw an error if elem is not a string', () => {
        assert.throws(() => {
            binrpc.encodeString(123);
        });
    });
});

describe('binrpc.encodeData', () => {
    it('explicitDouble should return buffer', () => {
        const buf = binrpc.encodeData({explicitDouble: 1234});
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 04 26 90 00 00 00 00 00 0b'));
    });

    it('should throw an error if elem is undefined', () => {
        assert.throws(() => {
            binrpc.encodeData();
        });
    });
});

describe('binrpc.decodeStrangeRequest', () => {
    it('should throw an error if elem is not instanceof Buffer', () => {
        assert.throws(() => {
            binrpc.decodeStrangeRequest('string');
        });
    });
});

describe('binrpc.encodeDouble', () => {
    it('should return buffer (1234)', () => {
        const buf = binrpc.encodeDouble(1234);
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 04 26 90 00 00 00 00 00 0b'));
    });

    it('should return buffer (-9999.9999)', () => {
        const buf = binrpc.encodeDouble(-9999.9999);
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.toString('hex'), hex('00 00 00 04 d8 f0 00 06 00 00 00 0e'));
    });

    it('should throw an error if elem is not a number', () => {
        assert.throws(() => {
            binrpc.encodeDouble('abc');
        });
    });
});

describe('binrpc.encodeStruct', () => {
    it('should return buffer', () => {
        const buf = binrpc.encodeStruct({Temperature: 20.5});
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(
            buf.toString('hex'),
            hex(
                '00 00 01 01 00 00 00 01 00 00 00 0b 54 65 6d 70 65 72 61 74 75 72 65 00 00 00 04 29 00 00 00 00 00 00 05',
            ),
        );
    });

    it('should throw an error if argument is not type object', () => {
        assert.throws(() => {
            binrpc.encodeStruct(false);
        });
    });

    it('should not throw an error if object is empty', () => {
        binrpc.encodeStruct({});
    });
});

describe('binrpc.encodeStructKey', () => {
    it('should throw an error if argument is not type string', () => {
        assert.throws(() => {
            binrpc.encodeStructKey(false);
        });
    });
});

describe('binrpc.decodeData(binrpc.encodeDouble(x))', () => {
    it('rest should be zero length buffer', () => {
        const buf = binrpc.decodeData(binrpc.encodeDouble(1234)).rest;
        assert.ok(Buffer.isBuffer(buf));
        assert.strictEqual(buf.length, 0);
    });
});

describe('binrpc.decodeData(binrpc.buildDouble(x))', () => {
    const values = [
        0, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, -0.5, -20.5, 20.5, 100, 1234, 50.123456,
        -50.123456, 0.999999, -1, -0.000001,
    ];

    for (const val of values) {
        it('content should return ' + val, () => {
            const buf = binrpc.encodeDouble(val);
            assert.strictEqual(binrpc.decodeData(buf).content, val);
        });
    }
});

describe('binrpc.decodeData(binrpc.encodeInteger(x))', () => {
    const values = [-2147483648, -1000, -100, -10, -1, 0, 1, 2, 3, 4, 5, 10, 100, 1000, 65535, 2147483647];

    for (const val of values) {
        it('content should return ' + val, () => {
            const buf = binrpc.encodeInteger(val);
            assert.strictEqual(binrpc.decodeData(buf).content, val);
        });
    }
});

describe('binrpc.decodeData(binrpc.encodeBool(x))', () => {
    for (const val of [false, true]) {
        it('content should return ' + val, () => {
            const buf = binrpc.encodeBool(val);
            assert.strictEqual(binrpc.decodeData(buf).content, val);
        });
    }
});

describe('binrpc.decodeString(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeString('string');
        });
    });

    it('should throw an error if elem length is < 4', () => {
        assert.throws(() => {
            binrpc.decodeString(Buffer.from('123'));
        });
    });
});

describe('binrpc.decodeInteger(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeInteger('string');
        });
    });

    it('should throw an error if elem length is < 4', () => {
        assert.throws(() => {
            binrpc.decodeInteger(Buffer.from('123'));
        });
    });
});

describe('binrpc.decodeStruct(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeStruct('string');
        });
    });

    it('should throw an error if elem length is < 4', () => {
        assert.throws(() => {
            binrpc.decodeStruct(Buffer.from('123'));
        });
    });
});

describe('binrpc.decodeData(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeData('string');
        });
    });

    it('should return undefined if Buffer is empty', () => {
        assert.strictEqual(binrpc.decodeData(Buffer.from([])), undefined);
    });
});

describe('binrpc.decodeResponse(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeResponse('string');
        });
    });

    it("should return false if Buffer doesn't start with Bin", () => {
        assert.strictEqual(binrpc.decodeResponse(Buffer.from('abc')), false);
    });
});

describe('binrpc.decodeArray(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeArray('string');
        });
    });

    it('should throw an error if elem length is < 4', () => {
        assert.throws(() => {
            binrpc.decodeArray(Buffer.from('123'));
        });
    });
});

describe('binrpc.encodeArray(elem)', () => {
    it('should throw an error if elem is not an instance of Array', () => {
        assert.throws(() => {
            binrpc.encodeArray('string');
        });
    });
});

describe('binrpc.decodeBool(elem)', () => {
    it('should throw an error if elem is not an instance of Buffer', () => {
        assert.throws(() => {
            binrpc.decodeBool('string');
        });
    });

    it('should throw an error if elem length is < 1', () => {
        assert.throws(() => {
            binrpc.decodeBool(Buffer.alloc(0));
        });
    });
});

describe('binrpc.decodeDouble(elem)', () => {
    for (const elem of ['string', {test: true}, false, [0]]) {
        it('should throw an error if elem is not an instance of Buffer (' + JSON.stringify(elem) + ')', () => {
            assert.throws(() => {
                binrpc.decodeDouble(elem);
            });
        });
    }

    it('should throw an error if elem length is < 8', () => {
        assert.throws(() => {
            binrpc.decodeDouble(Buffer.from('1234567'));
        });
    });
});

describe('binrpc.encodeResponse', () => {
    it('should encode an empty string on undefined param', () => {
        const hexstring = binrpc.encodeResponse().toString('hex');
        assert.strictEqual(hexstring, hex('42 69 6e 01 00 00 00 08 00 00 00 03 00 00 00 00'));
    });
});
