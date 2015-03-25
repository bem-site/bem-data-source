var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    ReadDependencies = require('../../../src/tasks/read-deps');

describe('tasks/read-deps', function () {
    var t;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        t = new Target('v1.0.0', {});
    });

    describe('should release empty deps on', function () {
        before(function (done) {
            vowFs.move(path.join(process.cwd(), 'bower.json'), path.join(process.cwd(), '_bower.json'))
                .then(function () {
                    done();
                })
                .done();
        });

        it ('missing bower.json file', function (done) {
            vow.resolve(t.createResultBase())
                .then(function (result1) {
                    var rd = new ReadDependencies(t);
                    return rd.run(result1)
                        .then(function (result2) {
                            should(result2.deps).not.be.ok;
                            done();
                        })
                        .fail(function () {
                            done();
                        });
                });
        });

        describe ('invalid bower.json file', function () {
            before(function (done) {
                vowFs.write(path.join(process.cwd(), 'bower.json'), 'invalid json data', 'utf-8')
                    .then(function () {
                        done();
                    })
                    .done();
            });

            it ('it should fail', function (done) {
                vow.resolve(t.createResultBase())
                    .then(function (result1) {
                        var rd = new ReadDependencies(t);
                        return rd.run(result1).then(function (result2) {
                            should(result2.deps).not.be.ok;
                            done();
                        });
                    });
            });

            after(function (done) {
                vowFs.remove(path.join(process.cwd(), 'bower.json'))
                    .then(function () {
                        done();
                    })
                    .done();
            });
        });

        after(function (done) {
            vowFs.move(path.join(process.cwd(), '_bower.json'), path.join(process.cwd(), 'bower.json'))
                .then(function () {
                    done();
                })
                .done();
        });
    });

    it('should be read-deps', function (done) {
        vow.resolve(t.createResultBase())
            .then(function (result1) {
                var rd = new ReadDependencies(t);
                return rd.run(result1)
                    .then(function (result2) {
                        result2.deps.should.be.ok;
                        result2.deps.should.be.instanceOf(Object);
                        result2.deps.should.have.property('bem-bl');
                        result2.deps['bem-bl'].should.equal('git://github.com/bem/bem-bl.git#^2.0.2');
                        done();
                    })
                    .fail(function (err) {
                        done();
                    });
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
