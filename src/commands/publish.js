'use strict';

var path = require('path'),
    util = require('util'),

    utility = require('../util'),
    logger = require('../logger'),
    constants = require('../constants');

module.exports = function () {
    return this
        .title('publish command')
        .helpful()
        .opt()
            .name('version').title('Version of repository (tag or branch)')
            .short('v').long('version')
        .end()
        .act(function (opts) {
            logger.info('PUBLISH:', module);
            logger.info(util.format('repository version %s', opts.version), module);
        });
};
