/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    libs = require('../libs'),
    logger = libs.logger(module);

var MSG = {
    INFO: {
        START: '-- update config start --',
        END: '-- update config end --'
    }
};

module.exports = {

    run: function(targets) {
        logger.info(MSG.INFO.START);

        var _path = path.resolve('config', 'repositories') + '.json';

        return q_io.read(_path)
            .then(function(content) {
                return q_io.write(_path,
                    JSON.stringify(markAsMade(targets, content), null, 4), { charset: 'utf8' });
            })
            .then(function() {
                logger.info(MSG.INFO.END);
            });
    }
};

/**
 * Overwrites configuration file and add tags and branches of completed targets to exclude
 * @param targets - {Array} array of completed targets
 * @param content - {String} json content of config.json file
 * @returns {defer.promise|*}
 */
var markAsMade = function(targets, content) {

    try {
        var sources = JSON.parse(content);

        if(targets.length === 0) {
            return sources;
        }

        var REF_TYPES = ['tags', 'branches'],
            INEX_TYPES = ['include', 'exclude'];

        Object.getOwnPropertyNames(sources).forEach(function(privacy) {
            sources[privacy].forEach(function(owner) {
                owner.repositories.forEach(
                    function(repo) {
                        REF_TYPES.forEach(function(type) {
                            repo[type] = repo[type] || [];
                            INEX_TYPES.forEach(function(inex) {
                                repo[type][inex] = repo[type][inex] || [];
                            });

                        });

                        targets
                            .filter(
                                function(target) {
                                    return target.source.name === repo.name;
                                }
                            ).forEach(
                                function(target) {
                                    INEX_TYPES.forEach(function(inex) {
                                        repo[target.type][inex].push(target.ref);
                                    });
                                }
                            );

                        REF_TYPES.forEach(function(type) {
                            INEX_TYPES.forEach(function(inex) {
                                repo[type][inex] = _.uniq(repo[type][inex], true);
                            });
                        });
                    }
                );
            });
        });

        return sources;

    }catch(error) {
        return content;
    }
};
