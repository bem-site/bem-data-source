var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
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
        this._logger.info('read level directories for library %s', this._target.name);

        return vowFs.listDir(path.resolve(this._target.getContentPath()))
            .then(function (levels) {
                var promises = _.chain(constants.LEVELS)
                    .map(function (item) {
                        return item + this._target.docPatterns.replace('*', '');
                    }, this)
                    .thru(function (levelNames) {
                        return levels.filter(function (item) {
                            return levelNames.indexOf(item) !== -1;
                        });
                    })
                    .map(function (level) {
                        this._logger.debug('Read block level %s', level);
                        level = { name: level };
                        result.levels = result.levels || [];
                        result.levels.push(level);

                        return this._readBlocks(level);
                    }, this)
                    .value();

                return vow.allResolved(promises);
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
        return vowFs.listDir(path.resolve(this._target.getContentPath(), level.name))
            .then(function (blocks) {
                var promises = _.chain(blocks)
                    .filter(function (block) {
                        return blockIgnores.indexOf(block) === -1;
                    })
                    .map(function (block) {
                        this._logger.verbose('Read block %s', block);
                        block = { name: block };
                        level.blocks = level.blocks || [];
                        level.blocks.push(block);

                        return this._readBlock(level, block);
                    }, this)
                    .value();

                return vow.allResolved(promises);
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
                var docFile = path.resolve(this._target.getContentPath(), level.name, block.name,
                    util.format(this._target.blockTargets[key], block.name));
                this._logger.verbose('Read doc file: %s', docFile);
                return vowFs.read(docFile, 'utf-8')
                    .then(function (content) {
                        try { block[key] = JSON.parse(content); } catch (e) { block[key] = content; }
                    })
                    .fail(function () {
                        block[key] = null;
                    });
            }, this)
        );
    }
});
