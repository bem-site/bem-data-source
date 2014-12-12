module.exports = {
    default: {
        builder: 'bem-tools',
        command: 'npm run build',
        rsync: {
            targets: ['*.sets']
        },
        docs: {
            readme: { folder: '', pattern: 'README.md' },
            changelog: { folder: 'releases', pattern: 'changelog.md' },
            migration: { folder: 'releases', pattern: 'migration.md' },
            notes: { folder: 'releases', pattern: 'release-notes.md' }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        tasks: [
            require('../src/tasks/collect-sets'),
            require('../src/tasks/process-examples')
        ],
        custom: []
    }
};
