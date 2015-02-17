module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production magic run docs examples',
        docDirs: '*.docs',
        rsync: {
            levels: ['desktop', 'touch'],
            targets: ['*.examples'],
            exclude: ['*.bemdecl.js', '*.browser.bemhtml.js', '*.browser.js',
            '*.deps.js', '*.js-js.bemdecl.js', '*.js.bemdecl.js', '*.js.deps.js', '*.pre.js',
            '*.template.bemdecl.js', '*.template.deps.js']
        },
        docs: {
            readme: {
                folder: '',
                pattern: {
                    en: 'README.md',
                    ru: 'README.ru.md'
                }
            },
            changelog: {
                folder: '',
                pattern: 'CHANGELOG.md'
            },
            migration: {
                folder: '',
                pattern: 'MIGRATION.md'
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
        },
        tasks: [
            require('../src/tasks/collect-sets')
        ]
    }
};
