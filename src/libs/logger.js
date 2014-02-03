/* global toString: false */
'use strict';

var winston = require('winston');

var levels = levels || {
        levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        },
        colors: {
            debug: 'blue',
            info: 'green',
            warn: 'orange',
            error: 'red'
        }
    };

var container = container || new winston.Container({
    levels: levels.levels,
    exitOnError: false
});

module.exports = function(module) {
    var label = module ? module.filename.split('/').slice(-2).join('/') : '';

    winston.addColors(levels.colors);

    container.add(module.filename, {
        transports: [
            new (winston.transports.Console)({
                level: 'silly',
                handleExceptions: true,
                colorize: true,
                label: label
            })
        ]
    });

    return container.get(module.filename);
};
