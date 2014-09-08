'use strict';

var util = require('util'),
    path =require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),

    api = require('../gh-api'),
    common = require('./common'),
    config = require('../config'),
    logger = require('../logger'),
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
                    logger.info('Start clone remote target data repository. Please wait ...', module);
                    return commander.gitClone(url, constants.DIRECTORY.OUTPUT);
                })
                .then(function() {
                    logger.info('Remote target data repository has been cloned successfully', module);
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

    logger.debug(util.format('get repository with name %s and url %s', source.name, url), module);

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
                    logger.warn(util.format('Ref %s does not actually present in repository %s',
                        item, source.name), module);
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

            logger.debug(util.format('create target %s into directory %s',
                target.getName(), target.getContentPath()), module);
        });
    });

    if(!targets.length) {
        return vow.reject('no targets will be executed');
    }

    return targets;
}

function make(source) {

    return init()
        .then(function() {
            return vowFs.listDir(constants.DIRECTORY.CONTENT).then(function(dirs) {
                return vow.all(dirs.map(function(dir) {
                    var p = path.join(constants.DIRECTORY.CONTENT, dir);

                    logger.debug(util.format('remove directory %s', p), module);
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
                apiFunction: api['getRepositoryTags']
            });
        })
        .then(function(source) {
            return verifyRepositoryReferences(source, {
                field: 'branches',
                apiFunction: api['getRepositoryBranches']
            });
        })
        .then(createTargets)
        .then(function(targets) {
            return vow.all(targets.map(function(target) {
                return target.execute();
            }));
        })
        .then(common({
            commitMessage: util.format('Update data: %s', (new Date()).toString()),
            successMessage: 'MAKE COMMAND HAS BEEN FINISHED SUCCESSFULLY',
            errorMessage: 'MAKE COMMAND FAILED WITH ERROR %s'
        }));
}

module.exports = function() {

    return this
        .title('make command')
        .helpful()
        .opt()
            .name('private').title('Privacy of repository')
            .short('p').long('private')
            .flag()
            .end()
        .opt()
            .name('user').title('User or organization for repository')
            .short('u').long('user')
            .req()
            .end()
        .opt()
            .name('repo').title('Name of repository')
            .short('r').long('repo')
            .req()
            .end()
        .opt()
            .name('tags').title('Name(s) of tags')
            .short('t').long('tags')
            .arr()
            .end()
        .opt()
            .name('branches').title('Name(s) of branches')
            .short('b').long('branches')
            .arr()
            .end()
        .opt()
            .name('docsOnly').title('Indicates that only docs should be collected')
            .short('docs-only').long('docs-only')
            .flag()
            .end()
        .act(function(opts) {
            logger.info('TRY TO MAKE FOR:', module);

            logger.info(util.format('repository privacy: %s', !!opts.private), module);
            logger.info(util.format('repository user or organization: %s', opts.user), module);
            logger.info(util.format('repository name: %s', opts.repo), module);
            logger.info(util.format('repository refs %s', opts.tags || opts.branches), module);
            logger.info(util.format('only docs %s', !!opts.docsOnly), module);

            if (!opts.tags && !opts.branches) {
                logger.error('Tags or branches have not been set', module);
                return;
            }

            return make({
                isPrivate: !!opts.private,
                user: opts.user,
                name: opts.repo,
                tags: opts.tags || [],
                branches: opts.branches || [],
                docsOnly: !!opts.docsOnly
            });
        });

};
