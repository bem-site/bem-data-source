'use strict';

var util = require('util'),
    path = require('path'),

    inherit = require('inherit'),

    config = require('../config'),
    mailer = require('../mailer'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function () {
        var o = this._target.options['mailer'] || config.get('mailer');

        if (!o) {
            return;
        }
        mailer.init(o);

        var subject = util.format('bem-data-source: success publish library [%s] version [%s]',
            this._target.sourceName, this._target.ref);

        return mailer.send({
            from: o.from,
            to: o.to,
            subject: subject,
            text: '',
            attachments: [
                {
                    filename: 'data.json',
                    path: path.join(this._target.contentPath, 'data.json')
                }
            ]
        });
    }
});
