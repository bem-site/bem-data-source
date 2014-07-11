'use strict';

var util = require('util'),
    path =require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    //application modules
    config = require('./config'),
    constants = require('./constants'),
    libs = require('./libs'),
    logger = libs.logger(module),
    Target = require('./target'),

    /**
     * At first creates content repository
     * Check if output directory is already exists
     * If yes return
     * Else clone remote github destination repository content in this output folder
     * @returns {*}
     */
    init = function() {
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
    },

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
    retrieveSshUrl = function(source) {
        var url = util.format('git://%s/%s/%s.git',
            source.isPrivate ? constants.GITHUB.PRIVATE : constants.GITHUB.PUBLIC, source.user, source.name);

        logger.debug('get repository with name %s and url %s', source.name, url);

        source.url = url;
        return source;
    },

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
    verifyRepositoryReferences = function(source, conf) {
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
    },

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
    createTargets = function(source) {
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
    };

exports.run = function(source) {
    libs.api.init();

    init()
        .then(function() {
            return vowFs.listDir(constants.DIRECTORY.CONTENT).then(function(dirs) {
                return vow.all(dirs.map(function(dir) {
                    var p = path.join(constants.DIRECTORY.CONTENT, dir);

                    logger.debug('remove directory %s', p);
                    return libs.util.removeDir(p);
                }));
            });
        })
        .then(function() {
            return retrieveSshUrl(source);
        })
        .then(function(source) {
            return verifyRepositoryReferences(source, {
                field: 'tags',
                apiFunction: libs.api.getRepositoryTags
            });
        })
        .then(function(source) {
            return verifyRepositoryReferences(source, {
                field: 'branches',
                apiFunction: libs.api.getRepositoryBranches
            });
        })
        .then(createTargets)
        .then(function(targets) {
            return vow.all(targets.map(function(target) {
                return target.execute();
            }));
        })
        .then(function() {
            return libs.cmd.gitAdd();
        })
        .then(function() {
            return libs.cmd.gitCommit(util.format('Update data: %s', (new Date()).toString()));
        })
        .then(function() {
            return libs.cmd.gitPush(config.get('dataConfig:ref'));
        })
        .then(function() {
                logger.info(''.toUpperCase.apply('application has been finished'));
        })
        .fail(function(err) {
            logger.error(err);
            logger.error(''.toUpperCase.apply('application failed with error'));
        });
};
