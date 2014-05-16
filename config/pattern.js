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
    };
};

exports.getRegistry = function() {
    return {
        'bem-mvc': 'https://registry.npmjs.org',
        'bem-core': 'https://registry.npmjs.org',
        'bem-components': 'https://registry.npmjs.org',
        'bem-bl': 'https://registry.npmjs.org'
    };
};