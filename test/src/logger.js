var path = require('path'),
    should = require('should'),
    Logger = require('../../src/logger'),
    loggerD,
    loggerT,
    loggerP;

describe('logger', function () {
    it('should can be initialized without params in default mode', function () {
        var loggerDefault = new Logger(module);
        loggerDefault._mode.should.equal('development');
        loggerDefault._level.should.equal('info');
    });

    describe('development mode', function () {
        before(function () {
            process.env.NODE_ENV = 'development';
        });

        it('should can be initialized in development mode', function () {
            loggerD = new Logger(module, 'verbose');
            loggerD._mode.should.equal('development');
            loggerD._level.should.equal('verbose');
        });

        it('should can verbose in development mode', function () {
            loggerD.verbose('test development verbose message with param %s and %s', 1, 2);
        });

        it('should can debug in development mode', function () {
            loggerD.debug('test development debug message with param %s and %s', 1, 2);
        });

        it('should can info in development mode', function () {
            loggerD.info('test development info message with param %s and %s', 1, 2);
        });

        it('should can warn in development mode', function () {
            loggerD.warn('test development warn message with param %s and %s', 1, 2);
        });

        it('should can error in development mode', function () {
            loggerD.error('test development error message with param %s and %s', 1, 2);
        });
    });

    describe('testing mode', function () {
        before(function () {
            process.env.NODE_ENV = 'testing';
        });

        it('should can be initialized in testing mode', function () {
            loggerT = new Logger(module, 'verbose');
            loggerT._mode.should.equal('testing');
            loggerT._level.should.equal('verbose');
        });

        it('should can verbose in testing mode', function () {
            should.not.exist(loggerT.verbose('test testing verbose message'));
        });

        it('should can debug in testing mode', function () {
            should.not.exist(loggerT.debug('test testing debug message'));
        });

        it('should can info in testing mode', function () {
            should.not.exist(loggerT.info('test testing info message'));
        });

        it('should can warn in testing mode', function () {
            loggerT.warn('test testing warn message');
        });

        it('should can error in testing mode', function () {
            loggerT.error('test testing error message');
        });
    });

    describe('production mode', function () {
        before(function () {
            process.env.NODE_ENV = 'production';
        });

        it('should can be initialized in production mode', function () {
            loggerP = new Logger(module, 'verbose');
            loggerP._mode.should.equal('production');
            loggerP._level.should.equal('verbose');
        });

        it('should can verbose in production mode', function () {
            loggerP.verbose('test production verbose message');
        });

        it('should can debug in production mode', function () {
            loggerP.debug('test production debug message');
        });

        it('should can info in production mode', function () {
            loggerP.info('test production info message');
        });

        it('should can warn in production mode', function () {
            loggerP.warn('test production warn message');
        });

        it('should can error in production mode', function () {
            loggerP.error('test production error message');
        });
    });

    after(function () {
        process.env.NODE_ENV = 'testing';
    })
});
