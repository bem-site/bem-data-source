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

module.exports = {

    run: function(targets) {
        logger.info('step7: - finalize start');

        var def = q.defer(),
            _path = path.resolve('config', 'repositories') + '.json',
            repoConfig = config.get('repoConfig'),
            o = {
                user: repoConfig.user || repoConfig.org,
                repo: repoConfig.repo,
                branch: repoConfig.ref,
                message: util.format('Update repositories configuration file for build: %s', (new Date()).toString()),
                path: constants.FILE.REPOSITORIES,
                private: repoConfig.private
            };

        api
            .getContent(repoConfig, constants.FILE.REPOSITORIES)
            .then(
                function(file) {
                    return (config.get('localMode')) ?
                        createOrUpdateFromLocal(targets, _path, o, file) :
                        updateFromRemote(targets, _path, o, file);
                },
                function(error) {
                    if(error.code === 404) {
                        return createOrUpdateFromLocal(targets, _path, o, null);
                    }else {
                        def.reject(error);
                    }
                }
            )
            .then(function() {
                logger.info('step7: - finalize end');
                def.resolve(targets);
            });

        return def.promise;
    }
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
var createOrUpdateFromLocal = function(targets, _path, o, file) {
    var promise = function(config) {
        return file ?
            api.updateFile(_.extend({
                content: (new Buffer(config)).toString('base64'),
                sha: file.sha
            }, o)) :
            api.createFile(_.extend({
                content: (new Buffer(config)).toString('base64')
            }, o));
    };

    return q_io.read(_path)
        .then(function(content) {
            var updatedConfig =  JSON.stringify(markAsMade(targets, content), null, 4);
            return q.all([
                q_io.write(_path, updatedConfig, { charset: 'utf8' })//,
                //promise(updatedConfig)
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
var updateFromRemote = function(targets, _path, o, file) {
    var updatedConfig = JSON.stringify(markAsMade(targets, new Buffer(file.content, 'base64')), null, 4);
    return q.all([
        q_io.write(_path, updatedConfig, { charset: 'utf8' }),
        api.updateFile(
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

        Object.getOwnPropertyNames(sources).forEach(function(privacy) {
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
