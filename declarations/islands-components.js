module.exports = {
    default: {
        builder: 'enb',
        command: 'npm run build',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        copy: ['*.docs', '*.tests', '*.examples'],
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
