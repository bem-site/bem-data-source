var util = require('util'),

    assert = require('assert'),
    EventEmitter = require('events').EventEmitter,
    Client = require('cocaine').Client,

    OPTIONS = {
        NAME_SPACE: 'defaultnamespace',
        HOST: 'apefront.tst.ape.yandex.net',
        PORT: 10053
    };

function __uid() {
    return (Math.random() * 0x100000000).toString(36);
}

function Storage(options) {
    options = options || {};
    this._namespace = options.namespace || OPTIONS.NAME_SPACE;
    this._locator = options.locator || util.format('%s:%s', OPTIONS.HOST, OPTIONS.PORT);

    this._connecting = false;
    this.connected = false;

    this._debug = options.debug || false;
    this._app = process.argv.app || 'defaultapp';
    this._logger = null;

    this._client = new Client(this._locator);

    this._storage = this._client.Service('storage');

    this._connecting = false;
}

util.inherits(Storage, EventEmitter);

Storage.prototype._log = function () {
    if (this._debug) {
        this._logger.debug.apply(this._logger, arguments);
    }
};

/**
 * Connect to storage
 */
Storage.prototype.connect = function () {
    var _this = this;

    assert(!this._connecting && !this._connected, '!this._connecting && !this._connected');

    this._connecting = true;

    if (this._debug) {
        _connectLogger();
    } else {
        _connectStorage();
    }

    function _connectLogger() {
        _this._logger = _this._client.Logger(_this._app);
        _this._logger.connect();
        _this._logger.once('connect', function () {
            _this._logger._verbosity = 4;
            _connectStorage();
        });
    }

    function _connectStorage() {
        var id = __uid();
        _this._log('[%s] connecting to storage service', id);
        _this._storage.connect();
        _this._storage.once('connect', function () {
            assert(_this._connecting);
            _this._log('[%s] connected to storage', id);
            _this._connecting = false;
            _this.connected = true;
            _this.emit('connect');
        });
    }
};

/**
 * Find keys by tags
 * @param {Array} tags - array of tags
 * @param {Function} cb - callback function
 */
Storage.prototype.find = function (tags, cb) {
    tags = tags || [];
    this._storage.find(this._namespace, tags, function (err, result) {
        cb(err, result);
    });
};

/**
 * Reads record for key
 * @param {String} key - record key
 * @param {Function} cb - callback function
 */
Storage.prototype.read = function (key, cb) {
    this._storage.read(this._namespace, key, function (err, result) {
        cb(err, result);
    });
};

/**
 * Write record for key
 * @param {String} key - record key
 * @param {Object} value - record value
 * @param {Array} tags - array of tags
 * @param {Function} cb - callback function
 */
Storage.prototype.write = function (key, value, tags, cb) {
    tags = tags || [];
    this._storage.write(this._namespace, key, value, tags, function (err) {
        cb(err);
    });
};

/**
 * Remove record by key
 * @param {String} key - record key
 * @param {Function} cb - callback function
 */
Storage.prototype.remove = function (key, cb) {
    this._storage.remove(this._namespace, key, function (err, result) {
        cb(err, result);
    });
};

module.exports = Storage;
