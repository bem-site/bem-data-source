module.exports = {
    default: {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            }
        },
        tasks: [
            require('../src/tasks/remove-output'),
            require('../src/tasks/create-output'),
            require('../src/tasks/git-clone'),
            require('../src/tasks/git-checkout'),
            require('../src/tasks/collect-sets')
        ]
    }
};
