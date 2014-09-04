module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production enb make examples && enb make docs',
        copy: ['*.docs', '*.examples'],
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
            jsdoc: '%s.jsdoc.html'
        },
        tasks: [
            require('../src/commands/remove-output'),
            require('../src/commands/create-output'),
            require('../src/commands/git-clone'),
            require('../src/commands/git-checkout'),
            require('../src/commands/npm-install'),
            require('../src/commands/npm-run-deps'),
            require('../src/commands/copy-borschik'),
            require('../src/commands/npm-run-build'),
            require('../src/commands/copy-sets'),
            require('../src/commands/collect-sets')
        ]
    }
};
