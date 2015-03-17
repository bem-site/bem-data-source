'use strict';

var util = require('util'),
    path = require('path'),

    inherit = require('inherit'),

    config = require('../config'),
    Mailer = require('../mailer'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function () {
        var o = this._target.getOptions()['mailer'] || config.get('mailer'),
            mailer,
            subject;

        if (!o) {
            return;
        }

        mailer = new Mailer(o);
        subject = util.format('bem-data-source: success publish library [%s] version [%s]',
            this._target.sourceName, this._target.ref);

        return mailer.send({
            from: o.from,
            to: o.to,
            subject: subject,
            text: '',
            attachments: [
                {
                    filename: 'data.json',
                    path: path.join(this._target.getContentPath(), 'data.json')
                }
            ]
        });
    }
});
