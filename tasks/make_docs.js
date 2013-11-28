var UTIL = require('util'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util');

var execute = function(target) {
    var def = Q.defer();
    def.resolve();
    return def.promise;
};

module.exports = execute;
