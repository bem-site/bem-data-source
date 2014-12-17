'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),

    config = require('../config'),
    mailer = require('../mailer');

module.exports = function (target) {
    var isEnable = config.get('mailer:enabled') || false;
    if (!isEnable) {
        return vow.resolve(target);
    }

    mailer.init();

    var subject = util.format('bem-data-source: success publish library [%s] version [%s]',
        target.getSourceName(), target.ref);

    return mailer.send({
        from: config.get('mailer:from'),
        to: config.get('mailer:to'),
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
