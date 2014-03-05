var config = require('nconf'),
    path = require('path');

config.argv({
        "v": {
          alias: 'verbose',
          describe: 'Logger level detail',
          demand: true,
          default: 'info'
        },
        "p": {
          alias: 'private',
          describe: 'Private flag for repository',
          demand: false
        },
        "u": {
          alias: 'user',
          describe: 'User or organization for repository',
          demand: false
        },
        "r": {
          alias: 'repository',
          describe: 'Name of repository',
          demand: false
        },
        "t": {
          alias: 'tag',
          describe: 'Name of tag for creation',
          demand: false
        },
        "b": {
          alias: 'branch',
          describe: 'Name of branch for creation',
          demand: false
        }
    })
    .env()
    .file({ file: path.join('config', 'config.json') });

config.add('credentials', { type: 'file', file: path.join('config', 'credentials.json') });

module.exports = config;
