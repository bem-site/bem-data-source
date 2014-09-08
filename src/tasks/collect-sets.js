'use strict';

var util = require('util'),
    path =require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    config = require('../config'),
    logger = require('../logger'),
    api = require('../gh-api'),
    constants = require('../constants'),
    utility = require('../util');

module.exports = function(target) {
    logger.info('-- collect sets start --');

    var result = target.createSetsResultBase();
    return readMDFilesForLibrary(target, result)
        .then(function() { return readDependencies(target, result); })
        .then(function() { return readLevelsForLibrary(target, result); })
        .then(function() { return writeResultToFile(target, result); })
        .then(function() {
            logger.info('-- collect sets end --', module);
            return this;
        }, target);
};

/**
 * Read markdown files for library and compile them into html
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @returns {*}
 */
function readMDFilesForLibrary(target, result) {
    logger.debug(util.format('read markdown files for library %s', target.getName()), module);
    return vow.allResolved(Object.keys(target.getMdTargets())
            .map(function(key) {
                var folder = this.getMdTargets()[key].folder,
                    fn = _.isUndefined(folder) ? loadMDFromRemote : loadMDFromFile;
                return fn.call(null, this, result.docs, key);
            }, target)
    );
}

/**
 * Reads markdown files from filesystem
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @param key - {String} key with name of markdown doc
 * @returns {*}
 */
function loadMDFromFile(target, result, key) {
    return vowFs
        .listDir(path.join(target.getContentPath(), target.getMdTargets()[key].folder))
        .then(function(files) {
            var languages = config.get('languages') || ['en'],
                pattern = target.getMdTargets()[key].pattern;

            if(!_.isObject(pattern)) {
                pattern = languages.reduce(function(prev, lang) {
                    prev[lang] = pattern;
                    return prev;
                }, {});
            }

            result[key] = {
                title: target.getTitles()[key],
                content: null
            };

            return vow.allResolved(Object.keys(pattern).map(function(lang) {
                var file  = files.filter(function(file) {
                    return file.indexOf(pattern[lang]) !== -1;
                }).pop();

                return vowFs
                    .read(path.join(path.join(target.getContentPath(),
                        target.getMdTargets()[key].folder), file), 'utf-8')
                    .then(function(content) {
                        try {
                            result[key].content = result[key].content || {};
                            result[key].content[lang] = utility.mdToHtml(content);
                        }catch(e) {}
                    });
            }));
        });
}

/**
 * Reads markdown files from remote github repo via Github API
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @param key - {String} key with name of markdown doc
 * @returns {*}
 */
function loadMDFromRemote(target, result, key) {
    var languages = config.get('languages') || ['en'],
        pattern = target.getMdTargets()[key].pattern;

    if(!_.isObject(pattern)) {
        pattern = languages.reduce(function(prev, lang) {
            prev[lang] = pattern;
            return prev;
        }, {});
    }

    result[key] = {
        title: target.getTitles()[key],
        content: null
    };

    return vow.allResolved(Object.keys(pattern).map(function(lang) {
        var repo = (function(s) {
            var ps = s.match(/^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/);
            return {
                isPrivate: ps[1].indexOf('yandex') > -1,
                user: ps[2],
                repo: ps[3],
                ref:  ps[5],
                path: ps[6]
            };
        })(pattern[lang]);

        return api.getContent(repo)
            .then(function(data) {
                if(data.res) {
                    try {
                        result[key].content = result[key].content || {};
                        result[key][lang] = utility.mdToHtml((new Buffer(data.res.content, 'base64')).toString());
                    } catch(err) {}
                }
            });
    }));
}

/**
 * Reads library dependencies from bower.json file
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @returns {*}
 */
function readDependencies(target, result) {
    return vowFs.read(path.resolve(target.getContentPath(), 'bower.json'),'utf-8')
        .then(function(content) {
            try {
                content = JSON.parse(content);
                result.deps = content.dependencies;
            }catch(e) {
                result.deps = null;
            }
        })
        .fail(function() {
            result.deps = null;
        });
}

/**
 * Scan level directories for library
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @returns {*}
 */
function readLevelsForLibrary(target, result) {
    logger.debug(util.format('read level directories for library %s', target.getName()), module);

    return vowFs.listDir(path.resolve(target.getOutputPath()))
        .then(function(levels) {
            var levelNames = ['desktop', 'touch-pad', 'touch-phone'].map(function(item) {
                return item + target.getDocPatterns().replace('*', '');
            });

            levels = levels.filter(function(item) {
                return levelNames.indexOf(item) !== -1;
            });

            return vow.allResolved(levels.map(function(level) {
                level = { name: level };
                result.levels = result.levels || [];
                result.levels.push(level);

                return readBlocksForLevel(target, level);
            }));
        });
}

/**
 * Scan block directories for level
 * @param target - {Target} target model
 * @param level - {Object} level
 * @returns {*}
 */
function readBlocksForLevel(target, level) {
    var blockIgnores = ['.dist', '.bem', 'index', 'catalogue', 'index', 'jscatalogue'];

    return vowFs.listDir(path.resolve(target.getOutputPath(), level.name))
        .then(function(blocks) {
            return vow.allResolved(
                blocks
                    .filter(function(block) {
                        return blockIgnores.indexOf(block) === -1;
                    })
                    .map(function(block) {
                        block = { name: block };
                        level.blocks = level.blocks || [];
                        level.blocks.push(block);

                        return readDataForBlock(this, level, block);
                    }, this)
            );
        }, target);
}

/**
 * Read data files for single block
 * @param target - {Target} target model
 * @param level - {Object} level
 * @param block - {Object} block
 * @returns {*}
 */
function readDataForBlock(target, level, block) {
    return vow.allResolved(Object.keys(target.getBlockTargets()).map(function(key) {
            return vowFs.read(path.resolve(this.getOutputPath(),level.name, block.name,
                util.format(this.getBlockTargets()[key], block.name)), 'utf-8')
                .then(function(content) {
                    try {
                        block[key] = JSON.parse(content);
                    }catch(e) {
                        block[key] = content;
                    }
                })
                .fail(function() {
                    block[key] = null;
                });
        }, target)
    );
}

/**
 * Save result model into json file
 * @param target - {Target} target model
 * @param result - {Object} result model
 * @returns {*}
 */
function writeResultToFile(target, result) {
    logger.debug(util.format('write result of target %s to file %s', target.getName(),
        path.resolve(target.getOutputPath(), constants.FILE.DATA)), module);

    return vowFs.write(path.resolve(target.getOutputPath(), constants.FILE.DATA),
        JSON.stringify(result, null, 4), { charset: 'utf8' });
}
