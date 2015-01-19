module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production magic run docs examples',
        docDirs: '*.docs',
        rsync: {
            levels: ['desktop', 'touch'],
            targets: ['*.docs', '*.examples']
        },
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
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
