/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    util = require('../../libs/util');

/**
 * Executes all task settled for targets targets
 * Makes chain of promises from tasks defined for targets
 * @param targets - {Array} array of targets which should be executed
 * @returns {defer.promise|*}
 */
var execute = function(targets) {
    LOGGER.info('step6: - run commands start');
    var def = Q.defer();
    try {
        Q.allSettled(
                targets.map(
                    function(target) {
                        var initial = target.tasks.shift();
                        return target.tasks.reduce(
                            function(prev, item) {
                                return prev.then(
                                    function() {
                                        return item.call(null, target);
                                    }
                                );
                            },
                            initial.call(null, target)
                        );
                    }
                )
            ).then(
                function(result) {
                    def.resolve(util.filterAndMapFulfilledPromises(
                        result,
                        function(item) {
                            return item.value;
                        }
                    ));
                    LOGGER.info('step6: - run commands end');
                }
            );
    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }

    return def.promise;
};

module.exports = execute;