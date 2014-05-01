/* global toString: false */
'use strict';

var util = require('util'),
    _ = require('lodash'),
    q = require('q'),

    //application modules
    config = require('./config'),
    libs = require('./libs'),
    tasks = require('./tasks'),
    logger = libs.logger(module);

var make = (function() {
    logger.info('|| ---- data source start ---- ||');

    tasks.init.run.apply(null)
    .then(tasks.getConfig.run)
    .then(retrieveSshUrl)
    .then(verifyRepositoryTags)
    .then(tasks.getBranches.run)
    .then(tasks.createTargets.run)
    .then(tasks.executeTargets.run)
    .then(tasks.updateConfig.run)
    .then(tasks.collectResults.run)
    .then(function() {
        logger.info('|| ---- data source end ---- ||');
    });
})();

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
 * - tag - {String} tag name
 * - branch - {String} branch name
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var verifyRepositoryTags = function(source) {
    logger.info('-- get tags start --');

    if(!source.tag) {
        logger.info('-- get tags end --');
        return source;
    }

    return libs.api.getRepositoryTags(source)
        .then(function(res) {
            var tagNames = _.pluck(res.result, 'name');

            if(tagNames.indexOf(source.tag) < 0) {
                logger.warn("Tag %s does not actually present in repository %s", source.tag, source.name);
                source.tag = null;
            }

            logger.info('-- get tags end --');
            return source;
        });
};