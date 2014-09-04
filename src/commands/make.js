'use strict';

var util = require('util'),
    path =require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),

    config = require('../config'),
    logger = require('../logger'),
    api = require('../gh-api'),
    commander = require('../commander'),
    utility = require('../util'),
    Target = require('../target');

/**
 * At first creates content repository
 * Check if output directory is already exists
 * If yes return
 * Else clone remote github destination repository content in this output folder
 * @returns {*}
 */
function init() {
    return vowFs.makeDir(constants.DIRECTORY.CONTENT).then(function() {
        return vowFs.exists(constants.DIRECTORY.OUTPUT).then(function(exists) {
            if(exists) {
                return;
            }
            return utility.getSSHUrl(config.get('dataConfig'))
                .then(function(url) {
                    logger.info('Start clone remote target data repository. Please wait ...');
                    return commander.gitClone(url, constants.DIRECTORY.OUTPUT);
                })
                .then(function() {
                    logger.info('Remote target data repository has been cloned successfully');
                });
        });
    });
}

/**
 * Generates ssh url of repository
 * @param source - {Object} object with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - user {String} name of user or organization
 * - tag - {String} name of tag
 * - branch - {String} name of branch
 * @returns {defer.promise|*}
 */
function retrieveSshUrl(source) {
    var url = util.format('git://%s/%s/%s.git',
        source.isPrivate ? constants.GITHUB.PRIVATE : constants.GITHUB.PUBLIC, source.user, source.name);

    logger.debug('get repository with name %s and url %s', source.name, url);

    source.url = url;
    return source;
}

/**
 * Retrieves information about repository branches and filter them according to config
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {String} tag name
 * - branches - {String} branch name
 * - url - {String} git url of repository
 * @param conf - {Object} with fields:
 * - field - {String} name of reference
 * - apiFunction - {Function} api function to retrieve reference information
 * @returns {defer.promise|*}
 */
function verifyRepositoryReferences(source, conf) {
    if(!source[conf.field]) {
        source[conf.field] = [];
        return source;
    }

    return conf.apiFunction.call(null, source)
        .then(function(res) {
            var refNames = res.result.map(function(item) {
                return item.name;
            });

            source[conf.field] = source[conf.field].filter(function(item) {
                var exists = refNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn('Ref %s does not actually present in repository %s', item, source.name);
                }

                return exists;
            });

            return source;
        });
}

/**
 * Create targets for source
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {Array} array of tag names
 * - branches - {Array} array branch names
 * - url - {String} git url of repository
 * @returns {Array}
 */
function createTargets(source) {
    var targets = [];

    ['tags', 'branches'].forEach(function(type) {
        source[type].forEach(function(ref) {
            var target = new Target(source, ref, type);
            targets.push(target);

            logger.debug('create target %s into directory %s', target.getName(), target.getContentPath());
        });
    });

    if(!targets.length) {
        return vow.reject('no targets will be executed');
    }

    return targets;
}

module.exports = function(source) {
    try {
        init()
            .then(function() {
                return vowFs.listDir(constants.DIRECTORY.CONTENT).then(function(dirs) {
                    return vow.all(dirs.map(function(dir) {
                        var p = path.join(constants.DIRECTORY.CONTENT, dir);

                        logger.debug('remove directory %s', p);
                        return utility.removeDir(p);
                    }));
                });
            })
            .then(function() {
                return retrieveSshUrl(source);
            })
            .then(function(source) {
                return verifyRepositoryReferences(source, {
                    field: 'tags',
                    apiFunction: api.getRepositoryTags
                });
            })
            .then(function(source) {
                return verifyRepositoryReferences(source, {
                    field: 'branches',
                    apiFunction: api.getRepositoryBranches
                });
            })
            .then(createTargets)
            .then(function(targets) {
                return vow.all(targets.map(function(target) {
                    return target.execute();
                }));
            })
            .then(function() {
                return commander.gitAdd();
            })
            .then(function() {
                return commander.gitCommit(util.format('Update data: %s', (new Date()).toString()));
            })
            .then(function() {
                return commander.gitPush(config.get('dataConfig:ref'));
            })
            .then(function() {
                logger.info(''.toUpperCase.apply('application has been finished'));
            })
            .fail(function(err) {
                logger.error(err);
                logger.error(''.toUpperCase.apply('application failed with error'));
            });
    }catch(err) {
        logger.error(err.message);
    }
};
