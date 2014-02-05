/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),
    _ = require('lodash'),

    logger = require('../libs/logger')(module);

var GITHUB = {
    INNER: 'github.yandex-team.ru',
    OUTER: 'github.com'
};

var MSG = {
    INFO: {
        START: '-- get reposittories start --',
        END: '-- get reposittories end --'
    }
};

module.exports = {

    /**
     * Retrieves information about git repositories by their names
     * @param sources - {Array} of objects with fields:
     * - user {String} name of user or organization
     * - isPrivate {Boolean} indicate if repository from private github
     * - name - {String} name of repository
     * - targetDir - {String} target directory
     * - docDirs - {Array} array of string path where docs are
     * - type - {String} type of repository. Different engines should be used for different types
     * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
     * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
     * @returns {defer.promise|*}
     */
    run: function(sources) {
        logger.info(MSG.INFO.START);

        sources = sources.map(function(source) {

            var host = source.isPrivate ? GITHUB.INNER : GITHUB.OUTER,
                gitUrl = util.format('git://%s/%s/%s.git', host , source.user, source.name);

            logger.debug('get repository with name %s and url %s', source.name, gitUrl);
            return _.extend({ url: gitUrl }, source);
        });

        logger.info(MSG.INFO.END);
        return sources;
    }
};