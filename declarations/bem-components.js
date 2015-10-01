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
            title: {
                en: 'Showcase',
                ru: 'Витрина'
            },
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
                pattern: {
                    en: 'CHANGELOG.md',
                    ru: 'CHANGELOG.ru.md'
                }
            },
            migration: {
                folder: '',
                pattern: {
                    en: 'MIGRATION.md',
                    ru: 'MIGRATION.ru.md'
                }
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json',
            blocksData: '%s.source-files.json',
            examplesData: '%s.examples-files.json'
        }
    }
};
