/* global toString: false */
'use strict';

var util = require('util'),
    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    //application modules
    config = require('./config'),
    constants = require('./constants'),
    libs = require('./libs'),
    tasks = require('./tasks'),
    logger = libs.logger(module),
    Target = require('./target');

var init = function() {
    return vowFs.makeDir(constants.DIRECTORY.CONTENT).then(function() {
        return vowFs.isDir(constants.DIRECTORY.OUTPUT).then(function(isDir) {
            if(isDir) {
                return;
            }

            var getUrl = function() {
                var dataRepository = config.get('dataConfig');

                return libs.api
                    .getRepository({
                        user: dataRepository.user,
                        name: dataRepository.repo,
                        isPrivate: dataRepository.private
                    })
                    .then(
                        function(res) {
                            return res.result.ssh_url;
                        },
                        function() {
                            logger.error('Data repository was not found. Application will be terminated');
                        }
                );
            };

            logger.info('Start clone remote target data repository. Please wait ...');
            return getUrl()
                .then(function(remoteUrl) {
                    return libs.cmd.gitClone({
                        url: remoteUrl,
                        contentPath: constants.DIRECTORY.OUTPUT
                    });
                })
                .then(function() {
                    logger.info('Remote target data repository has been cloned successfully');
                });
        });
    });
};

/**
 * Generates ssh url of repository
 * @param sources - {Object} object with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - user {String} name of user or organization
 * - tag - {String} name of tag
 * - branch - {String} name of branch
 * @returns {defer.promise|*}
 */
var retrieveSshUrl = function(source) {
    logger.info('-- get repositories start --');

    var GITHUB = {
        INNER: 'github.yandex-team.ru',
        OUTER: 'github.com'
    };

    var url = util.format('git://%s/%s/%s.git',
        source.isPrivate ? GITHUB.INNER : GITHUB.OUTER , source.user, source.name);

    logger.debug('get repository with name %s and url %s', source.name, url);
    logger.info('-- get repositories end --');

    return _.extend({ url: url }, source);
};

/**
 * Retrieves information about repository tags and filter them according to config
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {String} tag name
 * - branches - {String} branch name
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var verifyRepositoryTags = function(source) {
    logger.info('-- get tags start --');

    if(!source.tags) {
        source.tags = [];

        logger.debug('no tags have been set');
        logger.info('-- get tags end --');

        return source;
    }

    return libs.api.getRepositoryTags(source)
        .then(function(res) {
            var tagNames = res.result.map(function(item) {
                return item.name;
            });

            source.tags = source.tags.split(',');
            source.tags = source.tags.filter(function(item) {
                var exists = tagNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn("Tag %s does not actually present in repository %s", item, source.name);
                }

                return exists;
            });

            logger.info('-- get tags end --');
            return source;
        });
};

/**
 * Retrieves information about repository branches and filter them according to config
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {String} tag name
 * - branches - {String} branch name
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var verifyRepositoryBranches = function(source) {
    logger.info('-- get branches start --');

    if(!source.branches) {
        logger.info('-- get branches end --');
        return source;
    }

    return libs.api.getRepositoryBranches(source)
        .then(function(res) {
            var branchNames = res.result.map(function(item) {
                return item.name;
            });

            source.branches = source.branches.split(',');
            source.branches = source.branches.filter(function(item) {
                var exists = branchNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn("Tag %s does not actually present in repository %s", item, source.name);
                }

                return exists;
            });

            logger.info('-- get tags end --');
            return source;
        });
};

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
var createTargets = function(source) {
    logger.info('-- create targets start --');

    var targets = [];

    ['tags', 'branches'].forEach(function(type) {
        source[type].forEach(function(ref) {
            var target = new Target(source, ref, type);
            targets.push(target);

            logger.debug('create target %s into directory %s', target.getName(), target.getContentPath());
        });
    });

    if(!targets.length) {
        logger.warn('no targets will be executed');
    }

    logger.info('-- create targets end --');
    return targets;
};

var executeTargets = function(targets) {
    logger.info('-- run commands start --');

    return vow.allResolved(
        targets.map(function(target) { target.execute(); })
    )
    .then(
        function(result) {
            logger.info('-- run commands end --');
            return libs.util.filterAndMapFulfilledPromises(
                result, function(item) { return item.value; } );
        }
    );
};

/**
 * Commits and pushes collected data
 * @returns {*}
 */
var commitAndPushResults = function() {

    logger.info('-- commit and push results start --');

    return libs.cmd.gitAdd()
        .then(function() {
            return libs.cmd.gitCommit(util.format('Update data: %s', (new Date()).toString()));
        })
        .then(function() {
            return libs.cmd.gitPush(config.get('dataConfig:ref'));
        })
        .then(function() {
            logger.info('-- commit and push results end --');
        });
};

(function() {
    logger.info('|| ---- data source start ---- ||');

    init()
        .then(tasks.getConfig.run, function(err) { console.log('error %s', err); })
        .then(retrieveSshUrl)
        .then(verifyRepositoryTags)
        .then(verifyRepositoryBranches)
        .then(createTargets)
        .then(executeTargets)
        //.then(commitAndPushResults)
        .then(function() {
            logger.info('|| ---- data source end ---- ||');
        });
})();