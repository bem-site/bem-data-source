var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    CreateTemp = require('../../../src/tasks/create-temp');

describe('tasks/create-temp', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should create temp directory', function (done) {
        return vow.resolve()
            .then(function () {
                var rt = new CreateTemp(t);
                return rt.run().then(function () {
                    vowFs.exists(t.getTempPath()).then(function (exists) {
                        exists.should.be.true;
                        done();
                    });
                });
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
