/* global toString: false */
'use strict';

//bem tools modules
var BEM = require('bem'),
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
var execute = function() {
    LOGGER.info('step1: - getSources start');

    var dataRepository = config.get("dataRepository"),
        path = PATH.resolve('config', 'repositories') + '.json',
        localMode = config.get('localMode');

    return git.getContent({
                user: dataRepository.user,
                repo: dataRepository.name,
                ref: 'master'
            }, config.get('repositoriesFileName')
        )
        .then(
            function(file) {
                //XXX development hack
                if(localMode && localMode === 'true') {
                    return U.readFile(path)
                        .then(function(content) {
                            return createSources(JSON.parse(content));
                        });
                }else {
                    return createSources(JSON.parse(new Buffer(file.content, 'base64')));
                }
            },
            function(error) {
                if(error.code === 404) {
                    return U.readFile(path)
                        .then(function(content) {
                            return createSources(JSON.parse(content));
                        });
                }
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

module.exports = execute;
