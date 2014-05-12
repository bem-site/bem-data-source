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
    logger = libs.logger(module),
    Target = require('./target');

/**
 * At first creates content repository
 * Check if output directory is already exists
 * If yes return
 * Else clone remote github destination repository content in this output folder
 * @returns {*}
 */
var init = function() {
    return vowFs.makeDir(constants.DIRECTORY.CONTENT).then(function() {
        return vowFs.exists(constants.DIRECTORY.OUTPUT).then(function(exists) {
            if(exists) {
                return;
            }
            return libs.util.getSSHUrl(config.get('dataConfig'))
                .then(function(url) {
                    logger.info('Start clone remote target data repository. Please wait ...');

                    return libs.cmd.gitClone({
                        getName: function() { return 'all'; },
                        getUrl: function() { return url; },
                        getContentPath: function() { return constants.DIRECTORY.OUTPUT; }
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
    var GITHUB = {
        INNER: 'github.yandex-team.ru',
        OUTER: 'github.com'
    };

    var url = util.format('git://%s/%s/%s.git',
        source.isPrivate ? GITHUB.INNER : GITHUB.OUTER , source.user, source.name);

    logger.debug('get repository with name %s and url %s', source.name, url);
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
    if(!source.tags) {
        source.tags = [];
        return source;
    }

    return libs.api.getRepositoryTags(source)
        .then(function(res) {
            var tagNames = res.result.map(function(item) {
                return item.name;
            });

            source.tags = source.tags.filter(function(item) {
                var exists = tagNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn("Tag %s does not actually present in repository %s", item, source.name);
                }

                return exists;
            });

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
        source.branches = [];
        return source;
    }

    return libs.api.getRepositoryBranches(source)
        .then(function(res) {
            var branchNames = res.result.map(function(item) {
                return item.name;
            });

            source.branches = source.branches.filter(function(item) {
                var exists = branchNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn("Tag %s does not actually present in repository %s", item, source.name);
                }

                return exists;
            });

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

    return targets;
};

/**
 * Executes all tasks for all targets
 * @param targets - {Array} of {Target} objects
 * @returns {*}
 */
var executeTargets = function(targets) {
    logger.info('-- run commands start --');

    return vow.allResolved(
        targets.map(function(target) { return target.execute(); })
    )
    .then(function() {
        logger.info('-- run commands end --');
    });
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

exports.run = function(source) {
    libs.api.init();

    init()
        .then(function() { return retrieveSshUrl(source); })
        .then(verifyRepositoryTags)
        .then(verifyRepositoryBranches)
        .then(createTargets)
        .then(executeTargets)
        .then(commitAndPushResults)
        .then(function() {
            logger.info('application has been finished');
        });
};