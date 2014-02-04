/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    constants = require('../constants'),
    logger = require('../libs/logger')(module),
    commands = require('./cmd'),
    clear = require('./clear'),
    collectSets = require('./collect_sets');


module.exports = {

    run: function(sources) {
        logger.info('step5: - createTargets start');

        var def = q.defer(),
            targets = [];

        try{
            q.allSettled(
                sources.map(function(source) {
                    var sourceDir = source.targetDir || source.name;

                    return q_io.list(path.join(constants.DIRECTORY.CONTENT, sourceDir)).finally(
                        function(existed) {
                            ['tags', 'branches'].forEach(function(type) {
                                source[type].forEach(function(ref) {
                                    targets.push(createTarget.apply(null, [source, ref, sourceDir, existed || [], type]));
                                });
                            });
                        }
                    );
                })
            ).then(function() {
                def.resolve(targets);
            });
        }catch(err) {
            logger.error(err.message);
            def.reject(err);
        }finally {
            logger.info('step5: - createTargets end');
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
            path: path.join(constants.DIRECTORY.CONTENT, sourceDir, ref),
            url: source.url,
            ref: ref,
            type: type,
            tasks: []
        };

    //check if directory for current ref and current source is not exist
    //in this case add git clone task to scenario
    if(_.indexOf(existed, ref) === -1) {
        target.tasks.push(commands.gitClone);
    }

    target.tasks.push(commands.npmInstall);
    target.tasks.push(commands.bemMakeLibs);
    target.tasks.push(commands.bemMakeSets);

    //add collect sets task to scenario
    //target.tasks.push(collectSets);

    logger.debug('create target for source: %s with ref %s into directory %s',
        source.name, ref, path.join(constants.DIRECTORY.CONTENT, sourceDir, ref));

    return target;
};

