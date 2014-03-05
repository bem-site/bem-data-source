/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),

    config = require('../config'),
    libs = require('../libs'),
    logger = libs.logger(module);

var MSG = {
    INFO: {
        START: '-- collect results start --',
        END: '-- collect results end --'
    }
};

module.exports = {

    run: function() {
        logger.info(MSG.INFO.START);

        return libs.cmd.gitAdd()
            .then(function() {
                return libs.cmd.gitCommit(util.format('Update data: %s', (new Date()).toString()));
            })
            .then(function() {
                return libs.cmd.gitPush(config.get('dataConfig:ref'));
            })
            .then(function() {
                logger.info(MSG.INFO.END);
            });

    }
};


