var path = require('path'),

    should = require('should'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    fsExtra = require('fs-extra'),

    emulator = require('mds-wrapper/mds-emulator.js'),

    utility = require('../../src/util.js'),
    ds = require('../../index.js'),
    options = {
        storage: {
            namespace: 'my-site',
            get: {
                host: '127.0.0.1',
                port: 3000
            },
            post: {
                host: '127.0.0.1',
                port: 3001
            },
            auth: ''
        }
    };

describe('bem-data-source', function () {
    before(function () {
        process.chdir(path.join(__dirname, '../test-data'));
        emulator.start(options.storage.get.port, options.storage.post.port);
    });

    after(function () {
        emulator.stop();
        fsExtra.removeSync(path.join(__dirname, '../test-data/temp'));
        vowFs.remove(path.join(__dirname, '../test-data/data.json'))
    });

    describe('#publish', function () {
        it('should be valid done', function (done) {
            ds.publish('v1.0.0', options, false).then(function () {
                done();
            }).done();
        });
    });

    describe('#view', function () {
        it('should be correct number of libraries', function (done) {
            ds.view(null, null, options)
                .then(function (libraries) {
                    libraries.should.have.length(6);
                    done();
                }).done();
        });

        it('should be correct set of libraries', function (done) {
            ds.view(null, null, options)
                .then(function (libraries) {
                    (libraries.indexOf('test-library') > -1).should.be.true;
                    done();
                }).done();
        });

        it('should be correct number of versions', function (done) {
            ds.view('test-library', null, options)
                .then(function (versions) {
                    versions.should.have.length(1);
                    done();
                }).done();
        });

        it('should be correct set of versions', function (done) {
            ds.view('test-library', null, options)
                .then(function (versions) {
                    (versions.indexOf('v1.0.0') > -1).should.be.true;
                    done();
                }).done();
        });
    });

    describe('#replace', function () {
        it('should be valid done', function (done) {
            var o = {
                doc: 'readme',
                lang: 'ru',
                url: 'https://github.com/bem-site/bem-data-source/blob/master/README.md'
            };
            ds.replace('test-library', 'v1.0.0', _.extend({}, options, o))
                .then(function () {
                    done();
                }).done();
        });
    });

    describe('#remove', function () {
        it('should be valid done', function (done) {
            ds.remove('test-library', 'v1.0.0', options, false)
                .then(function () {
                    return ds.view('test-library', null, options);
                })
                .then(function (versions) {
                    versions.should.have.length(0);
                    done();
                }).done();
        });
    });
});
