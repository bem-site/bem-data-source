var md = require('marked');

var renderer;

/**
 * Creates custom renderer for markdown parsing
 * @returns {marked.Renderer}
 */
function createRenderer() {
    renderer = new md.Renderer();

    /**
     * Fix marked issue with cyrillic symbols replacing
     * @param text - {String} test of header
     * @param level - {Number} index of header
     * @param raw
     * @param options - {Object} options
     * @returns {String} - result header string
     */
    renderer.heading = function(text, level, raw, options) {
        var specials = ['-','[',']','/','{','}','(',')','*','+','?','.','\\','^','$','|','\ ','\'','\"'];

        options = options || {};
        options.headerPrefix = options.headerPrefix || '';

        return '<h' + level + ' id="' + options.headerPrefix
            + raw.replace(RegExp('[' + specials.join('\\') + ']', 'g'), '-') + '">'
            + text + '</h' + level + '>\n';
    };

    return renderer;
}

exports.getRenderer = function() {
    return renderer || createRenderer();
};
