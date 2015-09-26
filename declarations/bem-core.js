module.exports = {
    default: {
        builder: 'enb',
        docDirs: '*.docs',
        rsync: {
            levels: ['desktop', 'touch'],
            targets: ['*.docs', '*.examples']
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
        },
        custom: [
            {
                title: {
                    en: 'Documentation',
                    ru: 'Документация'
                },
                url: '/tags/{lib}-v2.3.0'
            }
        ]
    }
};
