module.exports = {
    default: {
        builder: 'enb',
        docDirs: '*.docs',
        rsync: {
            levels: ['desktop', 'touch'],
            targets: ['*.examples', '*.pages'],
            exclude: ['*.bemdecl.js', '*.browser.bemhtml.js', '*.browser.js',
            '*.deps.js', '*.js-js.bemdecl.js', '*.js.bemdecl.js', '*.js.deps.js', '*.pre.js',
            '*.template.bemdecl.js', '*.template.deps.js']
        },
        showcase: {
            title: 'showcase',
            path: 'desktop.pages/showcase/showcase.html'
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
        }
    }
};
