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

    it('_onDebug', function () {
        var rt = new CopyToTemp(t);
        rt._onDebug('foo');
    });

    it('_onWarn', function () {
        var rt = new CopyToTemp(t);
        rt._onWarn('foo');
    });

    it ('_getCBFunction', function () {
        var def = vow.defer(),
            rt = new CopyToTemp(t);
        rt._getCBFunction(def).should.be.ok;
        rt._getCBFunction(def).should.be.instanceOf(Function);
    });

    it ('callback function on error', function () {
        var def = vow.defer(),
            rt = new CopyToTemp(t);

        rt._getCBFunction(def).call(rt, new Error('custom error'));
        def.promise().isRejected().should.equal(true);
    });

    it ('callback function on success', function () {
        var def = vow.defer(),
            rt = new CopyToTemp(t);

        rt._getCBFunction(def).call(rt, null, 0);
        def.promise().isResolved().should.equal(true);
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
