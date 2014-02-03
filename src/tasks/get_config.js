/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../../config/config'),
    git = require('../../libs/git');

module.exports = {

    /**
     * Retrieves sources configuration throught github API
     * (with fallback to local configuration file)
     * and modify it for suitable github API calling
     * @returns {defer.promise|*}
     */
    run: function() {
        LOGGER.info('step1: - getSources start');

        var localMode = config.get('localMode');

        if(localMode && localMode === 'true') {
            LOGGER.debug('Local mode flag is set to true. Repositories list will be loaded from local filesystem');
            return readLocalConfig();
        } else {
            LOGGER.debug('Local mode flag is set to false. Repositories list will be loaded from remote github repository');
            return readRemoteConfig();
        }
    }
};

/**
 * Loads data from remote repositories.json configuration file
 * @returns {*}
 */
var readRemoteConfig = function() {
    return git.getContent(config.get('repoConfig'), config.get('repositoriesFileName'))
        .then(
            function(file) {
                return createSources(JSON.parse(new Buffer(file.content, 'base64')));
            },
            function(error) {
                if(error.code === 404) {
                    LOGGER.warn('Configuration file was not found on github. Load local configuration file');
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
    return U.readFile(PATH.resolve('config', 'repositories') + '.json')
        .then(function(content) {
            return createSources(JSON.parse(content));
        });
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
    Object.getOwnPropertyNames(sources).forEach(function(key) {
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
