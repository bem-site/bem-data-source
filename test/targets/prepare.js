var should = require('should'),
    Target = require('../../src/targets/prepare');

describe('targets prepare', function () {
    it('should be initialized', function () {
        new Target('v1.0.0', {});
    });

    describe('after initialization', function () {
        var t,
            ref = 'v1.0.0';

        before(function () {
            t = new Target(ref, {});
        });

        it('should have options', function () {
            t._options.should.be.ok;
            Object.keys(t._options).should.have.length(0);
        });

        it('should have tasks', function () {
            t._tasks.should.be.ok;
            t._tasks.should.be.instanceOf(Array);
        });

        it('should have valid number of tasks', function () {
            t._tasks.should.have.length(4);
        });
    });
});

