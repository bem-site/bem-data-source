var path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    TargetRemove = require('../../../src/targets/remove'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage');

describe('targets remove', function () {
    it('should be initialized', function () {
        new TargetRemove('test-library', 'v1.0.0', {});
    });

    describe('target remove methods', function () {
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
            var docsPath = path.resolve(__dirname, '../../test-data', 'data.json'),
                registryPath = path.resolve(__dirname, '../../test-registry', 'data.json');
            storage.get(options.storage).write('bem-components/v2/data.json', fs.readFileSync(docsPath), null);
            storage.get(options.storage).write(constants.ROOT, fs.readFileSync(registryPath), null);
        });

        after(function () {
            process.chdir(path.resolve(__dirname, '../../../'));
            emulator.stop();
        });

        it ('should work in dry mode', function (done) {
            var o = _.extend({}, options, { isDryMode: true }),
                t = new TargetRemove('test-library', 'v1.0.0', o);
            t.execute().then(function () {
                done();
            });
        });

        it ('should show warn and fail for invalid library name', function (done) {
            var t = new TargetRemove('invalid-library', 'v1.0.0', options);
            t.execute().fail(function (error) {
                error.should.be.ok;
                done();
            });
        });

        it ('should show warn and do nothing for invalid library version', function (done) {
            var t = new TargetRemove('bem-components', 'v1.0.0', options);
            t.execute().fail(function (error) {
                error.should.be.ok;
                done();
            });
        });

        it ('should remove library from storage', function (done) {
            var t = new TargetRemove('bem-components', 'v2', options);
            t.execute().then(function () {
                done();
            });
        });
    });
});
