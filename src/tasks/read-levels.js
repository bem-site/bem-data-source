var util = require('util'),
    path = require('path'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    constants = require('../constants'),
    Base = require('./base');

module.exports = inherit(Base, {

    /**
     * Scan level directories for library
     * @param {Object} result model
     * @returns {Object}
     * @private
     */
    run: function (result) {
        this._logger.debug('read level directories for library %s', this._target.name);

        return vowFs.listDir(path.resolve(this._target.contentPath))
            .then(function (levels) {
                var levelNames = constants.LEVELS.map(function (item) {
                    return item + this._target.docPatterns.replace('*', '');
                }, this);

                levels = levels.filter(function (item) {
                    return levelNames.indexOf(item) !== -1;
                });

                return vow.allResolved(levels.map(function (level) {
                    level = { name: level };
                    result.levels = result.levels || [];
                    result.levels.push(level);

                    return this._readBlocks(level);
                }, this));
            }, this)
            .then(function () {
                return result;
            });
    },

    /**
     * Scan block directories for level
     * @param {Object} level
     * @returns {*}
     * @private
     */
    _readBlocks: function (level) {
        var blockIgnores = ['.dist', '.bem', 'index', 'catalogue', 'index', 'jscatalogue'];
        return vowFs.listDir(path.resolve(this._target.contentPath, level.name))
            .then(function (blocks) {
                return vow.allResolved(
                    blocks
                        .filter(function (block) {
                            return blockIgnores.indexOf(block) === -1;
                        })
                        .map(function (block) {
                            block = { name: block };
                            level.blocks = level.blocks || [];
                            level.blocks.push(block);

                            return this._readBlock(level, block);
                        }, this)
                );
            }, this);
    },

    /**
     * Read data files for single block
     * @param {Object} level
     * @param {Object} block
     * @returns {*}
     * @private
     */
    _readBlock: function (level, block) {
        return vow.allResolved(Object.keys(this._target.blockTargets).map(function (key) {
                return vowFs.read(path.resolve(this._target.contentPath, level.name, block.name,
                    util.format(this.blockTargets[key], block.name)), 'utf-8')
                    .then(function (content) {
                        try {
                            block[key] = JSON.parse(content);
                        }catch (e) {
                            block[key] = content;
                        }
                    })
                    .fail(function () {
                        block[key] = null;
                    });
            }, this)
        );
    }
});
