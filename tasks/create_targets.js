var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config'),
    git = require('../libs/git'),
    util = require('../libs/util');

var execute = function(sources) {
    LOGGER.info('run commands start');

    var rootPath = config.get('contentDirectory'),
        targets = [],
        def = Q.defer();

    try{
        sources.forEach(function(source) {
            var sourceDir = source.dir || source.name,
                existedTagsAndBranches = U.getDirs(PATH.join(rootPath, sourceDir)),

                createTargets = function(item) {
                    var packageJsonExist = U.isFile(PATH.join(rootPath, sourceDir, item, 'package.json')),
                        nodeModulesExist = U.isDirectory(PATH.join(rootPath, sourceDir, item, 'node_modules')),
                        libsExist = U.isDirectory(PATH.join(rootPath, sourceDir, item, 'libs')),
                        target = {
                            name: UTIL.format('%s %s', source.name, item),
                            url: source.url,
                            ref: item,
                            path: PATH.join(rootPath, sourceDir, item),
                            taskGitClone: true,
                            taskNpmInstall: true,
                            taskMakeLibs: true,
                            taskMakeSets: true
                        };

                    if(_.indexOf(existedTagsAndBranches, item) > -1) {
                        LOGGER.finfo('target source: %s %s ref %s into dir %s',
                            source.name, source.url, item, PATH.join(rootPath, sourceDir, item));
                        target.taskGitClone = false;
                    }

                    if(!target.taskGitClone && packageJsonExist && nodeModulesExist) {
                        target.taskNpmInstall = false;
                    }

                    if(!target.taskNpmInstall && libsExist) {
                        target.taskMakeLibs = false;
                    }

                    targets.push(target);
                };


            source.tags.forEach(createTargets);
            source.branches.forEach(createTargets);
        });

        def.resolve(targets);

    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};

module.exports = execute;

