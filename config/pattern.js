'use strict';

exports.getChangelog = function() {
    return {
        'bem-core': {
            folder: '',
            pattern: 'CHANGELOG.md'
        },
        'bem-components': {
            folder: '',
            pattern: 'CHANGELOG.md'
        }
    };
};

exports.getMigration = function() {
    return {};
};

exports.getPattern = function() {
    return {
        'bem-bl': {
            "data": "%s.data.json",
            "jsdoc": "%s.js-doc.html"
        },
        'bem-core': {
            "data": "%s.data.json",
            "jsdoc": "%s.js-doc.html"
        },
        'bem-components': {
            "data": "%s.data.json",
            "jsdoc": "%s.js-doc.html"
        }
    }
};