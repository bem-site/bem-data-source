const   UTIL = require('util'),

        //bem tools modules
        BEM = require('bem'),
        Q = BEM.require('q'),
        LOGGER = BEM.require('./logger'),
        U = BEM.require('./util'),
        PATH = BEM.require('./path'),
        _ = BEM.require('underscore'),

        //application modules
        config = require('../config/config'),
        commands = require('../tasks/cmd'),
        makeDocs = require('../tasks/make_docs'),
        clear = require('../tasks/clear');

const   FILE_PACKAGE_JSON = 'package.json',
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
                existed = U.getDirs(PATH.join(rootPath, sourceDir)),

                ct = function(item) {
                    targets.push(createTarget.apply(null, [source, item, rootPath, sourceDir, existed]));
                };

            source.tags.forEach(ct);
            source.branches.forEach(ct);
        });

        def.resolve(_.compact(targets));

    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};

/**
 * Creates target for tag or branch of current source
 * @param args - {Array} of arguments with elements:
 * [0] - {Object} source object
 * [1] - {String} name of tag or branch
 * [2] - {String} root path of content directory
 * [3] - {String} source directory (name of directory where source should be cloned. By default it equal to repository name)
 * [4] - {Array} array of directories corresponded to tags or branches of current source
 * @returns {*}
 */
var createTarget = function() {
    var source = arguments[0],
        ref = arguments[1],
        rootPath = arguments[2],
        sourceDir = arguments[3],
        existed = arguments[4],

        target = {
            name: UTIL.format('%s %s', source.name, ref),
            url: source.url,
            ref: ref,
            path: PATH.join(rootPath, sourceDir, ref),
            tasks: []
        };

    //check if directory for current ref and current source is not exist
    //in this case add git clone task to scenario
    if(_.indexOf(existed, ref) == -1) {
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

    if(_.intersection(sourceTypes, [TASK_TYPE_LIBS, TASK_TYPE_DOCS]).length == 0) {
        LOGGER.error(UTIL.format('can not create target for source: %s with ref %s into directory %s because source type is not allowed',
            source.name, ref, PATH.join(rootPath, sourceDir, ref)));
        return null;
    }

    if(sourceTypes.indexOf(TASK_TYPE_DOCS) > -1) {
        target.tasks.push(makeDocs);

        target.docDirs = source.docDirs;
    }

    if(sourceTypes.indexOf(TASK_TYPE_LIBS) > -1) {
        var packageJsonExist = U.isFile(PATH.join(rootPath, sourceDir, ref, FILE_PACKAGE_JSON)),
            nodeModulesExist = U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_NODE_MODULES)),
            libsExist = U.isDirectory(PATH.join(rootPath, sourceDir, ref, DIR_LIBS));

        //check if npm install command is needed for execution
        if(target.tasks.indexOf(commands.gitClone) == -1 && packageJsonExist && !nodeModulesExist) {
            target.tasks.push(commands.npmInstall);
        }

        //check if bem make libs command is needed for execution
        if(!libsExist) {
            target.tasks.push(commands.bemMakeLibs);
        }

        //add bem make sets command to scenario
        target.tasks.push(commands.bemMakeSets);
    }

    LOGGER.info(UTIL.format('create target for source: %s with ref %s into directory %s',
        source.name, ref, PATH.join(rootPath, sourceDir, ref)));

    return target;
};

module.exports = execute;

