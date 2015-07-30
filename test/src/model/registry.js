var fs = require('fs'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage'),
    Registry = require('../../../src/model/registry');

describe('Registry', function () {
    var stubRegistry = fs.readFileSync('./test/test-registry/data.json', { encoding: 'utf-8' });
        options = {
            storage: {
                namespace: 'my-site',
                get: { host: '127.0.0.1', port: 3000 },
                post: { host: '127.0.0.1', port: 3001 },
                auth: ''
            }
        };

    describe('constructor', function () {
        var registry = new Registry(options);
        registry.should.be.ok;
        registry.should.have.property('_options');
        registry.should.have.property('_logger');

        registry._options.should.be.ok;
        registry._logger.should.be.ok;

        should.deepEqual(registry._options, options);
    });

    describe('load', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () { done(); }, 500);
        });

        it('missed registry', function (done) {
            var registry = new Registry(options);
            registry.load()
                .then(function (result) {
                    should.deepEqual(result, {});
                    should.deepEqual(registry._registry, {});
                    done();
                })
                .done();
        });

        describe('invalid registry', function () {
            before(function (done) {
                storage.get(options.storage).write(constants.ROOT, undefined, function () {
                    done();
                });
            });

            it('success', function (done) {
                var registry = new Registry(options);
                registry.load()
                    .then(function (result) {
                        should.deepEqual(result, {});
                        should.deepEqual(registry._registry, {});
                        done();
                    })
                    .done();
            });

            after(function (done) {
                storage.get(options.storage).remove(constants.ROOT, function () {
                    done();
                });
            });
        });

        describe('valid registry', function () {
            before(function (done) {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            });

            it('success', function (done) {
                var registry = new Registry(options);
                registry.load()
                    .then(function (result) {
                        should.deepEqual(result, JSON.parse(stubRegistry));
                        should.deepEqual(registry._registry, JSON.parse(stubRegistry));
                        done();
                    })
                    .done();
            });

            after(function (done) {
                storage.get(options.storage).remove(constants.ROOT, function () {
                    done();
                });
            });
        });

        after(function () {
            emulator.stop();
        });
    });

    describe('save', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () { done(); }, 500);
        });

        it('success', function (done) {
            var registry = new Registry(options);
            registry._registry = JSON.parse(stubRegistry);
            registry.save()
                .then(function () {
                    return storage.get(options.storage).read(constants.ROOT, function (err, result) {
                        should(err).not.be.ok;
                        result.should.be.ok;
                        result.should.be.instanceOf(String);
                        should.deepEqual(JSON.parse(result), JSON.parse(stubRegistry));
                        done();
                    });
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('getLibraries', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('success', function (done) {
            var registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.getLibraries().should.be.ok;
                    registry.getLibraries().should.be.instanceOf(Array);
                    should.deepEqual(registry.getLibraries(), Object.keys(JSON.parse(stubRegistry)));
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('getLibrary', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('success', function (done) {
            var lib = 'bem-core',
                registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.getLibrary(lib).should.be.ok;
                    registry.getLibrary(lib).should.be.instanceOf(Object);
                    should.deepEqual(registry.getLibrary(lib), (JSON.parse(stubRegistry))[lib]);
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('getVersions', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('success', function (done) {
            var lib = 'bem-core',
                registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.getVersions(lib).should.be.ok;
                    registry.getVersions(lib).should.be.instanceOf(Array);
                    should.deepEqual(registry.getVersions(lib), Object.keys((JSON.parse(stubRegistry))[lib].versions));
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('getVersion', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('success', function (done) {
            var lib = 'bem-core',
                version = 'v2.3.0',
                registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.getVersion(lib, version).should.be.ok;
                    registry.getVersion(lib, version).should.be.instanceOf(Object);
                    should.deepEqual(registry.getVersion(lib, version),
                        (JSON.parse(stubRegistry))[lib].versions[version]);
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('updateOrCreateVersion', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('for existed library', function (done) {
            var lib = 'bem-core',
                version = 'v2.3.0',
                registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.updateOrCreateVersion(lib, version, '1234567890');
                    registry._registry[lib].versions[version ].sha  .should.equal('1234567890');
                    done();
                })
                .done();
        });

        it ('for new library', function (done) {
            var lib = 'bem-core1',
                version = 'v2.3.0',
                registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.updateOrCreateVersion(lib, version, '1234567890');
                    registry._registry[lib].versions[version ].sha.should.equal('1234567890');
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });

    describe('removeVersion', function () {
        before(function (done) {
            emulator.start(options.storage.get.port, options.storage.post.port);
            setTimeout(function () {
                storage.get(options.storage).write(constants.ROOT, stubRegistry, function () {
                    done();
                });
            }, 500);
        });

        it ('library does not exists in registry', function (done) {
            var registry = new Registry(options);
            registry.load()
                .then(function () {
                    return registry.removeVersion('bla-bla', 'v2.3.0')
                })
                .fail(function (err) {
                    err.should.be.ok;
                    err.message.should.equal('Library bla-bla was not found in registry');
                    done();
                })
                .done();
        });

        it ('library version does not exists in registry', function (done) {
            var registry = new Registry(options);
            registry.load()
                .then(function () {
                    return registry.removeVersion('bem-core', 'v100.0.0')
                })
                .fail(function (err) {
                    err.should.be.ok;
                    err.message.should.equal('Library bem-core version v100.0.0 was not found in registry');
                    done();
                })
                .done();
        });

        it ('success', function (done) {
            var registry = new Registry(options);
            registry.load()
                .then(function () {
                    registry.removeVersion('bem-core', 'v2.3.0');
                    should(registry._registry['bem-core'].versions['v2.3.0']).not.be.ok;
                    done();
                })
                .done();
        });

        after(function (done) {
            storage.get(options.storage).remove(constants.ROOT, function () {
                emulator.stop();
                done();
            });
        });
    });
});
