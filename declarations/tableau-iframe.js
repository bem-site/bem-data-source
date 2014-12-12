module.exports = {
    default: {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            }
        },
        tasks: [
            require('../src/tasks/collect-sets')
        ]
    }
};
