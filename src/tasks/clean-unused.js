'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),

    logger = require('../logger'),
    commander = require('../commander'),

    LEVEL_NAMES = ['desktop', 'touch-pad', 'touch-phone'],
    PATTERN = {
        LEAVE: ['_*.css', '_*.js', '*.bemhtml.js', '*.ru.html', '*.bemjson.js'],
        REMOVE: ['*.browser.bemhtml.js', '*.en.js', '*.ru.js', '*.tr.js']
    };

module.exports = function (target) {
    logger.debug('remove unused files', module);

    var commandPattern = 'find %s -type f %s | xargs rm',
        queryLeaveStr = PATTERN.LEAVE.reduce(function (prev, item) {
            prev += util.format(' -not -iname %s', item);
            return prev;
        }, ''),
        queryRemoveStr = PATTERN.REMOVE.reduce(function (prev, item, index) {
            prev += index > 0 ? ' -o' : '';
            prev += util.format(' -iname %s', item);
            return prev;
        }, ''),
        findAndRemove = function (query) {
            return vow
                .all(LEVEL_NAMES.map(function (level) {
                    return commander.runCommand(
                        util.format(commandPattern, path.resolve(target.getOutputPath(), level + '.examples'), query),
                        {}, util.format('remove unused files from %s', level), target);
                }));
        };

    return findAndRemove(queryLeaveStr)
        .then(function () {
            return findAndRemove(queryRemoveStr);
        })
        .then(function () {
            return target;
        });
};
