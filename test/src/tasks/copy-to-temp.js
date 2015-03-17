var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    CopyToTemp = require('../../../src/tasks/copy-to-temp');

describe('tasks/copy-to-temp', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should rsync temp directory', function (done) {
        var rt = new CopyToTemp(t);
        return vow.resolve()
            .then(function () {
                return rt.run().then(function () {
                    vowFs.listDir(t.getTempPath()).then(function (result) {
                        result.should.be.ok;
                        result.should.be.instanceOf(Array);
                        result.should.have.length(3);
                        done();
                    })
                });
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
