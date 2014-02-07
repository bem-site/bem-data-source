/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),

    constants = require('../constants'),
    logger = require('../libs/logger')(module),
    u = require('../libs/util');

var MSG = {
    INFO: {
        START: '-- create output start --',
        END: '-- create output end --'
    }
};

module.exports = function(target) {
    logger.info(MSG.INFO.START);

    return u
        .createDirectory(path.join(constants.DIRECTORY.OUTPUT, target.sourceDir))
        .then(function() {
            return u.createDirectory(path.join(constants.DIRECTORY.OUTPUT, target.sourceDir, target.ref));
        })
        .then(function() {
            logger.info(MSG.INFO.END);
            return target;
        });
};