var vow = require('vow'),

    config = require('../config'),
    logger = require('../logger'),
    Storage = require('./storage'),

    ERROR_CODE_NOT_FOUND = 2,

    storage;

/**
 * Initialize cocaine storage
 * @returns {*}
 */
exports.init = function (options) {
    logger.info('Initialize cocaine storage', module);
    if (storage && storage.connected) {
        return vow.resolve();
    }

    var o = config.get('storage:cocaine');

    if (options && options.debug) {
        o.debug = options.debug;
    }

    if (options && options.namespace) {
        o.namespace = options.namespace;
    }

    storage = new Storage(o);

    storage.connect();

    var def = vow.defer();
    storage.on('connect', function (err) {
        err ? def.reject(err) : def.resolve();
    });
    return def.promise();
};

exports.find = function (tags) {
    if (!storage.connected) {
        return vow.reject();
    }

    var def = vow.defer();
    storage.find(tags, function (err, value) {
        if (!err) {
            def.resolve(value);
        }else if (err.code === ERROR_CODE_NOT_FOUND) {
            def.resolve([]);
        }else {
            def.reject(err);
        }
    });

    return def.promise();
};

/**
 * Reads data from storage by key
 * @param {String} key - record key
 * @returns {*}
 */
exports.read = function (key) {
    if (!storage.connected) {
        return vow.reject();
    }

    var def = vow.defer();
    storage.read(key, function (err, value) {
        if (!err) {
            def.resolve(value);
        }else if (err.code === ERROR_CODE_NOT_FOUND) {
            def.resolve(null);
        }else {
            def.reject(err);
        }
    });

    return def.promise();
};

/**
 * Writes data to storage
 * @param {String} key - record key
 * @param {Object} value - record value
 * @param {Array} tags - array of tags
 * @returns {*}
 */
exports.write = function (key, value, tags) {
    if (!storage.connected) {
        return vow.reject();
    }

    var def = vow.defer();
    storage.write(key, value, tags, function (err) {
        err ? def.reject(err) : def.resolve();
    });

    return def.promise();
};

/**
 * Removes data from storage
 * @param {String} key - record key
 * @returns {*}
 */
exports.remove = function (key) {
    if (!storage.connected) {
        return vow.reject();
    }

    var def = vow.defer();
    storage.remove(key, function (err) {
        err ? def.reject(err) : def.resolve();
    });

    return def.promise();
};
