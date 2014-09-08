'use strict';

var util = require('util'),
    md = require('marked');

/**
 * Custom renderer for marked parser
 */
module.exports = (function () {
    var r = new md.Renderer();

    /**
     * Fix marked issue with cyrillic symbols replacing
     *
     * @param {String} text of header
     * @param {Number} level index of header
     * @param {String} raw
     * @param {Object} options
     * @returns {String} - result header string
     */
    r.heading = function (text, level, raw, options) {
        var specials = ['-', '[', ']', '/', '{', '}',
            '(', ')', '*', '+', '?', '.', '\\', '^', '$', '|', 's', '\'', '\"'];

        options = options || {};
        options.headerPrefix = options.headerPrefix || '';

        return util.format('<h%s id="%s%s">%s</h%s>\n', level, options.headerPrefix,
            raw.replace(new RegExp('[' + specials.join('\\') + ']', 'g'), '-'), text, level);
    };

    return {
        get: function () {
            return r;
        }
    };
})();
