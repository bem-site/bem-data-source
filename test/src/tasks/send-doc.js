var path = require('path'),
    util = require('util'),
    _ = require('lodash'),
    vow = require('vow'),
    sha = require('sha1'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage'),
    Target = require('../../../src/targets/publish'),
    SendDoc = require('../../../src/tasks/send-doc');

describe('tasks/send-doc', function () {
    var options = {
            storage: {
                namespace: 'my-site',
                get: { host: '127.0.0.1', port: 3000 },
                post: { host: '127.0.0.1', port: 3001 },
                auth: ''
            }
        };
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        emulator.start(options.storage.get.port, options.storage.post.port);
    });

    describe('_generateShaKey', function () {
        var t, sd;

        before(function () {
            t = new Target('v1.0.0', options);
            sd = new SendDoc(t);
        });

        it('empty content', function () {
            var d = new Date();
            sd._generateShaKey('test-library', 'v1.0.0', null)
                .should.equal(sha(util.format('%s:%s:%s', 'test-library', 'v1.0.0', d.toString())));
        });

        it ('non-empty content', function () {
            sd._generateShaKey('test-library', 'v1.0.0', 'test-content').should.equal(sha('test-content'));
        });
    });

    describe('in dry mode', function () {
        var t, sd;

        before(function () {
            t = new Target('v1.0.0', _.merge({ isDryRun: true }, options));
            sd = new SendDoc(t);
        });

        it('success', function (done) {
            vow.resolve()
                .then(function () {
                    return sd.run();
                })
                .then(function () {
                    return storage.get(options.storage).read(constants.ROOT, function (err, dataRegistry) {
                        dataRegistry.should.be.ok;
                        (JSON.parse(dataRegistry)).should.not.have.property('test-library');
                        storage.get(options.storage).read('test-library/v1.0.0/data.json', function (err, dataDoc) {
                            should(dataDoc).not.be.ok;
                            done();
                        });
                    });
                })
                .done();
        });
    });

    describe('default', function () {
        var t, sd;

        before(function () {
            t = new Target('v1.0.0', options);
            sd = new SendDoc(t);
        });

        it('should be send-doc with empty registry', function (done) {
            vow.resolve()
                .then(function () {
                    return sd.run();
                })
                .then(function () {
                    storage.get(options.storage).read(constants.ROOT, function (err, dataRegistry) {
                        dataRegistry.should.be.ok;
                        JSON.parse(dataRegistry).should.have.property('test-library');
                        var l = JSON.parse(dataRegistry)['test-library'];

                        l.should.be.ok;
                        l.should.have.property('versions');
                        l['versions'].should.be.instanceOf(Object);
                        Object.keys(l['versions']).should.be.instanceOf(Array).and.have.length(1);

                        storage.get(options.storage).read('test-library/v1.0.0/data.json', function (err, dataDoc) {
                            dataDoc.should.be.ok;
                            done();
                        });
                    });
                });
        });

        it('should be send-doc with non-empty registry', function (done) {
            vow.resolve()
                .then(function () {
                    return sd.run();
                })
                .then(function () {
                    storage.get(options.storage).read(constants.ROOT, function (err, dataRegistry) {
                        dataRegistry.should.be.ok;
                        JSON.parse(dataRegistry).should.have.property('test-library');
                        var l = JSON.parse(dataRegistry)['test-library'];

                        l.should.be.ok;
                        l.should.have.property('versions');
                        l['versions'].should.be.instanceOf(Object);
                        Object.keys(l['versions']).should.be.instanceOf(Array).and.have.length(1);

                        storage.get(options.storage).read('test-library/v1.0.0/data.json', function (err, dataDoc) {
                            dataDoc.should.be.ok;
                            done();
                        });
                    });
                });
        });
    });

    after(function () {
        emulator.stop();
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
