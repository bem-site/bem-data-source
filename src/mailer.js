var util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),
    nm = require('nodemailer'),
    transport = require('nodemailer-smtp-transport'),

    config = require('./config'),
    logger = require('./logger'),
    mailer;

/**
 * Initialize mailer module
 */
exports.init = function () {
    mailer = new nm.createTransport(transport({
        host: config.get('mailer:host'),
        port: config.get('mailer:port')
    }));
};

/**
 * Email sending
 * @param {Object} options - e-mail options object
 * @returns {*}
 */
exports.send = function (options) {
    var base = { encoding: 'utf-8' };

    logger.info(util.format('send email //subject: %s  //body: %s', options.subject, options.text), module);

    var def = vow.defer();
    mailer.sendMail(_.extend({}, base, options), function (err) {
        err ? def.reject(err) : def.resolve();
    });

    return def.promise();
};
