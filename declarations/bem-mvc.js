module.exports = {
    default: {
        builder: 'enb',
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
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.js-doc.html',
            blocksData: '%s.source-files.json',
            examplesData: '%s.examples-files.json'
        }
    }
};
