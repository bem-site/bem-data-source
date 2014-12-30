'use strict';

var storage = require('../cocaine/api'),

    TargetInit  = function (options) {
        return this.init(options);
    };

TargetInit.prototype = {
    options: undefined,

    /**
     * Initialize target object
     * @param {Object} options - advanced options
     * @returns {TargetInit}
     */
    init: function (options) {
        this.options = options;
        return this;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        return storage.init(this.options);
    }
};

module.exports = TargetInit;
