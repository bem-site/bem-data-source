var fs = require('fs'),
    should = require('should'),
    util = require('../../src/util');

describe('util', function () {
    describe('getStorageConfiguration', function () {
        it('should show error if configuration is not set', function () {
            (function () {
                return util.getStorageConfiguration(null, 'testing');
            }).should.throw('storage configuration were not set');
        });

        it('should show error if common configuration is not set', function () {
            (function () {
                return util.getStorageConfiguration({}, 'testing');
            }).should.throw('common storage configuration were not found');
        });

        it('should show error if testing configuration is not set', function () {
            (function () {
                return util.getStorageConfiguration({ common: {} }, 'testing');
            }).should.throw('testing storage configuration were not found');
        });

        it('should show error if production configuration is not set', function () {
            (function () {
                return util.getStorageConfiguration({ common: {}, testing: {} }, 'testing');
            }).should.throw('production storage configuration were not found');
        });

        describe('should working properly on valid configuration object', function () {
            var o = {
                common: {
                    namespace: 'test-namespace',
                    get: {
                        host: '',
                        port: 80
                    },
                    post: {
                        host: '',
                        port: 1111
                    },
                    auth: 'auth string',
                    debug: false,
                    timeout: 300000
                },
                testing: {
                    get: { host: 'get.testing.storage.net' },
                    post: { host: 'post.testing.storage.net' }
                },
                production: {
                    get: { host: 'get.production.storage.net' },
                    post: { host: 'post.production.storage.net' }
                }
            };

            it('for testing', function () {
                var result = util.getStorageConfiguration(o, 'testing');

                result.should.be.ok;
                result.should.be.instanceOf(Object);

                result.get.should.be.ok;
                result.get.should.be.instanceOf(Object);
                result.get.should.have.property('host');
                result.get.host.should.equal('get.testing.storage.net');

                result.post.should.be.ok;
                result.post.should.be.instanceOf(Object);
                result.post.should.have.property('host');
                result.post.host.should.equal('post.testing.storage.net');
            });

            it('for production', function () {
                var result = util.getStorageConfiguration(o, 'production');

                result.should.be.ok;
                result.should.be.instanceOf(Object);

                result.get.should.be.ok;
                result.get.should.be.instanceOf(Object);
                result.get.should.have.property('host');
                result.get.host.should.equal('get.production.storage.net');

                result.post.should.be.ok;
                result.post.should.be.instanceOf(Object);
                result.post.should.have.property('host');
                result.post.host.should.equal('post.production.storage.net');
            });
        });
    });

    describe('mdToHtml', function () {
        var md = fs.readFileSync('README.md', { encoding: 'utf-8' }),
            html = util.mdToHtml(md);

        html.should.be.ok;
        html.should.be.instanceOf(String);
    });

    describe('parseGhUrl', function () {
        it('should parse github url', function () {
            var p = util.parseGhUrl('https://github.com/bem-site/bem-data-source/blob/master/README.md');
            p.should.be.ok;
            p.should.be.instanceOf(Object);
            p.should.have.property('type');
            p.should.have.property('user');
            p.should.have.property('repo');
            p.should.have.property('ref');
            p.should.have.property('path');

            p.type.should.equal('public');
            p.user.should.equal('bem-site');
            p.repo.should.equal('bem-data-source');
            p.ref.should.equal('master');
            p.path.should.equal('README.md');
        });

        it ('should throw error on non-gihub url', function () {
            var url = 'https://www.yandex.ru/';
            (function () { return util.parseGhUrl(url); }).should.throw('Invalid format of url ' + url);
        });
    });

    describe('separateArrayOnChunks', function () {
        var arr;

        before(function () {
           arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        });

        it('should separate array on chunks', function () {
            var a = util.separateArrayOnChunks(arr, 3);
            a.should.be.ok;
            a.should.be.instanceOf(Array);
            a.should.have.length(4);
            for (var i = 0; i < 4; i++) {
                a[i].should.be.instanceOf(Array);
                a[i].should.have.length(i < 3 ? 3 : 1);
            }
        });
    });
});
