var should = require('should'),
    constants = require('../../src/constants');

describe('constants', function () {
    describe('directory', function () {
        it('should have TEMP property', function () {
            constants.DIRECTORY.should.have.property('TEMP');
        });

        it('should have valid value of TEMP directory', function () {
            constants.DIRECTORY.TEMP.should.equal('temp');
        });
    });

    describe('file', function () {
        it('should have DATA property', function () {
            constants.FILE.should.have.property('DATA');
        });

        it('should have valid value of DATA file', function () {
            constants.FILE.DATA.should.equal('data.json');
        });
    });

    it('should have ROOT property', function () {
        constants.should.have.property('ROOT');
    });

    it('should have valid ROOT property', function () {
        constants.ROOT.should.equal('root');
    });

    it('should have LEVELS property', function () {
        constants.should.have.property('LEVELS');
    });

    it('should have valid LEVELS property', function () {
        constants.LEVELS.should.be.instanceOf(Array).and.have.length(4);
        constants.LEVELS.indexOf('desktop').should.greaterThan(-1);
        constants.LEVELS.indexOf('touch-pad').should.greaterThan(-1);
        constants.LEVELS.indexOf('touch-phone').should.greaterThan(-1);
    });

    it('should have MAXIMUM_OPEN_FILES property', function () {
        constants.should.have.property('MAXIMUM_OPEN_FILES');
    });

    it('should have valid MAXIMUM_OPEN_FILES property', function () {
        constants.MAXIMUM_OPEN_FILES.should.equal(100);
    });
});
