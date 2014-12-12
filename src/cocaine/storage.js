var util = require('util'),

    assert = require('assert'),
    EventEmitter = require('events').EventEmitter,

    argv = require('optimist').argv,

    Client = require('cocaine').Client;

function __uid(){
    return (Math.random()*0x100000000).toString(36);
}

function Storage(options) {

    options = options || {};
    this._namespace = options.namespace || 'defaultnamespace';
    this._locator = options.locator || 'apefront.tst.ape.yandex.net:10053';

    this._debug = options.debug || false;
    this._app = argv.app || 'defaultapp';
    this._logger = null;

    this._client = new Client(this._locator);

    this._storage = this._client.Service('storage');

    this._connecting = false;
    this.connected = false;
}

util.inherits(Storage, EventEmitter);

Storage.prototype._log = function(){
    if(this._debug){
        this._logger.debug.apply(this._logger, arguments);
    }
};

Storage.prototype.connect = function(){
    var self = this;

    assert(!this._connecting && !this.connected, "!this._connecting && !this.connected");

    this._connecting = true;
    this._debug ? _connectLogger() : _connectStorage();

    function _connectLogger(){
        self._logger = self._client.Logger(self._app);
        self._logger.connect();
        self._logger.once('connect', function(){
            self._logger._verbosity = 4;
            _connectStorage();
        });
    }

    function _connectStorage(){
        var id = __uid();
        self._log('[%s] connecting to storage service', id);
        self._storage.connect();
        self._storage.once('connect', function(){
            assert(self._connecting);
            self._log('[%s] connected to storage', id);
            self._connecting = false;
            self.connected = true;
            self.emit('connect');
        });
    }
};

Storage.prototype.write = function (key, value, cb) {
    assert(this.connected, 'this.connected');
    var id = __uid();

    var self = this;

    this._log('[%s] Storage.write("%s::%s", "%s")', id, this._namespace, key, value);

    this._storage.write(this._namespace, key, value, function(err){
        if(!err){
            self._log('[%s] write ok', id);
        } else {
            self._log('[%s] write failed: %s', id, err);
        }
        cb(err);
    });
};

Storage.prototype.read = function (key, cb) {
    assert(this.connected, 'this.connected');

    var id = __uid();
    var self = this;

    this._log('[%s] Storage.read("%s::%s")', id, this._namespace, key);
    this._storage.read(this._namespace, key, function(err, result){
        if(!err){
            self._log('[%s] read ok: "%s"', id, result);
        } else {
            self._log('[%s] read failed: %s', id, err);
        }
        cb(err, result);
    });
};


module.exports = Storage;
