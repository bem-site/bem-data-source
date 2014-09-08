'use strict';

var path = require('path'),
    nconf = require('nconf');

/**
 * Application configuration module based on nconf library
 */
module.exports = (function () {
    nconf
        .env()
        .file({ file: path.join(path.join(process.cwd(), 'config'), 'config.json') });

    nconf.add('credentials', {
        type: 'file',
        file: path.join(path.join(process.cwd(), 'config'), 'credentials.json')
    });

    return nconf;
})();
