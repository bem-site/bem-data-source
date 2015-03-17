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
        }
    }
};
