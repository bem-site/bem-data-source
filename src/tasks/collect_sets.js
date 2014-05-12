/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    pattern = require('../../config/pattern'),
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

    var mdTargets  = {
            readme: 'README.md',
            changelog: pattern.getChangelog()[target.getSourceName()] || 'changelog.md',
            migration: pattern.getMigration()[target.getSourceName()] || 'MIGRATION.md'
        };

        return vow.allResolved(Object.keys(mdTargets)
            .map(function(key) {
                var onReadFileSuccess = function(content) {
                        try {
                            result[key] = u.mdToHtml(content);
                        }catch(e) {
                            result[key] = null;
                        }
                    },
                    onReadFileError = function() {
                        result[key] = null;
                    };

                if(_.isObject(mdTargets[key])) {
                    return vowFs
                        .listDir(path.join(target.getContentPath(), mdTargets[key].folder))
                        .then(function(files) {
                            return files.filter(function(file) {
                                return file.indexOf(mdTargets[key].pattern) !== -1;
                            }).pop();
                        })
                        .then(function(file) {
                            return vowFs
                                .read(path.join(target.getContentPath(), mdTargets[key].folder, file), 'utf-8')
                                .then(onReadFileSuccess, onReadFileError);
                        });
                }else {
                    return vowFs
                        .read(path.join(target.getContentPath(), mdTargets[key]), 'utf-8')
                        .then(onReadFileSuccess, onReadFileError);
                }


            })
        );
};

/**
 * Scan level directories for library
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
var readLevelsForLibrary = function(target, result) {
    logger.debug('read level directories for library %s', target.getName());

    return vowFs.listDir(path.resolve(target.getOutputPath()))
        .then(function(levels) {
            levels = levels.filter(function(item) {
                return item.indexOf(".sets") !== -1;
            });

            return vow.allResolved(levels.map(function(level) {
                level = { name: level };
                result.levels = result.levels || [];
                result.levels.push(level);

                return readBlocksForLevel(target, result, level);
            }));
        });
};

/**
 * Scan block directories for level
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @param level - {Object} level
 * @returns {*}
 */
var readBlocksForLevel = function(target, result, level) {
    var blockIgnores = ['.bem', 'index', 'catalogue', 'index', 'jscatalogue'];

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
};

/**
 * Read data files for single block
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @param level - {Object} level
 * @param block - {Object} block
 * @returns {*}
 */
var readDataForBlock = function(target, result, level, block) {
    var blockTargets = {
        data: '%s.data.json',
        jsdoc: '%s.jsdoc.json'
    };

    return vow.allResolved(Object.keys(blockTargets).map(function(key) {
        return vowFs.read(path.resolve(target.getOutputPath(),
            level.name, block.name, util.format(blockTargets[key], block.name)), 'utf-8').then(
                function(content) {
                    try {
                        block[key] = JSON.parse(content);
                    } catch(e) {
                        block[key] = null;
                    }
                },
                function() {
                    block[key] = null;
                }
            );
        })
    );
};

/**
 * Save result model into json file
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
var writeResultToFile = function(target, result) {
    logger.debug('write result of target %s to file %s', target.getName(),
        path.resolve(target.getOutputPath(), constants.FILE.DATA));

    return vowFs.write(path.resolve(target.getOutputPath(), constants.FILE.DATA),
        JSON.stringify(result, null, 4), { charset: 'utf8' });
};
