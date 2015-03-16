var path = require('path'),
    vow = require('vow'),
    should = require('should'),
    emulator = require('mds-wrapper/mds-emulator.js'),
    constants = require('../../src/constants'),
    storage = require('../../src/storage'),
    Target = require('../../src/targets/publish');

describe('integration publish', function () {
    var options = {
        storage: {
            namespace: 'my-site',
            get: { host: '127.0.0.1', port: 3000 },
            post: { host: '127.0.0.1', port: 3001 },
            auth: ''
        },
        mailer: {
            host: 'outbound-relay.yandex.net',
            port: 25,
            from: 'test@bem-data-source.ru',
            to: [
                'bemer@yandex-team.ru'
            ]
        }
    };

    before(function () {
        emulator.start(options.storage.get.port, options.storage.post.port);
        process.chdir(path.resolve(__dirname, '../test-data'));
    });

    it('should execute publish task', function (done) {
        var t = new Target('v1.0.0', options);
        t.execute()
            .then(function () {
                done();
            })
            .fail(function (err) {
                done();
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../'));
        emulator.stop();
    });
});
