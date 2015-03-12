'use strict';

var inherit = require('inherit'),
    Base = require('./publish');

module.exports = inherit(Base, {
    __constructor: function (ref, options) {
        this.__base(ref, options);
        this._tasks = [
            require('../tasks/process-examples'),
            require('../tasks/send-doc'),
            require('../tasks/send-email')
        ];
    }
});
