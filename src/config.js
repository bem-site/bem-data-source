var config = require('nconf'),
    path = require('path');

config
    .env()
    .file({ file: path.join('config', 'config.json') });

config.add('credentials', { type: 'file', file: path.join('config', 'credentials.json') });

module.exports = config;
