module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production enb make __magic__ desktop.examples desktop.tests desktop.docs ' +
            'touch-pad.examples touch-pad.tests touch-pad.docs touch-phone.examples ' +
            'touch-phone.tests touch-phone.docs && enb make *.pages/*',
        copy: ['*.docs', '*.tests', '*.examples'],
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
            require('../src/tasks/remove-output'),
            require('../src/tasks/create-output'),
            require('../src/tasks/git-clone'),
            require('../src/tasks/git-checkout'),
            require('../src/tasks/npm-install'),
            require('../src/tasks/npm-run-deps'),
            require('../src/tasks/copy-borschik'),
            require('../src/tasks/npm-run-build'),
            require('../src/tasks/copy-sets'),
            require('../src/tasks/collect-sets')
        ]
    }
};
