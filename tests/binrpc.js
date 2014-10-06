var binrpc = require('./../lib/binrpc.js');

require('should');

describe('binrpc.buildRequest', function () {

    it("should return buffer", function () {
        var cmd = binrpc.buildRequest('system.listMethods').toString('hex');
        cmd.should.equal('42 69 6e 00 00 00 00 1a 00 00 00 12 73 79 73 74 65 6d 2e 6c 69 73 74 4d 65 74 68 6f 64 73 00 00 00 00'.replace(/ /g, ''));
    });

    it("should return buffer", function () {
        var cmd = binrpc.buildRequest('init', ['xmlrpc_bin://172.16.23.180:2004', 'test']).toString('hex');
        cmd.should.equal('42 69 6e 00 00 00 00 3f 00 00 00 04 69 6e 69 74 00 00 00 02 00 00 00 03 00 00 00 1f 78 6d 6c 72 70 63 5f 62 69 6e 3a 2f 2f 31 37 32 2e 31 36 2e 32 33 2e 31 38 30 3a 32 30 30 34 00 00 00 03 00 00 00 04 74 65 73 74'.replace(/ /g, ''));
    });

});


describe('binrpc.parseRequest', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildRequest('test', [{"bla": "blubb"}]);
        console.log(buf, binrpc.parseRequest(buf));

    });
});


describe('binrpc.parseRequest', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildRequest('init', ['xmlrpc_bin://172.16.23.180:2004', 'test']);
        console.log('...', buf, binrpc.parseRequest(buf));

    });
});

describe('binrpc.parseRequest', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildRequest('setValue', ['EEQ123456:1', 'STATE', true]);
        console.log(binrpc.parseRequest(buf));
    });
});


describe('binrpc.buildInteger', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildInteger(41);
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.be.true;
        hexstring.should.equal('00 00 00 01 00 00 00 29'.replace(/ /g, ''));
    });
});

describe('binrpc.buildBool', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildBool(true);
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.equal(true);
        hexstring.should.equal('00 00 00 02 01'.replace(/ /g, ''));
    });
});

describe('binrpc.buildString', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildString('BidCoS-RF');
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.equal(true);
        hexstring.should.equal('00 00 00 03 00 00 00 09 42 69 64 43 6f 53 2d 52 46'.replace(/ /g, ''));
    });
});

describe('binrpc.buildDouble', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildDouble(1234);
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.equal(true);
        hexstring.should.equal('00 00 00 04 13 48 00 00 00 00 00 0c'.replace(/ /g, ''));
    });

    it("should return buffer", function () {
        var buf = binrpc.buildDouble(-9999.9999);
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.equal(true);
        hexstring.should.equal('00 00 00 04 ec 78 00 03 00 00 00 0f'.replace(/ /g, ''));
    });
});

describe('binrpc.buildStruct', function () {
    it("should return buffer", function () {
        var buf = binrpc.buildStruct({'Temperature': 20.5});
        var hexstring = buf.toString('hex');
        (buf instanceof Buffer).should.equal(true);
        hexstring.should.equal('00 00 01 01 00 00 00 01 00 00 00 0b 54 65 6d 70 65 72 61 74 75 72 65 00 00 00 04 14 80 00 00 00 00 00 06'.replace(/ /g, ''));
    });
});


describe('binrpc.parseData(binrpc.buildDouble(x))', function () {
    it("content should return 1234", function () {
        var buf = binrpc.buildDouble(1234);
        binrpc.parseData(buf).content.should.equal(1234);
    });

    it("content should return 0", function () {
        var x = 0;
        var buf = binrpc.buildDouble(x);
        binrpc.parseData(buf).content.should.equal(x);
    });

    it("content should return 0.3", function () {
        var x = 0.3;
        var buf = binrpc.buildDouble(x);
        binrpc.parseData(buf).content.should.equal(x);
    });
    it("content should return 0.5", function () {
        var x = 0.5;
        var buf = binrpc.buildDouble(x);
        binrpc.parseData(buf).content.should.equal(x);
    });


    it("content should return -50.123456", function () {
        var x = -50.123456;
        var buf = binrpc.buildDouble(x);
        binrpc.parseData(buf).content.should.equal(x);
    });

    it("content should return 999.999999", function () {
        var x = 0.999999;
        var buf = binrpc.buildDouble(x);
        binrpc.parseData(buf).content.should.equal(x);
    });

    it("rest should be zero length buffer", function () {
        var buf = binrpc.parseData(binrpc.buildDouble(1234)).rest;
        (buf instanceof Buffer).should.equal(true);
        buf.length.should.equal(0);
    });

});
