var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage'),
    Target = require('../../../src/targets/publish'),
    SendDoc = require('../../../src/tasks/send-doc');

describe('tasks/send-doc', function () {
    var t, sd,
        options = {
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
        t = new Target('v1.0.0', options);
        sd = new SendDoc(t);
    });

    it('should be send-doc with empty registry', function (done) {
        vow.resolve()
            .then(function () {
                return sd.run();
            })
            .then(function () {
                done();
            });
    });

    it('should be send-doc with non-empty registry', function (done) {
        vow.resolve()
            .then(function () {
                return sd.run();
            })
            .then(function () {
                done();
            });
    });

    after(function () {
        emulator.stop();
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
