var config = require('nconf'),
    path = require('path');

config.argv({
        "v": {
          alias: 'verbose',
          describe: 'Logger level detail',
          demand: true,
          default: 'info'
        }
    })
    .env()
    .file({ file: path.join('config', 'config.json') });

config.add('credentials', { type: 'file', file: path.join('config', 'credentials.json') });

module.exports = config;
