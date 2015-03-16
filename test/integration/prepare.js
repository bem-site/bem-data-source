var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    constants = require('../../src/constants'),
    storage = require('../../src/storage'),
    Target = require('../../src/targets/prepare');

describe('integration prepare', function () {
    before(function () {
        process.chdir(path.resolve(__dirname, '../test-data'));
    });

    it('should execute prepare task', function (done) {
        var t = new Target('v1.0.0', {});
        t.execute().then(function () {
            done();
        });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../'));
    });
});
