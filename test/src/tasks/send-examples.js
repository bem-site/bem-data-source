var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage'),
    Target = require('../../../src/targets/publish'),
    SendExamples = require('../../../src/tasks/send-examples');

describe('tasks/send-examples', function () {
    var t, se,
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
        se = new SendExamples(t);
    });

    it('should be send-examples', function (done) {
        vow.resolve()
            .then(function () {
                return se.run();
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
