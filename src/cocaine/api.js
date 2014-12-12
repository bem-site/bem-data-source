var util = require('util'),
    vow = require('vow'),

    config = require('../config'),
    logger = require('../logger'),
    Storage = require('./storage'),

    storage;

exports.init = function() {
    logger.info('Initialize cocaine storage', module);
    storage = new Storage(config.get('cocaine:storage'));
    storage.connect();

    var def = vow.defer();
    storage.on('connect', function(err) {
        err ? def.reject(err) : def.resolve();
    });
    return def.promise();
};

exports.write = function(key, value) {
    if(!storage.connected) {
        logger.error('storage is not connected', module);
        return vow.reject();
    }

    logger.verbose(util.format('save to storage || key: %s', key), module);

    var def = vow.defer();
    storage.write(key, value, function(err) {
        err ? def.reject(err) : def.resolve();
    });
    return def.promise();
};

exports.read = function(key) {
    if(!storage.connected) {
        logger.error('storage is not connected', module);
        return vow.reject();
    }

    logger.verbose(util.format('read from storage || key: %s', key), module);

    var def = vow.defer();
    storage.read(key, function(err, value) {
        err ? def.reject(err) : def.resolve(value);
    });
    return def.promise();
};
