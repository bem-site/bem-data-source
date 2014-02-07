/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    constants = require('../constants'),
    libs = require('../libs'),

    u = libs.util,
    commands = libs.cmd,
    logger = libs.logger(module),

    collectSets = require('./collect_sets'),
    createOutput = require('./create_output');

var MSG = {
    INFO: {
        START: '-- create targets start --',
        END: '-- create targets end --'
    },
    DEBUG: {
        CREATE_TARGET_FOR: 'create target for source: %s with ref %s into directory %s'
    }
};

module.exports = {

    run: function(sources) {
        logger.info(MSG.INFO.START);

        var def = q.defer(),
            targets = [];

        try{
            sources.forEach(function(source) {
                var sourceDir = source.targetDir || source.name,
                    existed = u.getDirs(path.join(constants.DIRECTORY.CONTENT, sourceDir));

                ['tags', 'branches'].forEach(function(type) {
                    source[type].forEach(function(ref) {
                        targets.push(createTarget.apply(null, [source, ref, sourceDir, existed, type]));
                    });
                });
            });

            def.resolve(targets);
        }catch(err) {
            logger.error(err.message);
            def.reject(err);
        }finally {
            logger.info(MSG.INFO.END);
        }
        return def.promise;
    }
};

/**
 * Creates target for tag or branch of current source
 * @param arguments - {Array} of arguments with elements:
 * [0] - {Object} source object
 * [1] - {String} name of tag or branch
 * [2] - {String} source directory (name of directory where source should be cloned. By default it equal to repository name)
 * [3] - {Array} array of directories corresponded to tags or branches of current source
 * [4] - {String} type of reference (tags or branches)
 * @returns {*}
 */
var createTarget = function() {
    var source = arguments[0],
        ref = arguments[1],
        sourceDir = arguments[2],
        existed = arguments[3],
        type = arguments[4],

        target = {
            source: source,
            name: util.format('%s %s', source.name, ref),
            sourceDir: sourceDir,
            contentPath: path.join(constants.DIRECTORY.CONTENT, sourceDir, ref),
            outputPath: path.join(constants.DIRECTORY.OUTPUT, sourceDir, ref),
            url: source.url,
            ref: ref,
            type: type,
            tasks: []
        };

    logger.debug('existed = %s ref = %s', existed.join(', '), ref);

    target.tasks.push(createOutput);

    if(_.indexOf(existed, ref) === -1) {
        target.tasks.push(commands.gitClone);
        target.tasks.push(commands.gitCheckout);
    }

    target.tasks.push(commands.npmInstall);
    target.tasks.push(commands.bemMakeLibs);
    target.tasks.push(commands.bemMakeSets);

    target.tasks.push(commands.gitMoveSets);
    target.tasks.push(commands.gitMoveMd);

    target.tasks.push(collectSets);

    logger.debug(MSG.DEBUG.CREATE_TARGET_FOR,
        source.name, ref, path.join(constants.DIRECTORY.CONTENT, sourceDir, ref));

    return target;
};

