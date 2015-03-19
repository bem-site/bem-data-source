var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    ReadShowcase = require('../../../src/tasks/read-showcase');

describe('tasks/read-showcase', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it ('should skip showcase creation if it is not presented in result base object', function (done) {
        return vow.resolve(t.createResultBase())
            .then(function (result1) {
                result1.showcase = undefined;
                var rs = new ReadShowcase(t);
                return rs.run(result1).then(function (result2) {
                    should(result2.showcase).not.be.ok;
                    done();
                });
            });
    });

    it('should read-showcase', function (done) {
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rs = new ReadShowcase(t);
                return rs.run(result1).then(function (result2) {
                    result2.showcase.content.should.be.ok;
                    result2.showcase.content.should.be.instanceOf(String);
                    done();
                });
            });
    });

    it ('should set showcase to null if showcase file does not exists', function (done) {
        return vow.resolve(t.createResultBase())
            .then(function (result1) {
                result1.showcase.path = '/invalid';
                var rs = new ReadShowcase(t);
                return rs.run(result1).then(function (result2) {
                    should(result2.showcase).not.be.ok;
                    done();
                });
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
