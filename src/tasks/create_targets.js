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
    config = require('../../config/config'),
    commands = require('cmd'),
    clear = require('target/clear');
    //collectSets = require('../target/collect_sets');


module.exports = {

    run: function(sources) {
        LOGGER.info('step5: - createTargets start');

        var def = Q.defer(),
            rootPath = config.get('contentDirectory'),
            targets = [];

        try{
            sources.forEach(function(source) {
                var sourceDir = source.targetDir || source.name,
                    existed = U.getDirs(PATH.join(rootPath, sourceDir));

                ['tags', 'branches'].forEach(function(type) {
                    source[type].forEach(function(ref) {
                        targets.push(createTarget.apply(null, [source, ref, rootPath, sourceDir, existed, type]));
                    });
                });
            });

            def.resolve(_.compact(targets));

        }catch(err) {
            LOGGER.error(err.message);
            def.reject(err);
        }finally {
            LOGGER.info('step5: - createTargets end');
        }
        return def.promise;
    }
};

/**
 * Creates target for tag or branch of current source
 * @param arguments - {Array} of arguments with elements:
 * [0] - {Object} source object
 * [1] - {String} name of tag or branch
 * [2] - {String} root path of content directory
 * [3] - {String} source directory (name of directory where source should be cloned. By default it equal to repository name)
 * [4] - {Array} array of directories corresponded to tags or branches of current source
 * [5] - {String} type of reference (tags or branches)
 * @returns {*}
 */
var createTarget = function() {
    var source = arguments[0],
        ref = arguments[1],
        rootPath = arguments[2],
        sourceDir = arguments[3],
        existed = arguments[4],
        type = arguments[5],

        target = {
            source: source,
            name: UTIL.format('%s %s', source.name, ref),
            path: PATH.join(rootPath, sourceDir, ref),
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

    LOGGER.debug(UTIL.format('create target for source: %s with ref %s into directory %s',
        source.name, ref, PATH.join(rootPath, sourceDir, ref)));

    return target;
};

