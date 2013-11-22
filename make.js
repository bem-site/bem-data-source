var FS = require('fs'),
    CP = require('child_process'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    FS = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    config = require('./config/config'),
    git = require('./libs/git'),
    util = require('./libs/util');

var make = function() {
    LOGGER.setLevel(0);
    LOGGER.info('- data source start -');
    util.createContentDirectory()
        .then(function() {
            return getSources();
        })
        .then(function(sources) {
            return resolveRepositories(sources);
        })
        .then(function(sources) {
            return resolveTags(sources);
        })
};

var getSources = function() {

    var def = Q.defer(),
        _sources = [],
        sources = config.get('sources');

    try {
        Object.getOwnPropertyNames(sources).forEach(function(key) {
            sources[key].forEach(function(source) {
                var owner = source.org || source.user,
                    repositories = source.repositories;

                (owner && repositories) && repositories.forEach(function(repository) {
                    _sources.push(_.extend(repository, { user: owner, isPrivate: key == 'private' }))
                })
            });
        });

        def.resolve(_sources);
    } catch(err) {
        def.reject(err);
    } finally {
        return def.promise;
    }

};

/**
 * Retrieves information about git repositories by their names
 * @param sources - {Object} object with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * @returns {defer.promise|*}
 */
var resolveRepositories = function(sources) {
    var def = Q.defer();
    try {
        Q.allSettled(
            sources.map(function(item) {
                return git.getRepository(item.user, item.name, item.isPrivate);
            })
        ).then(function(res) {
            //remove all rejected promises
            res = res.filter(function(item) {
                return item.state == 'fulfilled';
            });

            //return array of sources with items extended by git urls of repositories
            res = res.map(function(item) {
                var source = sources.filter(function(s){
                    return s.name == item.name
                })[0];
                return _.extend({url: item.git_url}, source);
            });

            def.resolve(res);
        });

    } catch(err) {
        def.reject(err);
    } finally {
        return def.promise;
    }
};

var resolveTags = function(data) {

};

make();