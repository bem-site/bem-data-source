module.exports = {
    default: {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            },
            changelog: {
                folder: '',
                pattern: 'CHANGELOG.md'
            }
        },
        tasks: [
            require('../src/tasks/collect-sets')
        ]
    }
};
