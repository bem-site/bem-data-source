/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    logger = require('../libs/logger')(module),
    api = require('../libs/api'),
    u = require('../libs/util');

var TAGS_ALL = 'all',
    TAGS_LAST = 'last';

var MSG = {
    INFO: {
        START: '-- get tags start --',
        END: '-- get tags end --'
    },
    ERR: {
        TAG_NOT_PRESENT: 'Tag %s does not actually presented in tags of %s repository'
    },
    DEBUG: {
        TAGS_TO_EXECUTE: 'repository: %s tags: %s will be executed'
    }
};

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
        logger.info(MSG.INFO.START);

        return q.allSettled(
                sources.map(function(item) {
                    return api.getRepositoryTags(item);
                })
            ).then(function(res) {

                //remove all rejected promises and map fulfilled promises
                res = u.filterAndMapFulfilledPromises(res, function(item) {
                    item = item.value;
                    item.source.tags = filterTags(item.source, _.pluck(item.result, 'name'));
                    return item.source;
                });

                logger.info(MSG.INFO.END);
                return res;
            });
    }
};

/**
 * Remove tags which excluded in config.
 * Removes tags which not included in config
 * Left only last tag if there 'last' in config
 * Left all tags if there 'all' in config
 * @param source - {Object} source object
 * @param tags - {Array} array of tags which are actually presented for current source
 * @returns {Array} array of source objects with settled tags for execute
 */
var filterTags = function(source, tags) {
    var result = [];

    if(source.tags) {
        var tagsInclude = source.tags.include,
            tagsExclude = source.tags.exclude;

        if(_.isArray(tagsInclude)) {
            //show errors in console log if invalid tags are presented in repositories configuration
            tagsInclude.forEach(function(tagInclude) {
               if(_.indexOf(tags, tagInclude) === -1) {
                   logger.error(MSG.ERR.TAG_NOT_PRESENT, tagInclude, source.name);
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

        if(_.isArray(tagsExclude)) {
            result = _.difference(result, tagsExclude);
        }
    }

    if(result.length > 0) {
        logger.debug(MSG.DEBUG.TAGS_TO_EXECUTE, source.name, result);
    }

    return result;
};
