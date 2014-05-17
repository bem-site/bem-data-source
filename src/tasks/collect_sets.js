'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),
    libs = require('../libs'),
    logger = libs.logger(module),
    u = libs.util;

module.exports = function(target) {

    var result = target.createSetsResultBase();

    logger.info('-- collect sets start --');

    return readMarkdownFilesForLibrary(target, result)
        .then(function() { return readLevelsForLibrary(target, result); })
        .then(function() { return writeResultToFile(target, result); })
        .then(function() {
            logger.info('-- collect sets end --');
            return target;
        });
};

/**
 * Read markdown files for library and compile them into html
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
var readMarkdownFilesForLibrary = function(target, result) {
    logger.debug('read markdown files for library %s', target.getName());

    return vow.allResolved(Object.keys(target.getMdTargets())
        .map(function(key) {
            return vowFs
                .listDir(path.join(target.getContentPath(), target.getMdTargets()[key].folder))
                .then(function(files) {
                    var pattern = target.getMdTargets()[key].pattern;

                    if(!_.isObject(pattern)) {
                        pattern = {
                            en: pattern,
                            ru: pattern
                        };
                    }

                    result[key] = null;

                    return vow.allResolved(Object.keys(pattern).map(function(lang) {
                        var file  = files.filter(function(file) {
                            return file.indexOf(pattern[lang]) !== -1;
                        }).pop();

                        return vowFs
                            .read(path.join(target.getContentPath(), target.getMdTargets()[key].folder, file), 'utf-8')
                            .then(
                                function(content) {
                                    try {
                                        result[key] = result[key] || {};
                                        result[key][lang] = u.mdToHtml(content);
                                    } catch(e) {}
                                },
                                function() {}
                            );
                    }));
                });
        })
    );
},

/**
 * Scan level directories for library
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
readLevelsForLibrary = function(target, result) {
    logger.debug('read level directories for library %s', target.getName());

    return vowFs.listDir(path.resolve(target.getOutputPath()))
        .then(function(levels) {
            levels = levels.filter(function(item) {
                return item.indexOf('.sets') !== -1;
            });

            return vow.allResolved(levels.map(function(level) {
                level = { name: level };
                result.levels = result.levels || [];
                result.levels.push(level);

                return readBlocksForLevel(target, result, level);
            }));
        });
},

/**
 * Scan block directories for level
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @param level - {Object} level
 * @returns {*}
 */
readBlocksForLevel = function(target, result, level) {
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

                        return readDataForBlock(target, result, level, block);
                    })
            );
        });
},

/**
 * Read data files for single block
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @param level - {Object} level
 * @param block - {Object} block
 * @returns {*}
 */
readDataForBlock = function(target, result, level, block) {

    return vow.allResolved(Object.keys(target.getBlockTargets()).map(function(key) {
        return vowFs.read(path.resolve(target.getOutputPath(),
            level.name, block.name, util.format(target.getBlockTargets()[key], block.name)), 'utf-8').then(
                function(content) {
                    try {
                        block[key] = JSON.parse(content);
                    }catch(e) {
                        block[key] = content;
                    }
                },
                function() {
                    block[key] = null;
                }
            );
        })
    );
},

/**
 * Save result model into json file
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
writeResultToFile = function(target, result) {
    logger.debug('write result of target %s to file %s', target.getName(),
        path.resolve(target.getOutputPath(), constants.FILE.DATA));

    return vowFs.write(path.resolve(target.getOutputPath(), constants.FILE.DATA),
        JSON.stringify(result, null, 4), { charset: 'utf8' });
};
