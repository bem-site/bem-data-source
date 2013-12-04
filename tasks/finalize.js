/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config');

var execute = function(targets) {
    LOGGER.info('step7: - finalize start');

    var def = Q.defer();

    try {
        var path = PATH.resolve('config', 'config') + '.json';

        U.readFile(path)
            .then(
                function(content) {
                    return markAsMade(targets, content);
                }
            )
            .then(
                function(content) {
                    return U.writeFile(path, JSON.stringify(content, null, 4));
                }
            )
            .then(
                function() {
                    LOGGER.info('step7: - finalize end');
                    def.resolve(targets);
                }
            );
    }catch(error) {
        def.reject(error);
    }

    return def.promise;
};

/**
 * Overwrites configuration file and add tags and branches of completed targets to exclude
 * @param targets - {Array} array of completed targets
 * @param content - {String} json content of config.json file
 * @returns {defer.promise|*}
 */
var markAsMade = function(targets, content) {
    var def = Q.defer();

    if(!content) {
        def.reject(new Error('configuration file not found'));
        return def.promise;
    }

    if(!targets) {
        def.reject(new Error('targets undefined for finalization'));
        return def.promise;
    }

    try {
        var config = JSON.parse(content),
            sources = config.sources;

        if(targets.length === 0) {
            def.resolve(config);
        }else {

            ['private', 'public'].forEach(function(privacy) {
                sources[privacy].forEach(function(owner) {
                    owner.repositories.forEach(
                        function(repo) {
                            repo.tags = repo.tags || [];
                            repo.branches = repo.branches || [];
                            repo.tags.exclude = repo.tags.exclude || [];
                            repo.branches.exclude = repo.branches.exclude || [];

                            targets
                                .filter(
                                    function(target) {
                                        return target.source.name === repo.name;
                                    }
                                ).forEach(
                                    function(target) {
                                        repo[target.type].exclude.push(target.ref);
                                    }
                                );

                            _.uniq(repo.tags.exclude, true);
                            _.uniq(repo.branches.exclude, true);
                        }
                    );
                });
            });

            config.sources = sources;
            def.resolve(config);
        }
    }catch(error) {
        def.reject(error);
    }

    return def.promise;
};

module.exports = execute;
