module.exports = {
    default: {
        builder: 'bem-tools',
        command: 'npm run build',
        copy: ['*.sets'],
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
            require('../src/commands/remove-output'),
            require('../src/commands/create-output'),
            require('../src/commands/git-clone'),
            require('../src/commands/git-checkout'),
            require('../src/commands/npm-install'),
            require('../src/commands/npm-run-deps'),
            require('../src/commands/npm-install-bem-sets'),
            require('../src/commands/npm-install-bem'),
            require('../src/commands/copy-borschik'),
            require('../src/commands/npm-run-build'),
            require('../src/commands/copy-sets'),
            require('../src/commands/collect-sets')
        ],
        custom: []
    }
}
