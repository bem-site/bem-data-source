var FS = require('fs'),
    CP = require('child_process'),
    UTIL = require('util'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    QIO_FS = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('../config/config');

exports.createContentDirectory = function() {
    return QIO_FS
        .makeDirectory(config.get('contentDirectory'))
        .then(function() {
            LOGGER.info('Content directory has been created');
        })
        .fail(function(err) {
            if(err.code == 'EEXIST')
                LOGGER.warn('Content directory already exist')
        });
};

exports.sortTags = function(a, b) {
    var re = /^v?(\d+)\.(\d+)\.(\d+)$/;
    a = a.replace(re, "$1$2$3");
    b = b.replace(re, "$1$2$3");
    return a - b;
};

exports.spawn = function(cmd, args, options) {
    var spawn = require('child_process').spawn,
        cp = spawn(cmd, args, options),
        def = Q.defer(),
        output = '';

    cp.stdout.on('data', function (data) {
        output += data;
    });

    cp.stderr.on('data', function (data) {
        output += data;
    });

    cp.on('close', function (code) {
        if (code === 0) {
            return def.resolve(code);
        }
        def.reject(new Error(UTIL.format('%s failed with code %s and reason %s', cmd, code, output)));
    });

    return def.promise;
};
