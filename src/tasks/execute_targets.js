/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),
    _ = require('lodash'),

    //application modules
    logger = require('../libs/logger')(module),
    u = require('../libs/util');

module.exports = {

    /**
     * Executes all task settled for targets targets
     * Makes chain of promises from tasks defined for targets
     * @param targets - {Array} array of targets which should be executed
     * @returns {defer.promise|*}
     */
    run: function(targets) {
        logger.info('step6: - run commands start');

        var def = q.defer();
        try {
            q.allSettled(
                    targets.map(function(target) {
                        var initial = target.tasks.shift();
                        return target.tasks.reduce(function(prev, item) {
                            return prev.then(function() {
                                return item.call(null, target);
                            });
                        }, initial.call(null, target));
                    })
                )
                .then(
                    function(result) {
                        def.resolve(u.filterAndMapFulfilledPromises(result, function(item) { return item.value; } ));
                        logger.info('step6: - run commands end');
                    }
                );
        }catch(err) {
            logger.error(err.message);
            def.reject(err);
        }

        return def.promise;
    }
};