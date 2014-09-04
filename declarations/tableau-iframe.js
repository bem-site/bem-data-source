module.exports = {
    default: {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            }
        },
        tasks: [
            require('../src/commands/remove-output'),
            require('../src/commands/create-output'),
            require('../src/commands/git-clone'),
            require('../src/commands/git-checkout'),
            require('../src/commands/collect-sets')
        ]
    }
};
