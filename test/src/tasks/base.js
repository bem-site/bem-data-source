var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    Base = require('../../../src/tasks/base');

describe('tasks/base', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    it ('should be initialized successfully', function () {
        var bs = new Base(t);
        bs._target.should.be.ok;
        bs._logger.should.be.ok;
    });

    it ('should run successfully', function () {
        var bs = new Base(t);
        bs.run().should.equal(true);
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
