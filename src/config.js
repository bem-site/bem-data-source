'use strict';

var path = require('path'),
    nconf = require('nconf'),
    envPrefix = 'BEM_DATA_SOURCE_',
    externalConfigPath = process.env.BEM_DATA_SOURCE_CONFIG_PATH;

nconf.env({
    separator: '__',
    // BEM_DATA_SOURCE_STORAGE__COMMON__AUTH="Basic XXXXXXXXXXX" →
    // { storage: { common: auth: 'Basic XXXXXXXXXXX } }
    transform: function(obj) {
        if (obj.key.indexOf(envPrefix) === 0) {
            obj.key = obj.key.replace(envPrefix, '').toLowerCase();
        }

        return obj;
    }
});

nconf.add('config', {
    type: 'file',
    file: path.resolve(__dirname, '..', 'config/public.json')
});

nconf.add('credentials', {
    type: 'file',
    file: path.resolve(__dirname, '..', 'config/private.json')
});

externalConfigPath && nconf.add('external', {
    type: 'file',
    file: externalConfigPath
});

module.exports = nconf;
