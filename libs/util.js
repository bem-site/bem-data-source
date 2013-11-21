var BEM = require('bem'),
    FS = require('fs'),
    CP = require('child_process'),
    Q = BEM.require('q'),
    QIOFS = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('../config/config');

exports.createContentDirectory = function() {
    return QIOFS
        .makeDirectory(config.get('contentDirectory'))
        .then(function() {
            LOGGER.info(config.get("messages")["contentDirectory"]["created"]);
        })
        .fail(function(err) {
            if(err.code == 'EEXIST')
                LOGGER.warn(config.get("messages")["contentDirectory"]["exist"])
        });
};
