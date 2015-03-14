var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    ReadLevels = require('../../../src/tasks/read-levels');

describe('tasks/read-levels', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should be read-levels', function (done) {
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadLevels(t);
                return rd.run(result1).then(function (result2) {
                    result2.levels.should.be.ok;
                    result2.levels.should.be.instanceOf(Array);
                    result2.levels.should.have.length(3);
                    done();
                });
            })
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
