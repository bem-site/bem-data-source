var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    WriteResult = require('../../../src/tasks/write-result');

describe('tasks/write-result', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should be read-deps', function (done) {
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new WriteResult(t);
                return rd.run(result1)
                    .then(function () {
                        return vowFs.read(path.join(process.cwd(), 'data.json'), 'utf-8')
                    })
                    .then(function (content) {
                        content = JSON.parse(content);
                        content.should.be.ok;
                        content.should.be.instanceOf(Object);
                        done();
                    });
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
