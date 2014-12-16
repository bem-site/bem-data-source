'use strict';

var path = require('path'),
    nconf = require('nconf');

/**
 * Application configuration module based on nconf library
 */
module.exports = (function () {
    nconf.env();

    nconf.add('config', {
        type: 'file',
        file: path.resolve(__dirname, '..', 'config/public.json')
    });

    nconf.add('credentials', {
        type: 'file',
        file: path.resolve(__dirname, '..', 'config/private.json')
    });

    return nconf;
})();
