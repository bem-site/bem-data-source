module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production enb make docs && enb make examples',
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
        tasks: [
            require('../src/tasks/collect-sets'),
            require('../src/tasks/process-examples')
        ]
    }
};
