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
        },
        'islands-components': {
            folder: "releases",
            pattern: "changelog.md"
        },
        'islands-user': {
            folder: "releases",
            pattern: "changelog.md"
        },
        'islands-page': {
            folder: "releases",
            pattern: "changelog.md"
        },
        'islands-services': {
            folder: "releases",
            pattern: "changelog.md"
        },
        'islands-search': {
            folder: "releases",
            pattern: "changelog.md"
        },
        'islands-icons': {
            folder: "releases",
            pattern: "changelog.md"
        }
    };
};

exports.getMigration = function() {
    return {
        'islands-components': {
            folder: "releases",
            pattern: "MIGRATION.md"
        },
        'islands-user': {
            folder: "releases",
            pattern: "MIGRATION.md"
        },
        'islands-page': {
            folder: "releases",
            pattern: "MIGRATION.md"
        },
        'islands-services': {
            folder: "releases",
            pattern: "MIGRATION.md"
        },
        'islands-search': {
            folder: "releases",
            pattern: "MIGRATION.md"
        },
        'islands-icons': {
            folder: "releases",
            pattern: "MIGRATION.md"
        }};
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