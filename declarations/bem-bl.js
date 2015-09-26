module.exports = {
    default: {
        builder: 'enb',
        docDirs: '*.docs',
        rsync: {
            targets: ['*.examples']
        },
        docs: {
            readme: {
                folder: '',
                pattern: {
                    en: 'README.md',
                    ru: 'README.ru.md'
                }
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html',
            blocksData: '%s.source-files.json',
            examplesData: '%s.examples-files.json'
        }
    }
};
