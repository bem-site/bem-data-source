var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    RemoveTemp = require('../../../src/tasks/remove-temp');

describe('tasks/remove-temp', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should remove temp directory', function (done) {
        vow.resolve()
            .then(function () {
                var rt = new RemoveTemp(t);
                return rt.run().then(function () {
                    vowFs.exists(t.getTempPath()).then(function (exists) {
                        exists.should.be.false;
                        done();
                    });
                });
            })
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
