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
    logger = libs.logger(module),
    clear = require('./clear'),
    collectSets = require('./collect_sets'),
    createOutput = require('./create_output');

var MSG = {
    INFO: {
        START: '-- create targets start --',
        END: '-- create targets end --'
    },
    WARN: {
        NO_TARGETS: 'no targets will be executed'
    },
    DEBUG: {
        CREATE_TARGET_FOR: 'create target for source: %s with ref %s into directory %s'
    }
};

module.exports = {

    /**
     * Creates targets for each of sources
     * @param sources - {Array} of sources
     * @returns {Promise<T>}
     */
    run: function(sources) {
        logger.info(MSG.INFO.START);

        var def = q.defer(),
            targets = [];

        try{
            sources.forEach(function(source) {
                var sourceDir = source.targetDir || source.name,
                    existed = libs.util.getDirs(path.join(constants.DIRECTORY.CONTENT, sourceDir));

                ['tags', 'branches'].forEach(function(type) {
                    source[type].forEach(function(ref) {
                        targets.push(createTarget.apply(null, [source, ref, sourceDir, existed, type]));
                    });
                });
            });

            if(targets.length === 0) {
                logger.warn(MSG.WARN.NO_TARGETS);
            }

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

    //clear existed directory for target if it already exist on filesystem
    if(_.indexOf(existed, ref) !== -1) {
        target.tasks.push(clear);
    }

    target.tasks.push(libs.cmd.gitClone); //git clone
    target.tasks.push(libs.cmd.gitCheckout); //git checkout
    target.tasks.push(libs.cmd.npmInstall); //npm install
    target.tasks.push(libs.cmd.npmRunDeps); //bower or bem make libs
    target.tasks.push(libs.cmd.bemMakeSets); //bem make sets
    target.tasks.push(libs.cmd.moveSets); //move sets to output folder

    target.tasks.push(collectSets); //collect sets

    logger.debug(MSG.DEBUG.CREATE_TARGET_FOR,
        source.name, ref, path.join(constants.DIRECTORY.CONTENT, sourceDir, ref));

    return target;
};

