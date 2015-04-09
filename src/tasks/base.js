var inherit = require('inherit'),
    Logger = require('bem-site-logger');

module.exports = inherit({

    _target: undefined,
    _logger: undefined,

    __constructor: function (target) {
        this._target = target;
        this._logger = Logger.setOptions(target.getOptions()['logger']).createLogger(module);
    },

    run: function () {
        this._logger.debug('Execute base task');
        return true;
    }
});
