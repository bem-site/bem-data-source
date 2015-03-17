var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    nm = require('nodemailer'),
    transport = require('nodemailer-smtp-transport'),
    Logger = require('./logger');

module.exports = inherit({
    _mailer: undefined,
    _logger: undefined,

    /**
     * Initialize mailer module
     */
    __constructor: function (options) {
        this._logger = new Logger(module, 'debug');
        var o = _.extend({}, this.__self.baseOptions, options);
        this._mailer = new nm.createTransport(transport({
            host: o.host,
            port: o.port
        }));
    },

    /**
     * Email sending
     * @param {Object} options - e-mail options object
     * @returns {*}
     */
    send: function (options) {
        var base = { encoding: 'utf-8' };

        this._logger.info('send email //subject: %s  //body: %s', options.subject, options.text);

        /*
        if (!this._mailer) {
            this._logger.warn('Mailer was not initialized');
            return vow.resolve();
        }
        */

        var def = vow.defer();
        this._mailer.sendMail(_.extend({}, base, options), function (err) {
            err ? def.reject(err) : def.resolve();
        });

        return def.promise();
    }
}, {
    baseOptions: { encoding: 'utf-8' }
});
