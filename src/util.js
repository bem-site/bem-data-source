'use strict';

var md = require('marked'),
    renderer = require('./renderer');

/**
 * Converts markdown content into html with marked module
 * @param {String} content of markdown file
 * @returns {String} - html string
 */
exports.mdToHtml = function (content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: renderer.get()
    });
};

/**
 * Separates array into small array with given chunkSize length
 * @param {Array} arr - array for separate
 * @param {Number} chunkSize - size of chunk
 * @returns {Array}
 */
exports.separateArrayOnChunks = function (arr, chunkSize) {
    var _arr = arr.slice(0),
        arrays = [];

    while (_arr.length > 0) {
        arrays.push(_arr.splice(0, chunkSize));
    }

    return arrays;
};
