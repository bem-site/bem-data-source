var path = require('path'),
    _ = require('lodash'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    SendEmail = require('../../../src/tasks/send-email');

describe('tasks/send-email', function () {
    var options = {
        storage: {
            namespace: 'my-site',
            get: { host: '127.0.0.1', port: 3000 },
            post: { host: '127.0.0.1', port: 3001 },
            auth: ''
        },
        mailer: {
            host: 'stub',
            port: 25,
            from: 'bem-data-source@legoprovider.dev.yandex-team.ru',
            to: ['bemer@yandex-team.ru']
        }
    };

    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
    });

    describe('without e-mail options', function () {
        var t, sd;

        before(function () {
            t = new Target('v1.0.0', _.omit(options, 'mailer'));
            sd = new SendEmail(t);
        });

        it('success', function (done) {
            sd.run()
                .then(function () {
                    done();
                })
                .done();
        });
    });

    describe('with e-mail options', function () {
        var t, sd;

        before(function () {
            t = new Target('v1.0.0', options);
            sd = new SendEmail(t);
        });

        it('success', function (done) {
            sd.run()
                .then(function () {
                    done();
                })
                .done();
        });
    });

    describe('invalid mail options or if e-mail server is in maintenance', function () {
        var target, sendEmail;

        before(function () {
            var opts = _.extend({}, options, { mailer: {
                host: 'invalid host',
                port: 25
            } });
            target = new Target('v1.0.0', opts);
            sendEmail = new SendEmail(target);
        });

        it('should allow fail case', function () {
            return sendEmail.run()
                .then(function (result) {
                    result.should.equal(true);
                });
        });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
