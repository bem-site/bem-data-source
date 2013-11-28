var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config');

var FILE_PACKAGE_JSON = 'package.json',
    DIR_NODE_MODULES = 'node_modules',
    DIR_LIBS = 'libs',
    TASK_TYPE_LIBS = 'libs',
    TASK_TYPE_DOCS = 'docs';

var execute = function(sources) {
    LOGGER.info('create targets start');

    var rootPath = config.get('contentDirectory'),
        targets = [],
        def = Q.defer();

    try{
        sources.forEach(function(source) {
            var sourceDir = source.targetDir || source.name,
                existedTagsAndBranches = U.getDirs(PATH.join(rootPath, sourceDir)),

                createTarget = function(item) {
                    source.type == TASK_TYPE_LIBS &&
                        targets.push(createLibTarget(rootPath, sourceDir, existedTagsAndBranches, source, item));
                    source.type == TASK_TYPE_DOCS &&
                        targets.push(createDocTarget(rootPath, sourceDir, existedTagsAndBranches, source, item));
                };


            source.tags.forEach(createTarget);
            source.branches.forEach(createTarget);
        });

        def.resolve(targets);

    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};

/**
 * Creates target for library source
 * @param rootPath - {String} root path for resources
 * @param sourceDir - {String} name of target directory
 * @param existedRefDirs - {Array} array of directories which are already exists on filesystem
 * @param source - {Object} source
 * @param ref - {String} name of tag or branch
 */
var createLibTarget = function(rootPath, sourceDir, existedRefDirs, source, ref) {
    var packageJsonExist = U.isFile(PATH.join(rootPath, sourceDir, ref, FILE_PACKAGE_JSON)),
        nodeModulesExist = U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_NODE_MODULES)),
        libsExist = U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_LIBS)),
        target = {
            name: UTIL.format('%s %s', source.name, ref),
            url: source.url,
            ref: ref,
            type: source.type,
            path: PATH.join(rootPath, sourceDir, ref),
            taskGitClone: true,
            taskNpmInstall: true,
            taskMakeLibs: true,
            taskMakeSets: true
        };

    if(_.indexOf(existedRefDirs, ref) > -1) {
        target.taskGitClone = false;
    }

    if(!target.taskGitClone && packageJsonExist && nodeModulesExist) {
        target.taskNpmInstall = false;
    }

    if(!target.taskNpmInstall && libsExist) {
        target.taskMakeLibs = false;
    }

    LOGGER.info(UTIL.format('create lib target for source: %s with ref %s into directory %s',
        source.name, ref, PATH.join(rootPath, sourceDir, ref)));

    return target;
};

/**
 * Creates target for documentation source
 * @param rootPath - {String} root path for resources
 * @param sourceDir - {String} name of target directory
 * @param existedRefDirs - {Array} array of directories which are already exists on filesystem
 * @param source - {Object} source
 * @param ref - {String} name of tag or branch
 */
var createDocTarget = function(rootPath, sourceDir, existedRefDirs, source, ref) {
    var target = {
            name: UTIL.format('%s %s', source.name, ref),
            url: source.url,
            ref: ref,
            type: source.type,
            path: PATH.join(rootPath, sourceDir, ref),
            taskClear: true,
            taskGitClone: true,
            taskMakeDocs: true
        };

    if(!source.force) {
        target.taskClear = false;

        if(_.indexOf(existedRefDirs, ref) > -1) {
            target.taskGitClone = false;
        }
    }

    LOGGER.info(UTIL.format('create doc target for source: %s with ref %s into directory %s',
        source.name, ref, PATH.join(rootPath, sourceDir, ref)));

    return target;
};

module.exports = execute;

