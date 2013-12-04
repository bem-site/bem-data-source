/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore');

var execute = function(targets) {
    LOGGER.info('step6: - run commands start');
    var def = Q.defer();
    try {
        Q.allSettled(
                targets.map(
                    function(target) {
                        var initial = target.tasks.shift();
                        return target.tasks.reduce(function(prev, item) {
                            return prev.then(function() { return item.call(null, target); });
                        }, initial.call(null, target));
                    }
                )
            ).then(
            function(result) {
                def.resolve(result
                    .filter(function(item) {
                        return item.state === 'fulfilled';
                    })
                    .map(function(item) {
                        return item.value;
                    })
                );

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