var BEM = require('bem'),
    FS = require('fs'),
    CP = require('child_process'),
    Q = BEM.require('q'),
    fs = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = require('underscore'),

    config = require('./config/config'),
    git = require('./libs/git'),
    util = require('./libs/util');

var make = function() {
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

var resolveRepositories = function(sources) {

    var def = Q.defer(),
        promises = null;

    try {
        promises = sources.map(function(item) {
            return git.getRepository(item.user, item.name, item.isPrivate);
        });

        Q.allSettled(promises).then(function(res) {
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