module.exports = {
    default: {
        builder: 'bem-tools',
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
        custom: []
    }
};
