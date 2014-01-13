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
    config = require('../config/config'),
    git = require('../libs/git');

/**
 * Retrieves sources configuration throught github API
 * (with fallback to local configuration file)
 * and modify it for suitable github API calling
 * @returns {defer.promise|*}
 */
module.exports = function() {
    LOGGER.info('step1: - getSources start');

    var localMode = config.get('localMode'),
        repositoriesFileName = config.get('repositoriesFileName');

    return git.getContent(config.get('repoConfig'), repositoriesFileName)
        .then(
            function(file) {
                return (localMode && localMode === 'true') ? readLocalConfig() :
                    createSources(JSON.parse(new Buffer(file.content, 'base64')));
            },
            function(error) {
                if(error.code === 404) {
                    LOGGER.warn(UTIL.format('%s file was not found on github. Load local %s file', repositoriesFileName, repositoriesFileName));
                    return readLocalConfig();
                }
            }
        );
};

/**
 * Loads data from local repositories.json configuration file
 * Needs for local mode and for case when repositories.json file not existed yet
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
