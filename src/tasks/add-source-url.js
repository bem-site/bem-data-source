var inherit = require('inherit'),
    Base = require('./base');

module.exports = inherit(Base, {
    /**
     * Store sourceUrl
     * @param {Object} result model
     * @returns {*}
     */
    run: function (result) {
        this._logger.info('Save sourceUrl for target %s', this._target.name);
        result.sourceUrl = this._target._source.sourceUrl;
        return result;
    }
});
