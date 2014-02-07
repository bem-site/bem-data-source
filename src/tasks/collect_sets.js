/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    q = require('q'),
    q_io = require('q-io/fs'),

    constants = require('../constants'),
    libs = require('../libs'),
    logger = libs.logger(module),
    u = libs.util;

var MSG = {
    INFO: {
        START:  '-- collect sets start --',
        END:  '-- collect sets end --'
    },
    DEBUG: {
        READ_MARKDOWNS: 'read markdown files for library %s %s',
        READ_LEVELS: 'read level directories for library %s %s',
        WRITE_RESULT_TO_FILE: 'write result to file'
    }
};

module.exports = function(target) {

    var result = {
        repo: target.source.name,
        ref: target.ref
    };

    logger.info(MSG.INFO.START);

    return readMarkdownFilesForLibrary(target, result)
        .then(function() {
            return readLevelsForLibrary(target, result);
        })
        .then(function() {
            return writeResultToFile(target, result);
        })
        .then(function() {
            logger.info(MSG.INFO.END);
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
    logger.debug(MSG.DEBUG.READ_MARKDOWNS, target.source.name, target.ref);

    var mdTargets = {
        changelog: 'changelog.md',
        migration: 'MIGRATION.md',
        readme: 'README.md'
    };

    return q.allSettled(Object.keys(mdTargets)
        .map(function(key) {
            return q_io
                .read(path.join(target.outputPath, mdTargets[key]))
                .then(
                    function(content) {
                        try {
                            result[key] = u.mdToHtml(content);
                        }catch(e) {
                            result[key] = null;
                        }
                    },
                    function() {
                        result[key] = null;
                    }
                );
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
    logger.debug(MSG.DEBUG.READ_LEVELS, target.source.name, target.ref);

    return u.getDirsAsync(path.resolve(target.outputPath))
        .then(function(levels) {
            return q.allSettled(levels.map(function(level) {
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

    return u.getDirsAsync(path.resolve(target.outputPath, level.name))
        .then(function(blocks) {
            return q.allSettled(
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

    return q.allSettled(Object.keys(blockTargets)
        .map(function(key) {
            return q_io
                .read(
                    path.resolve(
                        target.outputPath,
                        level.name,
                        block.name,
                        util.format(blockTargets[key], block.name)
                    )
                )
                .then(
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
            }
        )
    );
};

/**
 * Save result model into json file
 * @param target - {Object} target object
 * @param result - {Object} result model
 * @returns {*}
 */
var  writeResultToFile = function(target, result) {
    logger.debug(MSG.DEBUG.WRITE_RESULT_TO_FILE);
    return q_io.write(path.resolve(target.outputPath, constants.FILE.DATA), JSON.stringify(result, null, 4), { charset: 'utf8' });
};