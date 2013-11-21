var config = require('nconf');
var path = require('path');

config.argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json') });

config.add('credentials', { type: 'file', file: path.join(__dirname, 'sources.json') });

module.exports = config;