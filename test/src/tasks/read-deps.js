var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    ReadDependencies = require('../../../src/tasks/read-deps');

describe('tasks/read-deps', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it('should be read-deps', function (done) {
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadDependencies(t);
                return rd.run(result1).then(function (result2) {
                    result2.deps.should.be.ok;
                    result2.deps.should.be.instanceOf(Object);
                    result2.deps.should.have.property('bem-bl');
                    result2.deps['bem-bl'].should.equal('git://github.com/bem/bem-bl.git#^2.0.2');
                    done();
                });
            })
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
