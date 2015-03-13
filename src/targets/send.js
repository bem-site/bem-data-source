'use strict';

var inherit = require('inherit'),
    Base = require('./publish');

module.exports = inherit(Base, {
    __constructor: function (ref, options) {
        this.__base(ref, options);
        this._tasks = [
            new (require('../tasks/send-examples'))(this),
            new (require('../tasks/send-doc'))(this),
            new (require('../tasks/send-email'))(this)
        ];
    }
});
