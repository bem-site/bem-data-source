var path = require('path'),
    fs = require('fs'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    Target = require('../../../../src/targets/view/api'),
    constants = require('../../../../src/constants'),
    storage = require('../../../../src/storage');

describe('targets view api', function () {
    it('should be initialized', function () {
        new Target('test-library', 'v1.0.0', {});
    });

    describe('target view methods', function () {
        var options = {
                storage: {
                    namespace: 'my-site',
                    get: { host: '127.0.0.1', port: 3000 },
                    post: { host: '127.0.0.1', port: 3001 },
                    auth: ''
                }
            };

        describe('on empty registry', function () {
            var t;

            before(function () {
                emulator.start(options.storage.get.port, options.storage.post.port);
                t = new Target('test-library', 'v1.0.0', options);
            });

            it('should return null on execute', function (done) {
                t.execute()
                .fail(function (error) {
                        should.equal(error.message, 'Registry is null');
                        done();
                    });
            });

            after(function () {
                emulator.stop();
            });
        });

        describe('on filled registry', function () {
            before(function () {
                emulator.start(options.storage.get.port, options.storage.post.port);
                var p = path.resolve(__dirname, '../../../test-registry', 'data.json');
                storage.get(options.storage).write(constants.ROOT, fs.readFileSync(p), null);
            });

            it('should return list of libraries', function (done) {
                var t = new Target(null, null, options);
                t.execute().then(function (result) {
                    result.should.be.ok;
                    result.should.be.instanceOf(Array);
                    result.should.have.length(5);
                    done();
                });
            });

            describe('with given source', function () {
                it('should return empty list if given source does not exists in registry', function (done) {
                    var t = new Target('custom-library', null, options);
                    t.execute().then(function (result) {
                        result.should.be.ok;
                        result.should.be.instanceOf(Array);
                        result.should.have.length(0);
                        done();
                    });
                });

                it('should return list of library versions', function (done) {
                    var t = new Target('bem-components', null, options);
                    t.execute().then(function (result) {
                        result.should.be.ok;
                        result.should.be.instanceOf(Array);
                        result.should.have.length(2);
                        done();
                    });
                });
            });

            describe('with given source and version', function () {
                it('should return null if given version does not exists for library', function (done) {
                    var t = new Target('bem-components', 'unknown-version', options);
                    t.execute().then(function (result) {
                        should(result).not.be.ok;
                        done();
                    });
                });

                it('should return version data', function (done) {
                    var t = new Target('bem-components', 'v2', options);
                    t.execute().then(function (result) {
                        result.should.be.ok;
                        result.should.be.instanceOf(Object);
                        done();
                    });
                });
            });

            after(function () {
                emulator.stop();
            });
        });
    });
});
