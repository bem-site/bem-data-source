var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    ReadMd = require('../../../src/tasks/read-md');

describe('tasks/read-md', function () {
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
    });

    it('should read and attach readme', function (done) {
        var t = new Target('v1.0.0', {});
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadMd(t);
                return rd.run(result1).then(function (result2) {
                    result2.docs.should.have.property('readme');
                    result2.docs.readme.should.have.property('title');
                    result2.docs.readme.title.should.be.ok;
                    result2.docs.readme.title.should.be.instanceOf(Object);
                    result2.docs.readme.should.have.property('content');
                    result2.docs.readme.content.should.be.ok;
                    result2.docs.readme.content.should.be.instanceOf(Object);
                    done();
                });
            })
    });

    it('should read and attach changelog', function (done) {
        var t = new Target('v1.0.0', {});
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadMd(t);
                return rd.run(result1).then(function (result2) {
                    result2.docs.should.have.property('changelog');
                    result2.docs.changelog.should.have.property('title');
                    result2.docs.changelog.title.should.be.ok;
                    result2.docs.changelog.title.should.be.instanceOf(Object);
                    result2.docs.changelog.should.have.property('content');
                    result2.docs.changelog.content.should.be.ok;
                    result2.docs.changelog.content.should.be.instanceOf(Object);
                    done();
                });
            })
    });

    it('should read and attach migration', function (done) {
        var t = new Target('v1.0.0', {});
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadMd(t);
                return rd.run(result1).then(function (result2) {
                    result2.docs.should.have.property('migration');
                    result2.docs.migration.should.have.property('title');
                    result2.docs.migration.title.should.be.ok;
                    result2.docs.migration.title.should.be.instanceOf(Object);
                    result2.docs.migration.should.have.property('content');
                    result2.docs.migration.content.should.be.ok;
                    result2.docs.migration.content.should.be.instanceOf(Object);
                    done();
                });
            })
    });

    it('should read and attach release notes', function (done) {
        var t = new Target('v1.0.0', {});
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadMd(t);
                return rd.run(result1).then(function (result2) {
                    result2.docs.should.have.property('notes');
                    result2.docs.notes.should.have.property('title');
                    result2.docs.notes.title.should.be.ok;
                    result2.docs.notes.title.should.be.instanceOf(Object);
                    result2.docs.notes.should.have.property('content');
                    result2.docs.notes.content.should.be.ok;
                    result2.docs.notes.content.should.be.instanceOf(Object);
                    done();
                });
            })
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
