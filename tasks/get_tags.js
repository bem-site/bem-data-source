/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config'),
    git = require('../libs/git'),
    util = require('../libs/util');

var TAGS_ALL = 'all',
    TAGS_LAST = 'last';


module.exports = {

    /**
     * Retrieves information about repository tags and filter them according to config
     * @param sources - {Array} of objects with fields:
     * - user {String} name of user or organization
     * - isPrivate {Boolean} indicate if repository from private github
     * - name - {String} name of repository
     * - targetDir - {String} target directory
     * - docDirs - {Array} array of string path where docs are
     * - type - {String} type of repository. Different engines should be used for different types
     * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
     * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
     * - url - {String} git url of repository
     * @returns {defer.promise|*}
     */
    run: function(sources) {
        LOGGER.info('step3: - resolveTags start');

        return Q.allSettled(
                sources.map(function(item) {
                    return git.getRepositoryTags(item);
                })
            ).then(function(res) {

                //remove all rejected promises and map fulfilled promises
                res = util.filterAndMapFulfilledPromises(res, function(item) {
                    item = item.value;
                    item.source.tags = filterTags(item.source, _.pluck(item.result, 'name'));
                    return item.source;
                });

                LOGGER.info('step3: - resolveTags end');
                return res;
            });
    }
};

/**
 * remove tags which excluded in config
 * remove tags which not included in config
 * left only last tag if there 'last' in config
 * left all tags if there 'all' in config
 * also exclude rule have greater priority
 * @param source - {Object} with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - targetDir - {String} target directory
 * - docDirs - {Array} array of string path where docs are
 * - type - {String} type of repository. Different engines should be used for different types
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @param tags - {Array} array of tags which are actually presented for current source
 * @returns {Array}
 */
var filterTags = function(source, tags) {
    var result = [];

    if(source.tags) {
        var tagsInclude = source.tags.include,
            tagsExclude = source.tags.exclude;

        if(_.isArray(tagsInclude)) {
            //show errors in console log if invalid tags are presented in repositories configuration
            tagsInclude.forEach(function(tagInclude) {
               if(tags.indexOf(tagInclude) === -1) {
                   LOGGER.error(
                       UTIL.format('Tag %s does not actually presented in tags of %s repository', tagInclude, source.name));
               }
            });

            result = _.intersection(tags, tagsInclude);
        }else if(_.isString(tagsInclude)) {
            if(tagsInclude === TAGS_LAST) {
                result = [_.last(tags.sort(util.sortTags))];
            }else if(tagsInclude === TAGS_ALL) {
                result = tags;
            }
        }

        if(_.isArray(tagsExclude) && (!source.noCache || source.noCache === 'false')) {
            result = _.difference(result, tagsExclude);
        }
    }

    if(result.length > 0) {
        LOGGER.debug(UTIL.format('repository: %s tags: %s will be executed', source.name, result));
    }

    return result;
};
