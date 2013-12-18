var config = require('nconf');
var path = require('path');

config.argv({
        "v": {
          alias: 'verbose',
          describe: 'Logger level detail',
          demand: true,
          default: 'info'
        }
    })
    .env()
    .file({ file: path.join(__dirname, 'config.json') });

config.file('repositories', path.join(__dirname, 'repositories.json'));

module.exports = config;
