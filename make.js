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
        return resolveRepositories();
    })
    .then(function() {
        return resolveTags();
    })
};

var resolveRepositories = function() {
    var sources = config.get('sources');

    var s = [];

    Object.getOwnPropertyNames(sources).forEach(function(key) {
        sources[key].forEach(function(source) {
            var owner = source.org || source.user,
                repositories = source.repositories;

            (owner && repositories) && repositories.forEach(function(repository) {
                s.push(_.extend(repository, { user: owner, isPrivate: key == 'private' }))
            })
        });
    });

    var def = Q.defer(),
        promises = s.map(function(item) {
            return git.getRepository(item.user, item.name, item.isPrivate);
        });

    Q.allSettled(promises).then(function(res) {
        def.resolve(res);
    });

    return def.promise;
};

var resolveTags = function() {

};

make();