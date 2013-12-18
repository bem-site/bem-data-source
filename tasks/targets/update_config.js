/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../../config/config'),
    git = require('../../libs/git');

var execute = function(targets) {
    LOGGER.info('step7: - finalize start');

    var def = Q.defer(),
        path = PATH.resolve('config', 'repositories') + '.json',
        dataRepository = config.get("dataRepository"),
        localMode = config.get('localMode'),
        o = {
            user: dataRepository.user,
            repo: dataRepository.name,
            branch: 'master',
            message: UTIL.format('Build: %s', (new Date()).toString()),
            path: config.get('repositoriesFileName')
        };

    git.getContent({
            user: dataRepository.user,
            repo: dataRepository.name,
            ref: 'master'
        }, config.get('repositoriesFileName')
    )
    .then(
        function(file) {
            //XXX development hack
            if(localMode && localMode === 'true') {
                return updateFromLocal(targets, path, o, file);
            }else {
                return updateFromRemote(targets, path, o, file);
            }
        },
        function(error) {
            if(error.code === 404) {
                return createFromLocal(targets, path, o);
            }else {
                def.reject(error);
            }
        }
    )
    .then(function() {
        LOGGER.info('step7: - finalize end');
        def.resolve(targets);
    });

    return def.promise;
};

var createFromLocal = function(targets, path, o) {
    return U.readFile(path)
        .then(function(content) {
            var updatedConfig =  JSON.stringify(markAsMade(targets, content), null, 4);
            return Q.all([
                U.writeFile(path, updatedConfig),
                git.createFile(
                    _.extend({
                        content: (new Buffer(updatedConfig)).toString('base64')}, o)
                )
            ]);
        });
};

/**
 * Config update based on local repositories file
 * need for development mode and first application lunch
 * @param targets - {Array} array of completed targets
 * @param path - {String} path to repositories file on file system
 * @param o - {Object} configuration object for github API
 * @param file - {String} base64 encoded content of repositories file
 * @returns {*|then}
 */
var updateFromLocal = function(targets, path, o, file) {
    return U.readFile(path)
        .then(function(content) {
            var updatedConfig =  JSON.stringify(markAsMade(targets, content), null, 4);
            return Q.all([
                U.writeFile(path, updatedConfig),
                git.updateFile(
                    _.extend({
                        content: (new Buffer(updatedConfig)).toString('base64'),
                        sha: file.sha
                    }, o)
                )
            ]);
        });
};

/**
 * Config update based on remote repositories file
 * @param targets - {Array} array of completed targets
 * @param path - {String} path to repositories file on file system
 * @param o - {Object} configuration object for github API
 * @param file - {String} base64 encoded content of repositories file
 * @returns {exports.all|*|exports.defaults.styles.all|Iterator.all|all|async.all}
 */
var updateFromRemote = function(targets, path, o, file) {
    var updatedConfig = JSON.stringify(markAsMade(targets, new Buffer(file.content, 'base64')), null, 4);
    return Q.all([
        U.writeFile(path, updatedConfig),
        git.updateFile(
            _.extend({
                content: (new Buffer(updatedConfig)).toString('base64'),
                sha: file.sha
            }, o)
        )
    ]);
};

/**
 * Overwrites configuration file and add tags and branches of completed targets to exclude
 * @param targets - {Array} array of completed targets
 * @param content - {String} json content of config.json file
 * @returns {defer.promise|*}
 */
var markAsMade = function(targets, content) {

    try {
        var sources = JSON.parse(content);

        if(targets.length === 0) {
            return sources;
        }

        ['private', 'public'].forEach(function(privacy) {
            sources[privacy].forEach(function(owner) {
                owner.repositories.forEach(
                    function(repo) {
                        repo.tags = repo.tags || [];
                        repo.branches = repo.branches || [];
                        repo.tags.exclude = repo.tags.exclude || [];
                        repo.branches.exclude = repo.branches.exclude || [];

                        targets
                            .filter(
                                function(target) {
                                    return target.source.name === repo.name;
                                }
                            ).forEach(
                                function(target) {
                                    repo[target.type].exclude.push(target.ref);
                                }
                            );

                        repo.tags.exclude = _.uniq(repo.tags.exclude, true);
                        repo.branches.exclude = _.uniq(repo.branches.exclude, true);
                    }
                );
            });
        });

        return sources;

    }catch(error) {
        return content;
    }
};

module.exports = execute;
