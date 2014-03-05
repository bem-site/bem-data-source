/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),

    constants = require('../constants'),
    libs = require('../libs'),
    logger = libs.logger(module);

var MSG = {
    INFO: {
        START: '-- create output start --',
        END: '-- create output end --'
    }
};

module.exports = function(target) {
    logger.info(MSG.INFO.START);

    return libs.util
        .createDirectory(path.join(constants.DIRECTORY.OUTPUT, target.sourceDir))
        .then(function() {
            return libs.util.createDirectory(path.join(constants.DIRECTORY.OUTPUT, target.sourceDir, target.ref));
        })
        .then(function() {
            logger.info(MSG.INFO.END);
            return target;
        });
};