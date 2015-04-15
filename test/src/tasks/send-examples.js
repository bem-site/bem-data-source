var path = require('path'),
    _ = require('lodash'),
    vow = require('vow'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../../src/constants'),
    storage = require('../../../src/storage'),
    Target = require('../../../src/targets/publish'),
    SendExamples = require('../../../src/tasks/send-examples');

describe('tasks/send-examples', function () {
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

    it('should not send-examples with dry mode option', function (done) {
        var t = new Target('v1.0.0', _.extend({}, options, { isDryRun: true })),
            se = new SendExamples(t);
        vow.resolve()
            .then(function () { return se.run(); })
            .then(function () { done(); });
    });

    it('should not send-examples with docs only option', function (done) {
        var t = new Target('v1.0.0', _.extend({}, options, { isDocsOnly: true })),
            se = new SendExamples(t);
        vow.resolve()
            .then(function () { return se.run(); })
            .then(function () { done(); });
    });

    it('should send-examples', function (done) {
        var t = new Target('v1.0.0', options),
            se = new SendExamples(t);
        vow.resolve()
            .then(function () { return se.run(); })
            .then(function () { done(); });
    });

    after(function () {
        emulator.stop();
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
