//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config'),
    git = require('../libs/git'),
    util = require('../libs/util');

/**
 * Retrieves information about repository tags and filter them according to config
 * @param sources - {Array} of objects with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var execute = function(sources) {
    LOGGER.info('resolveTags start');

    var def = Q.defer();
    try {
        Q.allSettled(
                sources.map(function(item) {
                    return git.getRepositoryTags(item);
                })
            ).then(function(res) {
                //remove all rejected promises
                res = res.filter(function(item) {
                    return item.state == 'fulfilled';
                });

                res = res.map(function(item) {
                    item = item.value;

                    //return array which contains only tag names
                    var tags = item.result.map(function(tag) {
                        return tag.name;
                    });

                    //remove tags which excluded in config
                    //remove tags which not included in config
                    var source = item.source;
                    if(source.tags) {
                        if(_.isArray(source.tags.exclude)) {
                            tags = _.difference(tags, source.tags.exclude);
                        }
                        if(_.isArray(source.tags.include)) {
                            tags = _.intersection(tags, source.tags.include);
                        }else if(_.isString(source.tags.include)) {
                            if(source.tags.include == 'last') {
                                tags = [_.last(tags.sort(util.sortTags))];
                            }
                        }
                    }

                    LOGGER.finfo('repository: %s tags: %s', source.name, tags);

                    item.source.tags = tags;
                    return item.source;
                });

                def.resolve(res);
            });

    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    } finally {
        return def.promise;
    }
};

module.exports = execute;
