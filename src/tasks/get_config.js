/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    constants = require('../constants'),
    logger = require('../libs/logger')(module),
    api = require('../libs/api');

var MSG = {
    ERR: {
        CONF_NOT_FOUND: 'Configuration file was not found on local filesystem'
    },
    WARN: {
        CONF_NOT_FOUND: 'Configuration file was not found on github. Load local configuration file'
    },
    DEBUG: {
        LOCAL_TRUE: 'Local mode flag is set to true. Repositories list will be loaded from local filesystem',
        LOCAL_FALSE: 'Local mode flag is set to false. Repositories list will be loaded from remote github repository'
    }
};

module.exports = {

    /**
     * Retrieves sources configuration throught github API
     * (with fallback to local configuration file)
     * and modify it for suitable github API calling
     * @returns {defer.promise|*}
     */
    run: function() {
        logger.info('-- get configs start --');

        var localMode = config.get('localMode');

        if(localMode && localMode === 'true') {
            logger.debug(MSG.DEBUG.LOCAL_TRUE);
            return readLocalConfig();
        } else {
            logger.debug(MSG.DEBUG.LOCAL_FALSE);
            return readRemoteConfig();
        }
    }
};

/**
 * Loads data from remote repositories.json configuration file
 * @returns {*}
 */
var readRemoteConfig = function() {
    return api
        .getContent(config.get('repoConfig'), constants.FILE.REPOSITORIES)
        .then(
            function(file) {
                return createSources(JSON.parse(new Buffer(file.content, 'base64')));
            },
            function(error) {
                if(error.code === 404) {
                    logger.warn(MSG.WARN.CONF_NOT_FOUND);
                    return readLocalConfig();
                }
            }
        );
};

/**
 * Loads data from local repositories.json configuration file
 * Needs for local mode or for case when repositories.json file not existed yet
 * @returns {*}
 */
var readLocalConfig = function() {
    return q_io.read(path.resolve('config', 'repositories') + '.json')
        .then(
            function(content) {
                return createSources(JSON.parse(content));
            },
            function() {
                logger.error(MSG.ERR.CONF_NOT_FOUND);
            }
        );
};

/**
 * Make plane source structure with field additions:
 * - isPrivate - {Boolean} flag which indicates privacy level of repository
 * - user - {String} user or organization
 * @param sources - object from configuration json files
 * @returns {Array} - array with sources for processing on next steps
 */
var createSources = function(sources) {
    var result = [];
    _.keys(sources).forEach(function(key) {
        sources[key].forEach(function(source) {
            var owner = source.org || source.user,
                repositories = source.repositories;

            if(owner && repositories) {
                repositories.forEach(function(repository) {
                    result.push(_.extend(repository, {
                        user: owner,
                        isPrivate: key === 'private'
                    }));
                });
            }
        });
    });

    return result;
};
