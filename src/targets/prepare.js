'use strict';

var inherit = require('inherit'),
    Base = require('./publish');

module.exports = inherit(Base, {
    __constructor: function (ref, options) {
        this.__base(ref, options);
        this._tasks = [
            require('../tasks/collect-sets'),
            require('../tasks/remove-temp'),
            require('../tasks/create-temp'),
            require('../tasks/copy-to-temp')
        ];
    }
});
