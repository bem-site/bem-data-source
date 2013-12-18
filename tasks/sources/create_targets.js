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
    commands = require('../cmd'),
    makeDocs = require('../target/make_docs'),
    clear = require('../target/clear'),
    collectSets = require('../target/collect_sets');

var FILE_PACKAGE_JSON = 'package.json',
    DIR_NODE_MODULES = 'node_modules',
    DIR_LIBS = 'libs',
    TASK_TYPE_LIBS = 'libs',
    TASK_TYPE_DOCS = 'docs';

var execute = function(sources) {
    LOGGER.info('step5: - createTargets start');

    var def = Q.defer();
    try{
        var rootPath = config.get('contentDirectory'),
            targets = [];

        sources.forEach(function(source) {
            var sourceDir = source.targetDir || source.name,
                existed = U.getDirs(PATH.join(rootPath, sourceDir));

            ['tags', 'branches'].forEach(function(type) {
                source[type].forEach(function(item) {
                    targets.push(createTarget.apply(null, [source, item, rootPath, sourceDir, existed, type]));
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

    var sourceTypes = source.type;

    if(!sourceTypes) {
        LOGGER.error(UTIL.format('can not create target for source: %s with ref %s into directory %s because source type is not defined',
            source.name, ref, PATH.join(rootPath, sourceDir, ref)));
        return null;
    }

    if(!_.isArray(sourceTypes)) {
        if(_.isString(sourceTypes)) {
            sourceTypes = [sourceTypes];
        }else{
            LOGGER.error(UTIL.format('can not create target for source: %s with ref %s into directory %s because source type is not array or string',
                source.name, ref, PATH.join(rootPath, sourceDir, ref)));
            return null;
        }
    }

    if(_.intersection(sourceTypes, [TASK_TYPE_LIBS, TASK_TYPE_DOCS]).length === 0) {
        LOGGER.error(UTIL.format('can not create target for source: %s with ref %s into directory %s because source type is not allowed',
            source.name, ref, PATH.join(rootPath, sourceDir, ref)));
        return null;
    }

    if(sourceTypes.indexOf(TASK_TYPE_DOCS) > -1) {
        target.tasks.push(makeDocs);
        target.path = PATH.join(rootPath, TASK_TYPE_DOCS, sourceDir, ref);
        target.docDirs = source.docDirs;
    }

    if(sourceTypes.indexOf(TASK_TYPE_LIBS) > -1) {
        target.path = PATH.join(rootPath, TASK_TYPE_LIBS, sourceDir, ref);

        var needNpmInstall = !U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_NODE_MODULES)),
            needBemMakeLibs = !U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_LIBS));

        //check if npm install command is needed for execution
        if(needNpmInstall) {
            target.tasks.push(commands.npmInstall);
        }

        //check if bem make libs command is needed for execution
        if(needBemMakeLibs) {
            target.tasks.push(commands.bemMakeLibs);
        }

        //add bem make sets command to scenario
        target.tasks.push(commands.bemMakeSets);

        //add collect sets task to scenario
        //target.tasks.push(collectSets);
    }

    LOGGER.debug(UTIL.format('create target for source: %s with ref %s into directory %s',
        source.name, ref, PATH.join(rootPath, sourceDir, ref)));

    return target;
};

module.exports = execute;

