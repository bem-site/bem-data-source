'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),

    config = require('../config'),
    mailer = require('../mailer');

module.exports = function (target) {
    var emailOptions = target.options['mailer'] || config.get('mailer'),
        isEnable = emailOptions || false;

    if (!isEnable) {
        return vow.resolve(target);
    }

    mailer.init(emailOptions);

    var subject = util.format('bem-data-source: success publish library [%s] version [%s]',
        target.getSourceName(), target.ref);

    return mailer.send({
        from: emailOptions.from,
        to: emailOptions.to,
        subject: subject,
        text: '',
        attachments: [
            {
                filename: 'data.json',
                path: path.join(target.getOutputPath(), 'data.json')
            }
        ]
    }).then(function () {
        return vow.resolve(target);
    });
};
