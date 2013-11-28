var FS = require('fs'),
    CP = require('child_process'),
    UTIL = require('util'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    QIO_FS = BEM.require('q-fs'),
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
