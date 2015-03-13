'use strict';

var util = require('util'),
    path = require('path'),

    inherit = require('inherit'),

    config = require('../config'),
    mailer = require('../mailer'),
    Base = require('./base');

module.exports = inherit(Base, {
    _mailer: undefined,
    _options: undefined,

    __constructor: function (t) {
        this.__base(t);
        this._options = this._target.options['mailer'] || config.get('mailer');

        if (!this._options) {
            return;
        }
        this._mailer.init(this._options);
    },

    run: function () {
        var subject = util.format('bem-data-source: success publish library [%s] version [%s]',
            this._target.sourceName, this._target.ref);

        return mailer.send({
            from: this._options.from,
            to: this._options.to,
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
