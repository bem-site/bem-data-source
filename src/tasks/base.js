var inherit = require('inherit'),
    Logger = require('../logger');

module.exports = inherit({

    _target: undefined,
    _logger: undefined,

    __constructor: function (target) {
        this._target = target;
        this._logger = new Logger(module, this._target.getOptions()['logLevel']);
    },

    run: function () {
        this._logger.debug('Execute base task');
    }
});
